# Dr. Look site: landing page + lab

## Where things live
| Path | Live URL | What it is |
|---|---|---|
| `en/drlook_usa/index.html` | confiteca.com/en/drlook_usa | Consumer landing page |
| `en/drlook_usa/lab/index.html` | confiteca.com/en/drlook_usa/lab/ | The 3D lab (`?stop=0..4` opens it at an invention) |
| `en/drlook_usa/assets/` | | 3D models, images, film used by both pages |
| `en/drlook_usa/vendor/three/` | | three.js r170 (self-hosted, no CDN) |
| `dr-look-lab/tools/` | not deployed | Meshy/Blender sources and build scripts (git-ignored) |

Publishing = commit + push to GitHub; Vercel deploys from there. Cache rules for the models/images are in `/vercel.json`.

## Preview locally
- **Mac:** double-click `dr-look-lab/start-lab.command` (opens http://localhost:8123/en/drlook_usa/)
- Or from the ConfitecaWeb folder: `python3 -m http.server 8123 --bind 127.0.0.1`

## Swap assets (same file name, no code changes)
`en/drlook_usa/assets/models/lab.glb` (lab set), `dr-look.glb` (Dr. Look + animations), `characters/fuzzy-rig.glb` (Fuzzy + animations),
`products/<sku>.glb` (fg-29946, fl-3281, lpd-4380, ct-4382, sl-4381), `video/fuzzgum-origin.mp4`, `img/*.webp` (landing images).

## Tweak
Lab speeds / camera / brightness: `const TUNE` in `lab/index.html`. Landing copy and products: `INVENTIONS` in `index.html`.

## Rebuild 3D assets
Scripts in `dr-look-lab/tools/` (Blender 5 as a Python module + node with @gltf-transform). Output goes to `en/drlook_usa/assets/models/`.
