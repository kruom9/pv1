# ห้องเรียนเกม ม.1 เทอม 2

Static site for GitHub Pages: [https://kruom9.github.io/pv1/](https://kruom9.github.io/pv1/)

The site lives in `slack/` and is published by GitHub Actions (`.github/workflows/pages.yml`). Pages source must be **GitHub Actions** (Settings → Pages → Build and deployment → Source). The workflow uploads `slack/` as the site root, so the game is served at `/pv1/`.

| Page | File |
| --- | --- |
| Home | `slack/index.html` |
| ภาษาไทย | `slack/thai-m1.html` |
| ภาษาอังกฤษ | `slack/english-m1.html` |
| คณิตศาสตร์ | `slack/math-m1.html` |
| วิทยาศาสตร์ | `slack/science-m1.html` |
| สังคมศึกษา | `slack/social-m1.html` |

Links and scripts are relative, so the site works from the `/pv1/` project path.

`slack/config.js` leaves `API_BASE` empty. Scores and player names then stay in this browser (`localStorage`). There is no `server.py` on GitHub Pages. To share scores across devices, set `API_BASE` to a real Apps Script Web App URL ending in `/exec`.

Teacher PIN in browser-only mode: **2569**.
