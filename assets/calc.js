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
    ['eq', 'icm', 'odds'].forEach(t => { $('tab-' + t).hidden = t !== b.dataset.tab; });
    try { history.replaceState(null, '', '#' + b.dataset.tab); } catch (e) { /* ignore */ }
  }));
  const h0 = (location.hash || '').slice(1); if (['eq', 'icm', 'odds'].includes(h0)) document.querySelector('#tabs [data-tab="' + h0 + '"]').click();

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
})();
