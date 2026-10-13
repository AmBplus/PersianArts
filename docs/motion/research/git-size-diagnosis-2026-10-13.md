# Git size diagnosis (read-only), 2026-10-13

Scope: read-only. No gc, no history rewrite, no deletions, no pushes, no commits.

## 1. Pack state
- `git count-objects -vH`: in-pack 17,173 objects, 9 packs, size-pack 1.12 GiB, loose 0.
- Largest pack `pack-013f3df7...pack`: 943 MB (modified 2026-10-13 19:28). Second: `pack-03d6478d...pack`: 188 MB. Others < 1 MB.
- Objects: 16,759 total in repo; 15,698 reachable from `--all`; 1,000 unreachable blobs (about 861 MB on disk), 903 of them inside the 943 MB pack.
- Reflog (478 entries) and stash (empty) keep no extra objects: the reflog-only blob count is 0. So the unreachable blobs are dangling and can be pruned.

## 2. Reachable history (--all, 717 commits)
- Reachable blobs: 8,269, about 302 MB on-disk (pack-delta size).
- origin/main alone: 8,193 blobs, 287 MB. Objects reachable only from non-main refs: 76 blobs, 0.8 MB. Old branches are not the problem.
- Refs: 17 entries (main, origin/main, origin/HEAD, feat/persian-shotcraft, pr-6, 12 other origin/* branches, ssh/main, and refs/codex/turn-diffs/checkpoints/...). No tags.

## 3. Top 10 reachable blobs (disk MB, path, first commit, in HEAD)
| MB | path | first added | HEAD |
|---|---|---|---|
| 10.4 | media/dana/Dana-v31.mp4 | 2026-10-12 (d4047681) | yes |
| 8.6 | assets/mechanical-lepidoptera.mp4 | 2026-09-22 | yes |
| 7.6 | assets/readme/lesson.mp4 | 2026-09-26 | yes |
| 6.8 | media/dana/music/persian-ambient-dastgah-vjgalaxy.mp3 | 2026-10-12 | yes |
| 6.4 | media/dana/music/persian-dastgah-vjgalaxy.mp3 | 2026-10-12 | yes |
| 6.0 | media/dana/music/dramatic-documentary-musicdream.mp3 | 2026-10-12 | yes |
| 4.4 | assets/styles.png | 2026-09-22 | no |
| 4.0 | media/dana/music/inspiring-cinematic-Tunetank.mp3 | 2026-10-12 | yes |
| 3.9 | media/dana/music/persian-orient-AntipodeanWriter.mp3 | 2026-10-12 | yes |
| 3.7 | media/dana/music/epic-hollywood-trailer.mp3 | 2026-10-12 | yes |

Remaining top 40: many library/media/shotcraft/*/preview.mp4 (1-1.6 MB each), sound/library/kit/music/*.ogg (1-1.5 MB each), assets/*.gif and *.png.

## 4. Grouped (reachable blobs, disk MB)
- By folder: library 131.0, assets 58.2, media 56.9, sound 17.6, work 12.9, download 4.9, plugins 4.5, other < 2.
- By extension: mp4 153.1 (669 files), mp3 49.9, png 19.5, jpg 15.9, gif 11.9, webp 11.2, ogg 10.3, wav 4.2.
- media/dana (video + 7 music tracks, added 2026-10-12) is the single biggest cluster.

## 5. Size of checkout and fresh clone
- Working tree (HEAD): 4,584 files, 232 MB raw.
- A fresh full clone needs about 300 MB of pack for reachable history, plus the 232 MB checkout. With `--depth 1` the pack is roughly the HEAD blob set, about 230-290 MB.
- The 1.12 GiB pack on this machine is inflated by the 861 MB of dangling blobs, not by reachable history.

## 6. Options (decision for owner; nothing executed)
A. Prune dangling objects (safest, no history change; expected saving about 860 MB, pack to about 300 MB):
   `git reflog expire --expire=now --all && git gc --prune=now`
   Risk: low. Unreachable objects cannot be recovered afterwards. Verify first: `git fsck --unreachable` and make sure no branch is missing.
B. Remove media/dana and other large binaries from history (filter-repo; rewrites every commit hash, breaks origin/main, needs force push). Expected saving: about 100-150 MB of reachable history. Risk: high; coordinate with all clones. Command shape: `git filter-repo --path media/dana --invert-paths` on a fresh clone.
C. Git LFS for *.mp4, *.mp3, *.ogg, *.gif >1 MB: stops future growth; does not shrink existing history unless combined with `git lfs migrate import` (also rewrites history). Needs `.gitattributes` entries (none exist today: `git lfs ls-files` returns 0).
D. Shallow clone for other machines: `git clone --depth 1 git@github.com:AmBplus/PersianArts.git` (about 230-290 MB). No risk; history stays on origin.
E. Stale remote branches (about 0.8 MB of exclusive objects, so little size gain): `git push origin --delete <branch>` for the 12 old origin/* branches. Benefit is clutter only. Not recommended for size.
F. Keep media out of git: move media/dana and sound/library/kit to a release store or external bucket going forward; add to `.gitignore`.

Recommendation: do A now (about 860 MB, no rewrite), then decide on F/C for future growth. B only if the owner accepts a history rewrite.
