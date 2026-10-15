# ห้องเรียนเกม ม.1 เทอม 2

Static site for GitHub Pages: [https://kruom9.github.io/pv1/](https://kruom9.github.io/pv1/)

| Page | File |
| --- | --- |
| Home | `index.html` |
| ภาษาไทย | `thai-m1.html` |
| ภาษาอังกฤษ | `english-m1.html` |
| คณิตศาสตร์ | `math-m1.html` |
| วิทยาศาสตร์ | `science-m1.html` |
| สังคมศึกษา | `social-m1.html` |

Links and scripts are relative, so the site works from the `/pv1/` project path.

`config.js` leaves `API_BASE` empty. Scores and player names then stay in this browser (`localStorage`). There is no `server.py` on GitHub Pages. To share scores across devices, set `API_BASE` to a real Apps Script Web App URL ending in `/exec`.

Teacher PIN in browser-only mode: **2569**.
