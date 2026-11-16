/* Forja Póker — calculation engine: 7-card evaluator, ranges, exact/Monte Carlo equity, ICM. No dependencies. */
(function (G) {
  'use strict';
  const RK = '23456789TJQKA', SU = 'shdc';
  const CNT = new Int8Array(13), SM = new Int32Array(4), BUF = new Int32Array(7);
function straightHigh(m) {
  for (let h = 12; h >= 4; h--) if (((m >> (h - 4)) & 31) === 31) return h;
  return (m & 0x100F) === 0x100F ? 3 : -1;
}
function pop(m) { let n = 0; while (m) { m &= m - 1; n++; } return n; }
function topK(m, k, excl) { let v = 0, n = 0; for (let r = 12; r >= 0 && n < k; r--) if ((m >> r) & 1 && r !== excl[0] && r !== excl[1]) { v = (v << 4) | r; n++; } while (n < k) { v <<= 4; n++; } return v; }
function evalCards(cs, n) {
  CNT.fill(0); SM.fill(0); let rm = 0;
  for (let i = 0; i < n; i++) { const c = cs[i], r = c >> 2; CNT[r]++; SM[c & 3] |= 1 << r; rm |= 1 << r; }
  let fl = 0; for (let s = 0; s < 4; s++) if (pop(SM[s]) >= 5) fl = SM[s];
  if (fl) { const sh = straightHigh(fl); if (sh >= 0) return (8 << 20) | sh; }
  let quad = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1, p3 = -1;
  for (let r = 12; r >= 0; r--) { const k = CNT[r]; if (k === 4) quad = r; else if (k === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; } else if (k === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; else if (p3 < 0) p3 = r; } }
  if (quad >= 0) return (7 << 20) | (quad << 4) | (topK(rm, 1, [quad, -1]) >> 0);
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return (6 << 20) | (t1 << 4) | Math.max(t2, p1);
  if (fl) return (5 << 20) | topK(fl, 5, [-1, -1]);
  const st = straightHigh(rm); if (st >= 0) return (4 << 20) | st;
  if (t1 >= 0) return (3 << 20) | (t1 << 8) | topK(rm, 2, [t1, -1]);
  if (p2 >= 0) return (2 << 20) | (p1 << 8) | (p2 << 4) | topK(rm, 1, [p1, p2]);
  if (p1 >= 0) return (1 << 20) | (p1 << 12) | topK(rm, 3, [p1, -1]);
  return topK(rm, 5, [-1, -1]);
}
function ev2(a, b, board) { BUF[0] = a; BUF[1] = b; for (let i = 0; i < board.length; i++) BUF[2 + i] = board[i]; return evalCards(BUF, 2 + board.length); }
  const cat = s => s >> 20;
  const CATS = ['carta alta', 'pareja', 'doble pareja', 'trío', 'escalera', 'color', 'full', 'póker', 'escalera de color'];
  const card = s => { s = String(s).trim(); const r = RK.indexOf(s[0].toUpperCase()), u = SU.indexOf(s[1].toLowerCase()); return r < 0 || u < 0 ? -1 : r * 4 + u; };
  const cardStr = c => RK[c >> 2] + SU[c & 3];
  function cards(str) { const t = String(str || '').replace(/[^2-9TJQKAtjqkashdc]/g, ''); const out = []; for (let i = 0; i + 1 < t.length; i += 2) { const c = card(t.substr(i, 2)); if (c < 0) return null; out.push(c); } return out; }
  // all 1326 combos and the 169 classes (AA, AKs, AKo...)
  const COMBOS = []; for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) COMBOS.push([a, b]);
  const CLASSES = []; for (let i = 12; i >= 0; i--) for (let j = 12; j >= 0; j--) CLASSES.push(i === j ? RK[i] + RK[j] : i > j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o');
  const classOf = (a, b) => { const ra = a >> 2, rb = b >> 2, hi = Math.max(ra, rb), lo = Math.min(ra, rb); return ra === rb ? RK[hi] + RK[lo] : RK[hi] + RK[lo] + ((a & 3) === (b & 3) ? 's' : 'o'); };
  // range text: "AA, KK, AKs, AQo+, 77+, A2s-A5s, T9s, KQ, 25%" (percent = top hands by preflop strength)
  const ORDER = 'AA KK QQ AKs JJ AQs KQs AJs KJs TT AKo ATs QJs KTs QTs JTs 99 AQo A9s KQo 88 K9s T9s A8s Q9s J9s AJo A5s 77 A7s KJo A4s A3s A6s QJo 66 K8s T8s A2s 98s J8s ATo Q8s K7s KTo 55 JTo 87s QTo 44 33 22 K6s 97s K5s 76s T7s K4s K3s K2s Q7s 86s 65s J7s 54s Q6s 75s 96s Q5s 64s Q4s Q3s T9o T6s Q2s A9o 53s 85s J6s J9o K9o J5s Q9o 43s 74s J4s J3s 95s J2s 63s A8o 52s T5s 84s T4s T3s 42s T2s 98o T8o A5o A7o 73s A4o 32s 94s 93s J8o A3o 62s 92s K8o A6o 87o Q8o 83s A2o 82s 97o 72s 76o K7o 65o T7o K6o 86o 54o K5o J7o 75o Q7o K4o K3o 96o K2o 64o Q6o 53o 85o T6o Q5o 43o Q4o Q3o 74o Q2o J6o 63o J5o 95o 52o J4o J3o 42o J2o 84o T5o T4o 32o T3o 73o T2o 62o 94o 93o 92o 83o 82o 72o'.split(' ');
  function parseRange(text) {
    const w = new Float64Array(1326); const t = String(text || '').toUpperCase().replace(/\s+/g, '').replace(/O/g, 'o').replace(/S/g, 's');
    if (!t) return w;
    const addClass = (cls, f) => { COMBOS.forEach(([a, b], i) => { if (classOf(a, b) === cls) w[i] = Math.max(w[i], f); }); };
    const addCombo = (c1, c2, f) => { const a = Math.min(c1, c2), b = Math.max(c1, c2); const i = COMBOS.findIndex(x => x[0] === a && x[1] === b); if (i >= 0) w[i] = Math.max(w[i], f); };
    for (let part of t.split(',')) {
      if (!part) continue; let f = 1; const m = part.match(/^(.*):([\d.]+)$/); if (m) { part = m[1]; f = Math.max(0, Math.min(1, +m[2] > 1 ? +m[2] / 100 : +m[2])); }
      const pc = part.match(/^([\d.]+)%$/); if (pc) { const n = Math.round(1326 * +pc[1] / 100); let acc = 0; for (const c of ORDER) { if (acc >= n) break; addClass(c, f); acc += c.length === 2 ? 6 : c[2] === 's' ? 4 : 12; } continue; }
      const raw = cards(part); if (/^[2-9TJQKA][shdc][2-9TJQKA][shdc]$/i.test(part) && raw && raw.length === 2) { addCombo(raw[0], raw[1], f); continue; }
      const one = s => { const x = s.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)$/); if (!x) return null; let i = RK.indexOf(x[1]), j = RK.indexOf(x[2]); if (j > i) [i, j] = [j, i]; return { i, j, s: x[3] }; };
      const name = (i, j, s) => i === j ? RK[i] + RK[j] : RK[i] + RK[j] + s;
      const both = (i, j, s) => { if (i === j || s) addClass(name(i, j, s), f); else { addClass(name(i, j, 's'), f); addClass(name(i, j, 'o'), f); } };
      if (part.includes('-')) { const [p, q] = part.split('-').map(one); if (!p || !q) continue;
        if (p.i === p.j && q.i === q.j) { for (let r = Math.min(p.i, q.i); r <= Math.max(p.i, q.i); r++) both(r, r, ''); } else if (p.i === q.i) { for (let r = Math.min(p.j, q.j); r <= Math.max(p.j, q.j); r++) both(p.i, r, p.s); } continue; }
      if (part.endsWith('+')) { const p = one(part.slice(0, -1)); if (!p) continue; if (p.i === p.j) { for (let r = p.i; r <= 12; r++) both(r, r, ''); } else { for (let r = p.j; r < p.i; r++) both(p.i, r, p.s); } continue; }
      const p = one(part); if (p) both(p.i, p.j, p.s);
    }
    return w;
  }
  // equity of 2+ players (each a hand or a range) on a board: exact enumeration when cheap, otherwise Monte Carlo
  function equity(players, board, opts) {
    opts = opts || {}; const n = players.length, need = 5 - board.length, maxIt = opts.iters || 60000;
    const lists = players.map(p => { if (p.cards) return [{ c: p.cards, w: 1 }]; const out = []; p.range.forEach((x, i) => { if (x > 0) out.push({ c: COMBOS[i], w: x }); }); return out; });
    const win = new Float64Array(n), tie = new Float64Array(n); let tot = 0;
    const deadB = new Set(board);
    const fixed = lists.every(l => l.length === 1);
    const scoreAll = (hands, bd) => { const sc = hands.map(h => ev2(h[0], h[1], bd)); const mx = Math.max(...sc); const k = sc.filter(s => s === mx).length; return { sc, mx, k }; };
    const add = (hands, bd, wgt) => { const { sc, mx, k } = scoreAll(hands, bd); for (let i = 0; i < n; i++) if (sc[i] === mx) { if (k === 1) win[i] += wgt; else tie[i] += wgt / k; } tot += wgt; };
    if (fixed && need <= 2) {
      const hands = lists.map(l => l[0].c), used = new Set([...board, ...hands.flat()]); const rest = []; for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
      if (need === 0) add(hands, board, 1);
      else if (need === 1) rest.forEach(x => add(hands, board.concat([x]), 1));
      else for (let a = 0; a < rest.length; a++) for (let b = a + 1; b < rest.length; b++) add(hands, board.concat([rest[a], rest[b]]), 1);
    } else {
      const cum = lists.map(l => { let s = 0; return { l, c: l.map(x => (s += x.w)), s }; });
      for (let it = 0, ok = 0; it < maxIt * 3 && ok < maxIt; it++) {
        const used = new Set(deadB), hands = [];
        let bad = false;
        for (const C of cum) { const r = Math.random() * C.s; let lo = 0, hi = C.c.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (C.c[m] < r) lo = m + 1; else hi = m; } const h = C.l[lo].c; if (used.has(h[0]) || used.has(h[1])) { bad = true; break; } used.add(h[0]); used.add(h[1]); hands.push(h); }
        if (bad) continue;
        const bd = board.slice(); while (bd.length < 5) { const c = (Math.random() * 52) | 0; if (!used.has(c)) { used.add(c); bd.push(c); } }
        add(hands, bd, 1); ok++;
      }
    }
    return { players: players.map((_, i) => ({ win: tot ? win[i] / tot : 0, tie: tot ? tie[i] / tot : 0, eq: tot ? (win[i] + tie[i]) / tot : 0 })), samples: tot, exact: fixed && need <= 2 };
  }
  // ICM (Malmuth-Harville): each player's share of the prize pool from the stacks; exact recursion up to ~10 players
  function icm(stacks, prizes) {
    const n = stacks.length, P = prizes.slice(0, n), total = stacks.reduce((a, b) => a + b, 0), out = new Float64Array(n), memo = new Map();
    function rec(mask, place, prob) {
      if (place >= P.length || prob < 1e-12) return;
      let left = 0; for (let i = 0; i < n; i++) if (!(mask & (1 << i))) left += stacks[i];
      if (left <= 0) return;
      for (let i = 0; i < n; i++) if (!(mask & (1 << i)) && stacks[i] > 0) { const p = prob * stacks[i] / left; out[i] += p * P[place]; rec(mask | (1 << i), place + 1, p); }
    }
    if (n > 11) { // too many: Monte Carlo of finishing orders
      const it = 200000; for (let k = 0; k < it; k++) { const alive = stacks.map((s, i) => i).filter(i => stacks[i] > 0); for (let place = 0; place < P.length && alive.length; place++) { let s = 0; alive.forEach(i => s += stacks[i]); let r = Math.random() * s, j = 0; for (; j < alive.length - 1; j++) { r -= stacks[alive[j]]; if (r <= 0) break; } out[alive[j]] += P[place] / it; alive.splice(j, 1); } }
    } else rec(0, 0, 1);
    return Array.from(out).map((v, i) => ({ chips: stacks[i], share: total ? stacks[i] / total : 0, ev: v }));
  }
  G.FPE = { RK, SU, card, cardStr, cards, COMBOS, CLASSES, classOf, parseRange, ORDER, equity, icm, evalCards, ev2, cat, CATS };
})(typeof window !== 'undefined' ? window : globalThis);
