# DiffusionART Project Website

Public project page: **https://vanzll.github.io/diffusionart-project/**

This repository hosts only the paper website and its public figures, images,
and videos. It is independent of the implementation repository:
https://github.com/vanzll/DiffusionART (code release coming soon).

Keep this website repository **public**. GitHub Pages publishes `main:/docs`.
Changing the code repository's visibility does not affect this website.

## Editing and validation

Edit `docs/index.html`, `docs/style.css`, and `docs/app.js`.
Open `docs/index.html` in a browser; no build process or backend is needed.

Run `python3 scripts/check_site.py` (requires FFprobe) and
`node --check docs/app.js` before publishing. `docs/assets/provenance.json`
records identities and SHA256 hashes of the research media.

No experiment credentials, private logs, or training code are published here.
Research media and website content retain their original rights. Lucide icons
are distributed under the license in `docs/assets/LUCIDE-LICENSE`.
