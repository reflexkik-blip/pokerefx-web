/* PokerEFX — calculators page: equity (hands/ranges), ICM, pot odds / MDF. */
(function () {
  'use strict';
  const E = window.FPE, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const pc = x => (100 * x).toFixed(1).replace('.', ',') + ' %';
  const f2 = x => (Math.round(x * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // tabs
  document.querySelectorAll('#tabs [data-tab]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#tabs [data-tab]').forEach(x => x.className = 'btn' + (x === b ? ' felt' : ''));
    ['eq', 'icm', 'odds', 'var'].forEach(t => { $('tab-' + t).hidden = t !== b.dataset.tab; });
    try { history.replaceState(null, '', '#' + b.dataset.tab); } catch (e) { /* ignore */ }
  }));
  const h0 = (location.hash || '').slice(1); if (['eq', 'icm', 'odds', 'var'].includes(h0)) document.querySelector('#tabs [data-tab="' + h0 + '"]').click();

  // ---- equity
  const COLORS = ['var(--brass)', 'var(--felt)', 'var(--raise)', 'var(--allin)', 'var(--call)', 'var(--limp)'];
  function addPlayer(v) {
    const n = $('eq-players').children.length; if (n >= 6) return;
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = '<label class="f" style="flex:1 1 260px">Jugador ' + (n + 1) + '<input type="text" autocomplete="off" placeholder="AhKd o QQ+, AKs, 10%" value="' + (v || '') + '"></label>' + (n >= 2 ? '<button class="btn" type="button" aria-label="Quitar">✕</button>' : '');
    const x = r.querySelector('button'); if (x) x.addEventListener('click', () => { r.remove(); renum(); });
    $('eq-players').appendChild(r);
  }
  function renum() { [...$('eq-players').children].forEach((r, i) => { r.querySelector('label').firstChild.textContent = 'Jugador ' + (i + 1); }); }
  addPlayer('AhKh'); addPlayer('QQ+, AKs, AQs, KQs, JTs');
  $('eq-add').addEventListener('click', () => addPlayer(''));
  function parsePlayer(t) {
    const s = t.trim(); if (!s) return null;
    if (/^([2-9TJQKA][shdc]){2}$/i.test(s.replace(/\s/g, ''))) { const c = E.cards(s); return c && c.length === 2 && c[0] !== c[1] ? { cards: c, label: s } : null; }
    const w = E.parseRange(s); let n = 0; w.forEach(x => n += x); return n > 0 ? { range: w, label: s, combos: n } : null;
  }
  $('eq-go').addEventListener('click', () => {
    const out = $('eq-out'), ins = [...$('eq-players').querySelectorAll('input')];
    const ps = ins.map(i => parsePlayer(i.value)); const board = E.cards($('eq-board').value) || [];
    if (ps.some(p => !p) || ps.length < 2) { out.innerHTML = '<p style="color:var(--bad)">Revisa los jugadores: cada uno debe ser una mano (AhKd) o un rango (QQ+, AKs, 10%).</p>'; return; }
    if (board.length && (board.length < 3 || board.length > 5)) { out.innerHTML = '<p style="color:var(--bad)">La mesa tiene 3, 4 o 5 cartas.</p>'; return; }
    const used = board.concat(...ps.filter(p => p.cards).map(p => p.cards)); if (new Set(used).size !== used.length) { out.innerHTML = '<p style="color:var(--bad)">Hay cartas repetidas.</p>'; return; }
    // a fixed hand removes its combos from every range
    ps.forEach(p => { if (p.range) { E.COMBOS.forEach(([a, b], i) => { if (used.includes(a) || used.includes(b)) p.range[i] = 0; }); } });
    out.innerHTML = '<p class="small">Calculando…</p>';
    setTimeout(() => {
      const t0 = performance.now(); const r = E.equity(ps, board, { iters: 120000 }); const ms = Math.round(performance.now() - t0);
      out.innerHTML = r.players.map((x, i) => '<div style="margin-bottom:12px"><div class="row" style="justify-content:space-between;align-items:baseline"><b>Jugador ' + (i + 1) + '</b><span class="small">' + esc(ps[i].label) + (ps[i].combos ? ' · ' + Math.round(ps[i].combos) + ' combos' : '') + '</span><b style="font:700 22px var(--display)">' + pc(x.eq) + '</b></div>' +
        '<div style="height:12px;border-radius:6px;background:var(--bg2);overflow:hidden"><div style="height:100%;width:' + (100 * x.eq).toFixed(2) + '%;background:' + COLORS[i] + '"></div></div><div class="small">Gana ' + pc(x.win) + ' · empata ' + pc(x.tie) + '</div></div>').join('') +
        '<p class="small">' + (r.exact ? 'Resultado exacto (todas las cartas que faltan enumeradas).' : 'Monte Carlo con ' + r.samples.toLocaleString('es-ES') + ' muestras (error típico ±' + (100 * Math.sqrt(0.25 / r.samples)).toFixed(2).replace('.', ',') + ' puntos).') + ' ' + ms + ' ms.</p>';
    }, 20);
  });

  // ---- ICM
  const nums = s => String(s).split(/[,;\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => isFinite(x) && x >= 0);
  $('icm-go').addEventListener('click', () => {
    const st = nums($('icm-stacks').value), pr = nums($('icm-prizes').value).sort((a, b) => b - a);
    if (st.length < 2 || !pr.length) { $('icm-out').innerHTML = '<p style="color:var(--bad)">Pon al menos dos stacks y un premio.</p>'; return; }
    const r = E.icm(st, pr), pool = pr.slice(0, st.length).reduce((a, b) => a + b, 0);
    $('icm-out').innerHTML = '<table class="t"><tr><th>Jugador</th><th>Fichas</th><th>% de fichas</th><th>Valor ICM</th><th>% del bote de premios</th><th>Diferencia con ChipEV</th></tr>' +
      r.map((x, i) => { const chip = x.share * pool; return '<tr><td>' + (i + 1) + '</td><td>' + x.chips.toLocaleString('es-ES') + '</td><td>' + pc(x.share) + '</td><td><b>' + f2(x.ev) + '</b></td><td>' + pc(pool ? x.ev / pool : 0) + '</td><td style="color:' + (x.ev >= chip ? 'var(--good)' : 'var(--bad)') + '">' + (x.ev >= chip ? '+' : '−') + f2(Math.abs(x.ev - chip)) + '</td></tr>'; }).join('') + '</table>' +
      '<p class="small" style="margin-top:8px">Los stacks grandes valen menos que su parte de fichas y los cortos más: es el «impuesto» del ICM que hace que en la burbuja haya que arriesgar menos.</p>';
  });
  $('icm-go').click();

  // ---- pot odds
  function odds() {
    const P = Math.max(0, +$('o-pot').value || 0), B = Math.max(0, +$('o-bet').value || 0);
    if (!(P + B > 0)) { $('odds-out').innerHTML = ''; return; }
    const need = B / (P + 2 * B), mdf = P / (P + B), bluff = B / (P + B);
    $('odds-out').innerHTML = '<div class="grid">' +
      '<div class="box kpi"><b>' + pc(need) + '</b><span>equity necesaria para pagar</span></div>' +
      '<div class="box kpi"><b>' + pc(mdf) + '</b><span>MDF: parte de tu rango que debe continuar</span></div>' +
      '<div class="box kpi"><b>' + pc(bluff) + '</b><span>con qué frecuencia debe foldear el rival para que su farol gane</span></div>' +
      '<div class="box kpi"><b>' + (B / Math.max(1e-9, P) * 100).toFixed(0) + ' %</b><span>tamaño de la apuesta respecto al bote</span></div></div>' +
      '<p class="small" style="margin-top:10px">Pagas ' + f2(B) + ' bb para ganar un bote de ' + f2(P + 2 * B) + ' bb.</p>';
  }
  ['o-pot', 'o-bet'].forEach(i => $(i).addEventListener('input', odds)); odds();
  // ---- variance & bankroll (Monte Carlo over a typical MTT payout table)
  function payouts(N, pool) {
    const M = Math.max(1, Math.round(N * 0.15)), w = []; let s = 0;
    for (let i = 1; i <= M; i++) { const x = Math.pow(i, -1.05); w.push(x); s += x; }
    const pr = w.map(x => x / s * pool);
    const minc = pool / N * 1.7;                       // min-cash about 1.7 buy-ins (net of rake)
    for (let i = 0; i < M; i++) pr[i] = Math.max(pr[i], minc);
    const t = pr.reduce((a, b) => a + b, 0); return pr.map(x => x * pool / t);
  }
  function simulate() {
    const N = Math.max(10, +$('v-n').value | 0), BI = Math.max(.1, +$('v-bi').value), rake = Math.min(.3, Math.max(0, +$('v-rake').value / 100));
    const roi = +$('v-roi').value / 100, T = Math.min(10000, Math.max(10, +$('v-t').value | 0)), R = 2000;
    const cost = BI * (1 + rake), pool = BI * N, pr = payouts(N, pool);
    // each paid place gets probability (1/N)*k; k chosen so the expected return equals cost*(1+roi)
    const base = pr.reduce((a, b) => a + b, 0) / N, k = Math.max(0, cost * (1 + roi) / base);
    let p = pr.map(() => k / N); const pin = p.reduce((a, b) => a + b, 0);
    if (pin > .95) { const f = .95 / pin; p = p.map(x => x * f); }
    const cum = []; let acc = 0; p.forEach(x => { acc += x; cum.push(acc); });
    const STEP = Math.max(1, Math.round(T / 120)), pts = Math.floor(T / STEP);
    const paths = new Float64Array(R * (pts + 1)), dd = new Float64Array(R), fin = new Float64Array(R);
    for (let r = 0; r < R; r++) {
      let bank = 0, peak = 0, mdd = 0;
      for (let t = 1; t <= T; t++) {
        const u = Math.random(); let win = 0;
        if (u < acc) { let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; } win = pr[lo]; }
        bank += win - cost; if (bank > peak) peak = bank; if (peak - bank > mdd) mdd = peak - bank;
        if (t % STEP === 0) paths[r * (pts + 1) + t / STEP] = bank;
      }
      dd[r] = mdd; fin[r] = bank;
    }
    const q = (arr, x) => { const a = Float64Array.from(arr).sort(); return a[Math.min(a.length - 1, Math.floor(x * a.length))]; };
    const bands = [.05, .25, .5, .75, .95].map(x => { const o = []; for (let i = 0; i <= pts; i++) { const col = new Float64Array(R); for (let r = 0; r < R; r++) col[r] = paths[r * (pts + 1) + i]; o.push(q(col, x)); } return o; });
    const lose = fin.filter(x => x < 0).length / R, ev = T * cost * roi;
    const eur = x => (x < 0 ? '−' : '') + Math.abs(Math.round(x)).toLocaleString('es-ES') + ' €';
    const W = 640, H = 300, P = 44, lo = Math.min(...bands[0]), hi = Math.max(...bands[4]);
    const X = i => P + (W - P - 10) * i / pts, Y = v => 12 + (H - 40) * (1 - (v - lo) / Math.max(1e-9, hi - lo));
    const line = (arr) => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    const area = (a, b) => line(a) + b.map((v, i) => [i, v]).reverse().map(([i, v]) => 'L' + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('') + 'Z';
    const ticks = [lo, 0, hi].filter((v, i, A) => v >= lo && v <= hi && A.indexOf(v) === i);
    $('v-out').innerHTML = '<div class="grid">' +
      '<div class="box kpi"><b>' + eur(ev) + '</b><span>beneficio esperado en ' + T.toLocaleString('es-ES') + ' torneos</span></div>' +
      '<div class="box kpi"><b>' + pc(lose) + '</b><span>probabilidad de acabar en pérdidas</span></div>' +
      '<div class="box kpi"><b>' + eur(q(dd, .5)) + '</b><span>bache máximo típico (mediana)</span></div>' +
      '<div class="box kpi"><b>' + Math.ceil(q(dd, .95) / cost) + ' buy-ins</b><span>bankroll para no arruinarte en el 95 % de los casos (' + eur(q(dd, .95)) + ')</span></div></div>' +
      '<figure style="margin:18px 0 0"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Rango de resultados por número de torneos" style="width:100%;height:auto;display:block">' +
      ticks.map(v => '<line x1="' + P + '" x2="' + (W - 10) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)" ' + (v === 0 ? 'stroke-width="1.5"' : 'stroke-dasharray="3 4"') + '/><text x="' + (P - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + eur(v) + '</text>').join('') +
      '<path d="' + area(bands[0], bands[4]) + '" fill="var(--felt)" opacity=".15"/><path d="' + area(bands[1], bands[3]) + '" fill="var(--felt)" opacity=".3"/>' +
      '<path d="' + line(bands[2]) + '" fill="none" stroke="var(--brass)" stroke-width="2"/>' +
      '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(pts) + '" y2="' + Y(ev) + '" stroke="var(--ink2)" stroke-dasharray="5 4" stroke-width="1.5"/>' +
      '<text x="' + P + '" y="' + (H - 8) + '" font-size="11" fill="var(--muted)">0</text><text x="' + (W - 10) + '" y="' + (H - 8) + '" font-size="11" fill="var(--muted)" text-anchor="end">' + T.toLocaleString('es-ES') + ' torneos</text></svg>' +
      '<figcaption class="small" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px"><span><i style="display:inline-block;width:18px;height:3px;background:var(--brass);vertical-align:middle"></i> resultado mediano</span><span><i style="display:inline-block;width:12px;height:12px;background:var(--felt);opacity:.45;vertical-align:-1px"></i> 50 % de las carreras</span><span><i style="display:inline-block;width:12px;height:12px;background:var(--felt);opacity:.2;vertical-align:-1px"></i> 90 % de las carreras</span><span><i style="display:inline-block;width:18px;border-top:2px dashed var(--ink2);vertical-align:middle"></i> lo esperado (EV)</span></figcaption></figure>' +
      '<p class="small" style="margin-top:10px">' + R.toLocaleString('es-ES') + ' carreras simuladas. Con ROI ' + Math.round(roi * 100) + ' % cobras en el ' + (100 * Math.min(.95, pin)).toFixed(1).replace('.', ',') + ' % de los torneos. En la mitad de las carreras acabas entre ' + eur(bands[1][pts]) + ' y ' + eur(bands[3][pts]) + '.</p>';
  }
  $('v-go').addEventListener('click', () => { $('v-out').innerHTML = '<p class="small">Simulando…</p>'; setTimeout(simulate, 30); });

})();
