"""io_utils.py -- ffmpeg/ffprobe wrappers + WAV/PNG IO for the persian-sound tool.

Only stdlib + numpy + the ffmpeg/ffprobe binaries. All functions are deterministic.
Written without brace-quote adjacency so the file is shell-friendly.
"""
from __future__ import annotations

import atexit
import json
import os
import struct
import subprocess
import wave
import zlib

import numpy as np

SR = 44100  # project sample rate (spec: 44.1 kHz stereo)
TMP_PREFIX = os.path.join(os.environ.get("TEMP", "/tmp"), "persian-sound-")
LBRACE, RBRACE = chr(123), chr(125)


# --------------------------------------------------------------------------- misc

def fnv1a(text: str) -> int:
    """32-bit FNV-1a hash (spec: seed = fnv1a(slug + stem))."""
    h = 0x811C9DC5
    for ch in text.encode("utf-8"):
        h ^= ch
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def run(cmd: list) -> subprocess.CompletedProcess:
    """Run a subprocess; raise with stderr excerpt on failure."""
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        tail = (p.stderr or "")[-600:]
        raise RuntimeError("command failed (%d): %s ...\n%s"
                           % (p.returncode, " ".join(cmd[:6]), tail))
    return p


def ffmpeg(args: list) -> bytes:
    """Run ffmpeg, return raw stdout bytes (used for pcm pipes)."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-nostdin"] + args,
                       capture_output=True)
    if p.returncode != 0:
        raise RuntimeError("ffmpeg failed: " + " ".join(args[:8]) + "\n"
                           + p.stderr.decode("utf-8", "replace")[-600:])
    return p.stdout


def tmp_pcm_file(x: np.ndarray) -> str:
    """Write float32 stereo samples to a temp raw file; removed at exit."""
    path = TMP_PREFIX + "pcm-%d-%d.f32" % (os.getpid(), fnv1a(x.tobytes()[:4096].hex()))
    if not os.path.exists(path):
        x.astype(np.float32).tofile(path)
        atexit.register(os.remove, path)
    return path


def pcm_input_args(x: np.ndarray, sr: int = SR) -> list:
    return ["-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", tmp_pcm_file(x)]
