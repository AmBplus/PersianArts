#!/usr/bin/env python3
"""music_map.py - beat grid, drum hits, energy and structure sidecar for ONE music track.

Method: video-shotcraft references/music-beat-sync.md (music first, picture cut to the grid):
  1. librosa beat_track(tightness=400) -> least-squares even grid t_i = t0 + i*T
     (the tempo scalar is never trusted; we also refine the line on real drum transients).
  2. 0.5x / 1x / 2x candidate grids (both phases of 0.5x) scored on kick+snare transients.
  3. Drum transients per band: kick 40-160 Hz, snare 150-500 Hz AND 1-3 kHz, hihat 6-14 kHz.
  4. Acceptance gates: match >= 98 %, mean_abs < 10 ms, drift < 5 ms, first beat on a real attack.
  5. RMS per bar + drum density -> sections, top hits, safe cut bars.

Usage:
  python3 sound/tools/music_map.py track.mp3 [--out track.music.json] [--click click.wav] [--bars 4]

All times are float seconds; nothing is rounded to frames here.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import warnings

import numpy as np

SCHEMA = "persianarts.music_map/1"

# ---- documented constants (change here, they are echoed into the sidecar) -------------------------
SCORE_TOL_S = 0.035      # candidate scoring tolerance
PRIOR_BPM = (70.0, 180.0)  # candidate outside this range: score x0.5
TOL_S = 0.035            # a grid beat "hits" a transient if one lies within +-35 ms (~1 frame at 30 fps)
MATCH_MIN = 0.98         # gate: match
MEAN_ABS_MAX_MS = 10.0   # gate: mean absolute alignment error
DRIFT_MAX_MS = 5.0       # gate: cumulative drift over the whole track
STRONG_S = 0.30          # kick/snare hit counts as "strong" (candidate scoring, activity mask)
ACTIVE_WINDOW_S = 3.0    # a beat is drum-active if >= 3 strong drum events lie in each of the 3 s before and after it
ACTIVE_MIN_HITS = 3
MIN_ACTIVE_FRAC = 0.30   # fewer drum-active beats than this -> cannot validate a grid
MIN_ACTIVE_BEATS = 16
FULL_ENERGY = 0.70       # section: bar energy (0..1) at/above this + enough drums = "full"
FULL_DRUMS_PER_BEAT = 0.50
BUILD_MIN_RISE = 0.15    # section: energy rise needed to call the end of a low run a "build"
BUILD_MAX_BARS = 8
MIN_RUN_BARS = 2         # shorter full / low runs are merged into their neighbours
SAFE_ENERGY_DELTA = 0.12  # safe cut: |energy(bar) - energy(bar-1)| below this counts as "stable"
FLUX_K = 1               # flux = c[n+K] - c[n-K] (frames of ~3 ms)
LEAD_FRAC = 0.60         # transient time = leading edge at 60 % of the flux peak (residual bias < 4 ms early)
MIN_HIT_GAP_BEATS = 16   # top hits are >= 16 beats apart (shotcraft full-frame impact rule)

BANDS = {  # name: (lo Hz, hi Hz, rms window s)
    "kick": (40.0, 160.0, 0.008),
    "snare_body": (150.0, 500.0, 0.008),
    "snare_face": (1000.0, 3000.0, 0.005),
    "hihat": (6000.0, 14000.0, 0.003),
}


# ================================================================================================
# loading
# ================================================================================================
def load_audio(path: str):
    """Return (mono float32, sr, stereo int16 (n,ch), md5 of decoded int16 PCM)."""
    import soundfile as sf

    data, sr = sf.read(path, dtype="int16", always_2d=True)
    md5 = hashlib.md5(data.tobytes()).hexdigest()
    y = (data.astype(np.float32) / 32768.0).mean(axis=1)
    return y, int(sr), data, md5


# ================================================================================================
# transients
# ================================================================================================
def _band_flux(x: np.ndarray, sr: int, lo: float, hi: float, win_s: float, hop: int):
    """Zero-phase band-pass -> sqrt(RMS) envelope -> centred half-wave-rectified difference.

    Zero-phase filtering and a centred difference keep the time axis unbiased (a plain librosa
    onset_strength with n_fft 2048 reports hits ~10-20 ms early).
    """
    from scipy.signal import butter, sosfiltfilt

    hi = min(hi, 0.45 * sr)
    sos = butter(2, [lo, hi], btype="band", fs=sr, output="sos")  # filtfilt doubles the order
    b = sosfiltfilt(sos, x).astype(np.float32)
    w = max(3, int(round(win_s * sr)))
    # trailing window (value at t covers [t-W, t]) so the envelope cannot rise before the attack
    pw = np.pad(b * b, (w, 0))
    cs = np.cumsum(pw, dtype=np.float64)
    ms = (cs[w:] - cs[:-w]) / w
    env = np.sqrt(np.maximum(ms[::hop], 0.0))
    c = np.sqrt(env + 1e-9)
    k = FLUX_K
    flux = np.zeros_like(c)
    flux[k:-k] = np.maximum(c[2 * k:] - c[: -2 * k], 0.0)
    return flux


def _pick(flux: np.ndarray, ft: np.ndarray, min_gap_s: float, thr_rel: float, ref: float):
    from scipy.signal import find_peaks

    if ref <= 0:
        return np.zeros(0), np.zeros(0)
    dt = ft[1] - ft[0]
    pk, _ = find_peaks(flux, height=thr_rel * ref, distance=max(1, int(min_gap_s / dt)))
    if len(pk) == 0:
        return np.zeros(0), np.zeros(0)
    # leading edge: walk left from the flux maximum to where it first drops below LEAD_FRAC of the
    # peak (interpolated). The flux maximum of a slow low-band kick is 10-25 ms after its attack.
    t = np.empty(len(pk))
    for n_, p_ in enumerate(pk):
        h = flux[p_]
        lvl = LEAD_FRAC * h
        i = p_
        lim = max(0, p_ - int(0.045 / dt))
        while i > lim and flux[i - 1] >= lvl:
            i -= 1
        if i > 0 and flux[i] > lvl and flux[i - 1] < lvl:
            fr = (lvl - flux[i - 1]) / (flux[i] - flux[i - 1] + 1e-12)
            t[n_] = ft[i - 1] + fr * dt
        else:
            t[n_] = ft[i]
    s = np.minimum(1.0, flux[pk] / ref)
    return t, s


def detect_transients(y: np.ndarray, sr: int, use_hpss: bool = False):
    """Return dict of per-class transients {kick,snare,hihat: (t, s)} and the kick flux curve."""
    import librosa

    x = y
    if use_hpss:
        x = librosa.effects.percussive(y, margin=1.0)
    hop = max(1, int(round(0.003 * sr)))  # ~3 ms
    fl = {n: _band_flux(x, sr, lo, hi, w, hop) for n, (lo, hi, w) in BANDS.items()}
    ft = np.arange(len(fl["kick"])) * hop / sr

    def ref(a):
        return float(np.percentile(a[a > 0], 99.5)) if np.any(a > 0) else 0.0

    r_k, r_sb, r_sf, r_h = (ref(fl[n]) for n in ("kick", "snare_body", "snare_face", "hihat"))
    kt, ks = _pick(fl["kick"], ft, 0.060, 0.15, r_k)
    # snare needs BOTH the body and the stick face: geometric mean of the normalised band fluxes
    snare_f = np.sqrt((fl["snare_body"] / max(r_sb, 1e-9)) * (fl["snare_face"] / max(r_sf, 1e-9)))
    st, ss = _pick(snare_f, ft, 0.060, 0.15, float(np.percentile(snare_f[snare_f > 0], 99.5)) if np.any(snare_f > 0) else 0.0)
    ht, hs = _pick(fl["hihat"], ft, 0.040, 0.25, r_h)
    # a snare that is only a kick's click: drop it when a kick at the same time is >2x as strong
    if len(st) and len(kt):
        j = np.clip(np.searchsorted(kt, st), 1, len(kt) - 1)
        near = np.where(np.abs(kt[j - 1] - st) < np.abs(kt[j] - st), j - 1, j)
        close = np.abs(kt[near] - st) < 0.020
        keep = ~(close & (ks[near] > 2.0 * ss))
        st, ss = st[keep], ss[keep]
    return {
        "kick": (kt, ks), "snare": (st, ss), "hihat": (ht, hs),
        "_kick_flux": (ft, fl["kick"], r_k),
    }


CLUSTER_S = 0.020
CLASS_W = {"kick": 0.5, "snare": 1.0, "hihat": 1.0}   # time weight: low-band kicks rise late
F_BETA = 0.5                                          # precision counts more than recall


def cluster_hits(tr):
    """Merge simultaneous kick/snare/hihat hits (<= 20 ms apart) into drum events.

    On a real beat all drums land together, so the event time is the strength-weighted mean with
    the (late-rising) kick down-weighted. strong = event contains a kick or snare hit >= STRONG_S.
    Returns (t, s, strong) sorted by time."""
    ev = [(float(t), float(s), k) for k in ("kick", "snare", "hihat") for t, s in zip(*tr[k])]
    ev.sort()
    ts, ss, st = [], [], []
    cur = []

    def close():
        if not cur:
            return
        w = np.array([CLASS_W[k] * max(s, 1e-3) for _, s, k in cur])
        ts.append(float(np.dot(w, [t for t, _, _ in cur]) / w.sum()))
        ss.append(max(s for _, s, _ in cur))
        st.append(any(k != "hihat" and s >= STRONG_S for _, s, k in cur))

    for e in ev:
        if cur and e[0] - cur[0][0] > CLUSTER_S:
            close()
            cur = []
        cur.append(e)
    close()
    return np.array(ts), np.array(ss), np.array(st, dtype=bool)


def _merge_sorted(*pairs):
    ts = np.concatenate([p[0] for p in pairs]) if pairs else np.zeros(0)
    ss = np.concatenate([p[1] for p in pairs]) if pairs else np.zeros(0)
    o = np.argsort(ts)
    return ts[o], ss[o]


def _nearest(times: np.ndarray, q: np.ndarray):
    """Nearest element of sorted `times` for each q -> (index, signed distance times-q)."""
    if len(times) == 0:
        return np.full(len(q), -1), np.full(len(q), np.inf)
    j = np.clip(np.searchsorted(times, q), 1, len(times) - 1) if len(times) > 1 else np.zeros(len(q), int)
    if len(times) > 1:
        left = np.abs(times[j - 1] - q) <= np.abs(times[j] - q)
        j = np.where(left, j - 1, j)
    return j, times[j] - q


# ================================================================================================
# grid
# ================================================================================================
def beat_track_grid(y: np.ndarray, sr: int):
    """Step 1 of the method: beat_track(tightness=400) + lstsq line. Returns (T, t0, tempo_scalar, n_beats)."""
    import librosa

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, tightness=400, units="time")
    tempo = float(np.atleast_1d(tempo)[0])
    beats = np.asarray(beats, dtype=float)
    if len(beats) < 4:
        T = 60.0 / tempo if tempo > 0 else 0.5
        return T, 0.0, tempo, len(beats)
    i = np.arange(len(beats))
    A = np.vstack([i, np.ones_like(i, dtype=float)]).T
    (T, t0), *_ = np.linalg.lstsq(A, beats, rcond=None)
    return float(T), float(t0), tempo, len(beats)


def _grid_indices(T, t0, dur):
    return np.arange(int(np.ceil((0.0 - t0) / T)), int(np.floor((dur - t0) / T)) + 1)


def refine_grid(T, t0, trans_t, dur, active_fn, tols=(0.060, 0.040, 0.025)):
    """Re-fit the line on real transients (nearest to each grid point, within a shrinking tolerance,
    drum-active region only, outliers trimmed). Fixes the phase bias of beat_track (hop 512)."""
    ok = False
    for tol in tols:
        tol = min(tol, 0.25 * T)
        idx = _grid_indices(T, t0, dur)
        g = t0 + idx * T
        sel = active_fn(g)
        if sel.sum() < 8:
            break
        j, d = _nearest(trans_t, g[sel])
        m = np.abs(d) < tol
        if m.sum() < 8:
            break
        ii, tt = idx[sel][m], trans_t[j][m]
        for _ in range(2):  # trimmed lstsq
            p = np.polyfit(ii, tt, 1)
            r = tt - np.polyval(p, ii)
            keep = np.abs(r) <= max(2.5 * 1.4826 * np.median(np.abs(r - np.median(r))), 0.002)
            if keep.sum() < 8:
                break
            ii, tt = ii[keep], tt[keep]
        p = np.polyfit(ii, tt, 1)
        T, t0 = float(p[0]), float(p[1])
        ok = True
    return T, t0, ok


def evaluate_grid(T, t0, dur, strong_t, drum_t, active_fn, tol=TOL_S, score_tol=SCORE_TOL_S):
    """Gate metrics for one grid over its drum-active beats."""
    idx = _grid_indices(T, t0, dur)
    g = t0 + idx * T
    n_all = len(g)
    act = active_fn(g)
    ga, ia = g[act], idx[act]
    out = {"beats_total": int(n_all), "beats_scored": int(len(ga))}
    if len(ga) == 0:
        out.update(match=0.0, match_strong=0.0, mean_abs_ms=None, drift_ms=None, precision=0.0, recall=0.0, f1=0.0)
        return out
    js, ds = _nearest(strong_t, ga)
    jd, dd = _nearest(drum_t, ga)
    m_s = np.abs(ds) < tol
    m_d = (np.abs(dd) < tol) | m_s
    precision = float((np.abs(ds) < score_tol).mean())
    # recall: share of strong transients that sit on a grid point
    if len(strong_t):
        gi = np.arange(len(g))
        jj, dg = _nearest(g, strong_t)
        recall = float((np.abs(dg) < score_tol).mean())
    else:
        recall = 0.0
    b2 = F_BETA ** 2
    f1 = 0.0 if precision + recall == 0 else (1 + b2) * precision * recall / (b2 * precision + recall)
    # mean_abs on strong hits when they cover most beats, else on any drum transient
    if m_s.mean() >= 0.5:
        mean_abs = float(np.mean(np.abs(ds[m_s])) * 1000)
        res_t, res_i, res_tt = ga[m_s], ia[m_s], strong_t[js][m_s]
    else:
        mm = np.abs(dd) < tol
        mean_abs = float(np.mean(np.abs(dd[mm])) * 1000) if mm.any() else None
        res_t, res_i, res_tt = ga[mm], ia[mm], drum_t[jd][mm]
    # drift: residual of the matched hits against the grid line, median per quarter of the track;
    # drift = range of the four medians (catches a linear tempo error AND a tempo ramp / free tempo)
    drift = None
    if len(res_i) >= 16:
        resid = (res_tt - res_t) * 1000.0
        qs = np.array_split(np.arange(len(resid)), 4)
        meds = [float(np.median(resid[q])) for q in qs if len(q) >= 3]
        if len(meds) == 4:
            drift = float(max(meds) - min(meds))
    out.update(match=float(m_d.mean()), match_strong=float(m_s.mean()), mean_abs_ms=mean_abs, drift_ms=drift,
               precision=precision, recall=recall, f1=float(f1))
    return out


def tempo_prior(bpm):
    """Soft prior against absurd tempi so a half-time / double-time grid cannot win on a tie."""
    return 1.0 if PRIOR_BPM[0] <= bpm <= PRIOR_BPM[1] else 0.5


def select_grid(T_init, t0_init, dur, kick_t, strong_t, drum_t):
    """Score 0.5x(two phases) / 1x / 2x candidates on KICK coverage (the method's criterion: kicks
    must sit on whole beats). strong_t = kick+snare, used only for the drum-activity mask."""
    # drum activity mask: >= ACTIVE_MIN_HITS strong events in the ACTIVE_WINDOW_S before and after
    def active_fn(times):
        if len(strong_t) == 0:
            return np.zeros(len(times), bool)
        lo = np.searchsorted(strong_t, times - ACTIVE_WINDOW_S)
        mid = np.searchsorted(strong_t, times)
        hi = np.searchsorted(strong_t, times + ACTIVE_WINDOW_S)
        return ((mid - lo) >= ACTIVE_MIN_HITS) & ((hi - mid) >= ACTIVE_MIN_HITS)

    specs = [("1x", 1.0, T_init, t0_init),
             ("2x", 2.0, T_init / 2, t0_init),
             ("0.5x-a", 0.5, T_init * 2, t0_init),
             ("0.5x-b", 0.5, T_init * 2, t0_init + T_init)]
    cands = []
    for cid, fac, T, t0 in specs:
        T2, t02, ok = refine_grid(T, t0, kick_t if len(kick_t) >= 20 else strong_t, dur, active_fn)
        ev = evaluate_grid(T2, t02, dur, kick_t, drum_t, active_fn)
        pr = tempo_prior(60.0 / T2)
        cands.append({"id": cid, "factor": fac, "bpm": 60.0 / T2, "beat_s": T2, "phase_t0": t02, "refined": ok,
                      "prior": pr, "score": ev["f1"] * pr, **ev})
    best = max(cands, key=lambda c: (round(c["score"], 3), c["factor"] == 1.0))
    return cands, best, active_fn


# ================================================================================================
# bars, downbeat, energy, sections
# ================================================================================================
def downbeat_phase(beat_t, T, strong_t, strong_s, rms_t, rms, m):
    """Pick which of m beat phases is the bar start: accents + energy change (phrase boundaries)."""
    n = len(beat_t)
    if n < 4 * m + 4:
        return 0, 0.0
    j, d = _nearest(strong_t, beat_t) if len(strong_t) else (np.zeros(n, int), np.full(n, np.inf))
    acc = np.where(np.abs(d) < TOL_S, strong_s[np.clip(j, 0, max(len(strong_s) - 1, 0))] if len(strong_s) else 0.0, 0.0)
    r = np.interp(beat_t + 0.5 * T, rms_t, rms)
    w = 2 * m
    nov = np.zeros(n)
    for i in range(w, n - w):
        nov[i] = abs(r[i:i + w].mean() - r[i - w:i].mean())
    nov = nov / (nov.mean() + 1e-9)
    acc = acc / (acc.mean() + 1e-9)
    score = np.array([nov[p::m].sum() + 0.5 * acc[p::m].sum() for p in range(m)])
    best = int(np.argmax(score))
    others = np.delete(score, best)
    conf = float((score[best] - others.max()) / (score[best] + 1e-9))
    return (best if conf >= 0.08 else 0), max(conf, 0.0)


def beats_per_bar(beat_t, strong_t, strong_s, T):
    """4 unless the strength sequence is clearly 3-periodic (autocorrelation lag 3 >> lag 4)."""
    if len(strong_t) == 0 or len(beat_t) < 24:
        return 4
    j, d = _nearest(strong_t, beat_t)
    a = np.where(np.abs(d) < TOL_S, strong_s[j], 0.0)
    a = a - a.mean()
    den = float((a * a).sum()) + 1e-12
    ac = lambda L: float((a[:-L] * a[L:]).sum() / den)
    return 3 if (ac(3) > 0.3 and ac(3) > 1.25 * max(ac(4), 0.0) + 0.05 and ac(6) > ac(8)) else 4


def classify_sections(e, drums):
    """Per-bar section kinds (documented heuristic). e: energy 0..1, drums: strong hits per beat."""
    nb = len(e)
    if nb == 0:
        return []
    full = (e >= FULL_ENERGY) & (drums >= FULL_DRUMS_PER_BEAT)
    if not full.any():
        return [{"kind": "full", "from_bar": 0, "to_bar": nb}]

    def runs(mask):
        out, s = [], None
        for i, v in enumerate(list(mask) + [None]):
            if v and s is None:
                s = i
            elif not v and s is not None:
                out.append([s, i]); s = None
        return out

    # drop 1-bar blips (a drum fill inside a break, a one-bar dropout inside a full run)
    for a, b in runs(full):
        if b - a < MIN_RUN_BARS:
            full[a:b] = False
    for a, b in runs(~full):
        if b - a < MIN_RUN_BARS and a > 0 and b < nb:
            full[a:b] = True
    if not full.any():
        return [{"kind": "full", "from_bar": 0, "to_bar": nb}]
    kinds = np.array(["full"] * nb, dtype=object)
    first_full = int(np.argmax(full))
    last_full = nb - 1 - int(np.argmax(full[::-1]))
    for a, b in runs(~full):
        if b <= first_full:
            kind = "intro"
        elif a > last_full:
            kind = "outro"
        else:
            kind = "breakdown"
        kinds[a:b] = kind
        # "build": rising tail of a low run that leads into full energy (intro or breakdown)
        if kind in ("intro", "breakdown") and b < nb and full[b]:
            k = b
            while k - 1 >= a and b - (k - 1) <= BUILD_MAX_BARS and e[k - 1] <= e[k] + 0.02:
                k -= 1
            if b - k >= 2 and e[b - 1] - e[k] >= BUILD_MIN_RISE:
                kinds[k:b] = "build"
    out = []
    for i in range(nb):
        if out and out[-1]["kind"] == kinds[i]:
            out[-1]["to_bar"] = i + 1
        else:
            out.append({"kind": str(kinds[i]), "from_bar": i, "to_bar": i + 1})
    return out


# ================================================================================================
# main analysis
# ================================================================================================
def analyze(path: str, bars: int = 4, use_hpss: bool = False, log=lambda *_: None):
    import librosa
    import scipy

    warnings.filterwarnings("ignore")
    y, sr, pcm, md5 = load_audio(path)
    dur = len(y) / sr
    log(f"loaded {os.path.basename(path)} {dur:.1f}s sr={sr}")
    x = librosa.effects.percussive(y, margin=1.0) if use_hpss else y
    T0, t00, tempo_scalar, n_bt = beat_track_grid(x, sr)
    log(f"beat_track: scalar {tempo_scalar:.2f} bpm, lstsq {60 / T0:.2f} bpm ({n_bt} beats)")
    tr = detect_transients(y, sr, use_hpss=use_hpss)
    cl_t, cl_s, cl_strong = cluster_hits(tr)
    strong = (cl_t[cl_strong], cl_s[cl_strong])
    drum = (cl_t, cl_s)
    log(f"transients: kick {len(tr['kick'][0])} snare {len(tr['snare'][0])} hihat {len(tr['hihat'][0])}")

    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    rms_t = librosa.times_like(rms, sr=sr, hop_length=512)

    result = {
        "schema": SCHEMA,
        "file": os.path.basename(path),
        "md5_pcm": md5,
        "decoder": f"soundfile {__import__('soundfile').__version__} (libsndfile {__import__('soundfile').__libsndfile_version__}), int16 PCM, native rate",
        "sample_rate": sr,
        "duration_s": round(dur, 4),
        "tool": {"librosa": librosa.__version__, "scipy": scipy.__version__, "numpy": np.__version__},
    }
    reasons = []
    if len(strong[0]) < 2 * MIN_ACTIVE_BEATS:
        reasons.append(f"too few strong kick/snare hits ({len(strong[0])}) to validate a grid")

    cands, win, active_fn = select_grid(T0, t00, dur, strong[0], strong[0], drum[0])
    T, g0 = win["beat_s"], win["phase_t0"]
    idx = _grid_indices(T, g0, dur)
    beat_t = g0 + idx * T                     # all grid beats inside the file (first one >= 0)
    # ---- gates -----------------------------------------------------------------------------
    act_frac = win["beats_scored"] / max(win["beats_total"], 1)
    if win["beats_scored"] < MIN_ACTIVE_BEATS or act_frac < MIN_ACTIVE_FRAC:
        reasons.append(f"drum-active beats {win['beats_scored']}/{win['beats_total']} ({act_frac:.0%}) below minimum")
    if win["match"] < MATCH_MIN:
        reasons.append(f"match {win['match']:.1%} < {MATCH_MIN:.0%}")
    if win["mean_abs_ms"] is None or win["mean_abs_ms"] >= MEAN_ABS_MAX_MS:
        reasons.append(f"mean_abs {None if win['mean_abs_ms'] is None else round(win['mean_abs_ms'], 1)} ms >= {MEAN_ABS_MAX_MS:.0f} ms")
    if win["drift_ms"] is None:
        reasons.append("drift could not be measured (too few matched beats)")
    elif win["drift_ms"] >= DRIFT_MAX_MS:
        reasons.append(f"drift {win['drift_ms']:.1f} ms >= {DRIFT_MAX_MS:.0f} ms (tempo not constant / free tempo)")
    # beat 0 on a real attack: the grid beat nearest to the first strong hit must lie on it
    # the first drum-active grid beat must sit on a real strong attack (within 15 ms)
    first_ok, first_attack_beat = False, None
    act_idx = np.where(active_fn(beat_t))[0]
    if len(act_idx) and len(strong[0]):
        k = int(act_idx[0])
        _, dd0 = _nearest(strong[0], beat_t[k:k + 1])
        first_ok = bool(abs(dd0[0]) < 0.015)
        first_attack_beat = k
        if not first_ok:
            reasons.append(f"first drum-active grid beat ({beat_t[k]:.3f}s) is {abs(dd0[0]) * 1000:.0f} ms from the nearest drum attack")

    # ---- bars / downbeat -------------------------------------------------------------------
    m = beats_per_bar(beat_t, strong[0], strong[1], T)
    p, dconf = downbeat_phase(beat_t, T, strong[0], strong[1], rms_t, rms, m)
    t0 = float(beat_t[p])  # beat 0 = first downbeat (p pickup beats precede it); p=0 when unsure
    beat_t = beat_t[p:]
    bar_s = m * T
    n_bars = int((dur - t0) // bar_s)
    if (dur - t0) - n_bars * bar_s >= 0.5 * bar_s:
        n_bars += 1
    n_bars = max(n_bars, 0)
    edges = t0 + np.arange(n_bars + 1) * bar_s
    e_raw = np.array([rms[(rms_t >= edges[b]) & (rms_t < edges[b + 1])].mean() if np.any((rms_t >= edges[b]) & (rms_t < edges[b + 1])) else 0.0
                      for b in range(n_bars)])
    energy = np.clip(e_raw / (np.percentile(e_raw, 98) + 1e-12), 0, 1) if n_bars else e_raw
    sh_t = strong[0]
    drums = np.array([((sh_t >= edges[b]) & (sh_t < edges[b + 1])).sum() / m for b in range(n_bars)])
    sections = classify_sections(energy, drums)

    # ---- impacts ---------------------------------------------------------------------------
    imp = []
    for kname, (tt, ss) in (("kick", tr["kick"]), ("snare", tr["snare"]), ("hihat", tr["hihat"])):
        for t_, s_ in zip(tt, ss):
            imp.append({"t": round(float(t_), 4), "s": round(float(s_), 3), "k": kname})
    imp.sort(key=lambda d: d["t"])

    # ---- top hits (strongest kick/snare on a grid beat; drops/entrances preferred) ---------
    top = []
    if len(strong[0]) and len(beat_t):
        j, d = _nearest(strong[0], beat_t)
        on = np.abs(d) < TOL_S
        rr = lambda t: float(np.interp(t, rms_t, rms))
        cls = {}
        for kname in ("kick", "snare"):
            for t_, s_ in zip(*tr[kname]):
                cls[round(float(t_), 6)] = (kname, float(s_))
        scored = []
        for bi in np.where(on)[0]:
            ht = float(strong[0][j[bi]])
            after, before = rr(ht + T), rr(max(ht - 2 * T, 0.0))
            contrast = float(np.clip((after - before) / (after + 1e-9), 0.0, 1.0))
            sc = float(strong[1][j[bi]]) * (0.5 + 0.5 * contrast)
            kname = cls.get(round(ht, 6), ("kick", 0.0))[0]
            scored.append((sc, int(bi), ht, kname))
        for sc, bi, ht, kname in sorted(scored, reverse=True):
            if all(abs(bi - o["beat_index"]) >= MIN_HIT_GAP_BEATS for o in top):
                top.append({"t": round(ht, 4), "bar": int(bi // m), "beat": int(bi % m), "beat_index": int(bi),
                            "s": round(float(min(1.0, sc)), 3), "k": kname})
            if len(top) == 3:
                break

    # ---- safe cuts -------------------------------------------------------------------------
    bounds = {s["from_bar"] for s in sections} | {s["to_bar"] for s in sections}
    safe = []
    for b in range(bars, max(n_bars - 1, 0), bars):
        if b >= n_bars:
            break
        on_attack = False
        if len(strong[0]):
            _, dd = _nearest(strong[0], np.array([edges[b]]))
            on_attack = bool(abs(dd[0]) < TOL_S)
        stable = abs(energy[b] - energy[b - 1]) < SAFE_ENERGY_DELTA
        if on_attack and (b in bounds or stable):
            safe.append(b)

    verdict = "PASS" if not reasons else "FAIL"
    grid = {
        "verdict": verdict,
        "reasons": reasons,
        "winner": win["id"],
        "winner_reason": f"highest drum-event coverage F0.5 x tempo prior (precision {win['precision']:.3f}, recall {win['recall']:.3f}, prior {win['prior']}); ties prefer 1x",
        "match": round(win["match"], 4),
        "match_strong": round(win["match_strong"], 4),
        "mean_abs_ms": None if win["mean_abs_ms"] is None else round(win["mean_abs_ms"], 2),
        "drift_ms": None if win["drift_ms"] is None else round(win["drift_ms"], 2),
        "first_beat_on_attack": first_ok,
        "first_attack_beat": first_attack_beat,  # index of the first drum-active grid beat
        "beats_total": win["beats_total"],
        "beats_scored": win["beats_scored"],
        "active_fraction": round(act_frac, 3),
        "downbeat_pickup_beats": int(p),
        "downbeat_confidence": round(dconf, 3),
        "beat_track_tempo": round(tempo_scalar, 3),
        "beat_track_lstsq_bpm": round(60.0 / T0, 3),
        "gates": {"match_min": MATCH_MIN, "mean_abs_max_ms": MEAN_ABS_MAX_MS, "drift_max_ms": DRIFT_MAX_MS,
                  "tol_ms": TOL_S * 1000, "first_beat_tol_ms": 15.0},
        "candidates": [{"id": c["id"], "factor": c["factor"], "bpm": round(c["bpm"], 3), "beat_s": round(c["beat_s"], 6),
                        "score": round(c["score"], 4), "f1": round(c["f1"], 4), "prior": c["prior"], "precision": round(c["precision"], 4), "recall": round(c["recall"], 4),
                        "match": round(c["match"], 4),
                        "mean_abs_ms": None if c["mean_abs_ms"] is None else round(c["mean_abs_ms"], 2),
                        "drift_ms": None if c["drift_ms"] is None else round(c["drift_ms"], 2)} for c in cands],
    }
    result.update({
        "bpm": round(60.0 / T, 4),
        "t0": round(t0, 5),
        "beat_s": round(T, 7),
        "beats_per_bar": int(m),
        "bar_s": round(bar_s, 6),
        "n_bars": int(n_bars),
        "grid": grid,
        "impacts": imp,
        "energy_per_bar": [round(float(v), 3) for v in energy],
        "drum_hits_per_beat_per_bar": [round(float(v), 3) for v in drums],
        "sections": sections,
        "top_hits": top,
        "safe_cuts": safe,
        "safe_cut_phrase_bars": bars,
        "thresholds": {"strong_s": STRONG_S, "full_energy": FULL_ENERGY, "full_drums_per_beat": FULL_DRUMS_PER_BEAT,
                       "build_min_rise": BUILD_MIN_RISE, "build_max_bars": BUILD_MAX_BARS, "min_run_bars": MIN_RUN_BARS,
                       "safe_energy_delta": SAFE_ENERGY_DELTA, "min_hit_gap_beats": MIN_HIT_GAP_BEATS, "hpss": bool(use_hpss)},
    })
    return result, (y, sr, pcm)


# ================================================================================================
# click track
# ================================================================================================
def write_click(path: str, sidecar: dict, pcm: np.ndarray, sr: int, seconds: float = 0.0):
    """Original + short clicks on the fitted beats (higher/louder on downbeats). Monitoring only."""
    import soundfile as sf

    x = pcm.astype(np.float32) / 32768.0
    if seconds and seconds > 0:
        x = x[: int(seconds * sr)]
    n = len(x)
    clicks = np.zeros(n, np.float32)
    T, t0, m = sidecar["beat_s"], sidecar["t0"], sidecar["beats_per_bar"]

    def burst(freq, dur, amp):
        t = np.arange(int(dur * sr)) / sr
        return (amp * np.sin(2 * np.pi * freq * t) * np.exp(-t / (dur / 4))).astype(np.float32)

    lo, hi = burst(1000, 0.030, 0.55), burst(1800, 0.045, 0.85)
    i = 0
    while True:
        t = t0 + i * T
        s = int(round(t * sr))
        if s >= n:
            break
        b = hi if i % m == 0 else lo
        e = min(n, s + len(b))
        if s >= 0:
            clicks[s:e] += b[: e - s]
        i += 1
    mix = x * 0.8 + clicks[:, None] if x.ndim == 2 else x * 0.8 + clicks
    mix = np.clip(mix, -1.0, 1.0)
    if path.lower().endswith(".mp3"):
        tmp = path + ".tmp.wav"
        sf.write(tmp, mix, sr, subtype="PCM_16")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-b:a", "128k", path], check=True)
        os.remove(tmp)
    else:
        sf.write(path, mix, sr, subtype="PCM_16")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Beat grid + drum hits + structure sidecar for one track.")
    ap.add_argument("audio")
    ap.add_argument("--out", help="sidecar JSON (default: <audio>.music.json next to the audio)")
    ap.add_argument("--click", help="write original + clicks on the fitted beats (.wav or .mp3)")
    ap.add_argument("--click-seconds", type=float, default=0.0, help="limit the click preview to the first N seconds")
    ap.add_argument("--bars", type=int, default=4, help="phrase length in bars for safe_cuts (default 4)")
    ap.add_argument("--hpss", action="store_true", help="analyse the percussive component (vocal/pad heavy mixes)")
    a = ap.parse_args(argv)
    res, (y, sr, pcm) = analyze(a.audio, bars=a.bars, use_hpss=a.hpss, log=lambda s: print(s, file=sys.stderr))
    out = a.out or os.path.splitext(a.audio)[0] + ".music.json"
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    g = res["grid"]
    print(f"{res['file']}: {res['bpm']:.2f} bpm t0={res['t0']:.4f}s grid={g['winner']} match={g['match']:.1%} "
          f"mean_abs={g['mean_abs_ms']}ms drift={g['drift_ms']}ms -> {g['verdict']} {'; '.join(g['reasons'])}")
    if a.click:
        write_click(a.click, res, pcm, sr, a.click_seconds)
    return 0


if __name__ == "__main__":
    sys.exit(main())
