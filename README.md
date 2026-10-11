# DiffusionART Project Website

Public project page: **https://vanzll.github.io/diffusionart-project/**

This repository hosts only the paper website and its public figures, images,
and videos. It is independent of the implementation repository:
https://github.com/vanzll/DiffusionART.

Keep this website repository **public**. GitHub Pages publishes `main:/docs`.
Changing the code repository's visibility does not affect this website.

## Editing and validation

Edit `docs/index.html`, `docs/style.css`, and `docs/app.js` for the research
homepage. The complete gallery is `docs/demo.html` with `docs/demo.js`.
Open `docs/index.html` in a browser; no build process or backend is needed.

Run `python3 scripts/check_site.py` (requires FFprobe) and
`node --check docs/app.js` and `node --check docs/demo.js` before publishing.
`docs/assets/provenance.json` records the selected media; `research-provenance.json`
records the published figure sources and lossless panel exports. Research claims
use the October 9 paper release and the audited measured cover curves.

No experiment credentials, private logs, or training code are published here.
Research media and website content retain their original rights. Lucide icons
are distributed under the license in `docs/assets/LUCIDE-LICENSE`.
