// ตัวเชื่อมต่อข้อมูล (ใช้ร่วมกันทุกหน้า) — API_BASE มาจาก config.js
// ว่าง หรือ URL ตัวอย่างที่ยังไม่ได้แทนที่ = localStorage บนเบราว์เซอร์นี้
// URL จริง (http/https) = เรียกเซิร์ฟเวอร์ ถ้าเชื่อมต่อไม่ได้จะกลับไปใช้ localStorage
const PIYAMIT_DB_KEY = "piyamit_m1_local_db";
const PIYAMIT_LOCAL_PIN = "2569";
let piyamitRemoteDown = false;

function piyamitNorm(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function piyamitLoad() {
  try {
    const d = JSON.parse(localStorage.getItem(PIYAMIT_DB_KEY));
    if (d && Array.isArray(d.players) && Array.isArray(d.scores)) return d;
  } catch (e) {}
  return { players: [], scores: [] };
}

function piyamitSave(db) {
  localStorage.setItem(PIYAMIT_DB_KEY, JSON.stringify(db));
}

function piyamitUid() {
  const bytes = new Uint8Array(5);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

function piyamitProgress(scores, pid, subj) {
  const out = { s: {}, coins: 0, r: {} };
  scores.forEach(r => {
    if (String(r.pid) !== String(pid) || String(r.subj) !== String(subj)) return;
    const base = String(r.base);
    if (+r.stars) out.s[base] = +r.stars;
    out.coins += +r.coins || 0;
    out.r[base] = {
      best: +r.best, total: +r.total, stars: +r.stars,
      att: +r.att, last: +r.last, lastScore: +r.lastScore
    };
  });
  return out;
}

function piyamitLocal(d) {
  const db = piyamitLoad();
  const action = d.action;
  if (action === "players") return { players: db.players.slice() };
  if (action === "register") {
    const name = piyamitNorm(d.name), cls = piyamitNorm(d.cls);
    if (!name) return { error: "กรุณากรอกชื่อ" };
    const existing = db.players.find(r =>
      String(r.name).toLowerCase() === name.toLowerCase() &&
      String(r.cls).toLowerCase() === cls.toLowerCase());
    if (existing) return { player: existing, existed: true };
    const player = {
      id: piyamitUid(), name, nick: piyamitNorm(d.nick),
      cls, no: piyamitNorm(d.no), created: Date.now()
    };
    db.players.push(player);
    piyamitSave(db);
    return { player, existed: false };
  }
  if (action === "progress") return piyamitProgress(db.scores, d.pid, d.subj);
  if (action === "result") {
    const pid = String(d.pid), subj = String(d.subj), base = String(d.base);
    if (!db.players.some(r => String(r.id) === pid)) return { error: "ไม่พบผู้เล่น" };
    const score = +d.score, total = +d.total, stars = +d.stars, coins = +d.coins || 0, now = Date.now();
    let row = db.scores.find(x => String(x.pid) === pid && String(x.subj) === subj && String(x.base) === base);
    if (row) {
      row.best = Math.max(+row.best, score);
      row.total = total;
      row.stars = Math.max(+row.stars, stars);
      row.att = (+row.att || 0) + 1;
      row.last = now;
      row.lastScore = score;
      row.coins = (+row.coins || 0) + coins;
    } else {
      db.scores.push({ pid, subj, base, best: score, total, stars, att: 1, last: now, lastScore: score, coins });
    }
    piyamitSave(db);
    return piyamitProgress(db.scores, pid, subj);
  }
  if (action === "reset") {
    db.scores = db.scores.filter(x => !(String(x.pid) === String(d.pid) && String(x.subj) === String(d.subj)));
    piyamitSave(db);
    return piyamitProgress(db.scores, d.pid, d.subj);
  }
  if (action === "scoreboard") {
    return {
      players: db.players.slice(),
      scores: db.scores.map(r => {
        const o = Object.assign({}, r);
        ["best", "total", "stars", "att", "last", "lastScore", "coins"].forEach(k => { o[k] = +o[k] || 0; });
        return o;
      })
    };
  }
  if (action === "admin_check") return { ok: String(d.pin) === PIYAMIT_LOCAL_PIN };
  if (action === "admin_delete") {
    if (String(d.pin) !== PIYAMIT_LOCAL_PIN) return { error: "PIN ไม่ถูกต้อง" };
    db.scores = db.scores.filter(x => String(x.pid) !== String(d.pid));
    db.players = db.players.filter(x => String(x.id) !== String(d.pid));
    piyamitSave(db);
    return { ok: true };
  }
  return { error: "unknown action" };
}

function piyamitConfiguredBase() {
  return String(window.API_BASE || "").trim();
}

function piyamitUseLocal() {
  const base = piyamitConfiguredBase();
  if (!base || /วาง_|DEPLOYMENT_ID_ที่นี่/.test(base)) return true;
  if (!/^https?:\/\//i.test(base)) return true;
  return piyamitRemoteDown;
}

function piyamitFinish(result) {
  if (result && result.error) throw new Error(result.error);
  return result;
}

function api(action, data) {
  const payload = Object.assign({ action }, data || {});
  if (piyamitUseLocal()) {
    window.PIYAMIT_STORAGE = "local";
    return Promise.resolve().then(() => piyamitFinish(piyamitLocal(payload)));
  }
  return fetch(piyamitConfiguredBase(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(r => {
    if (!r.ok) {
      const err = new Error("HTTP " + r.status);
      err.piyamitNetwork = true;
      throw err;
    }
    return r.json();
  }).then(j => {
    if (j && j.error) {
      const err = new Error(j.error);
      err.piyamitApp = true;
      throw err;
    }
    window.PIYAMIT_STORAGE = "remote";
    return j;
  }).catch(err => {
    if (err && err.piyamitApp) throw err;
    piyamitRemoteDown = true;
    window.PIYAMIT_STORAGE = "local";
    return piyamitFinish(piyamitLocal(payload));
  });
}
