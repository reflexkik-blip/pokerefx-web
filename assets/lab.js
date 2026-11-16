/* Forja Póker — "Laboratorio": what real tournament tables do (anonymous aggregates). Interactive explorers:
   rival map (VPIP/PFR), bluff checker by street/size/role, c-bet by flop texture, river call-or-fold. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), pc = x => x == null ? '–' : Math.round(100 * x) + ' %';
  const TY = { reg: ['Regular', '#5f7c8a'], lag: ['Agresivo (LAG)', '#c8553d'], maniac: ['Maníaco', '#7a2e8c'], fish: ['Recreativo', '#3b9e8c'], nit: ['Nit', '#b8862f'] };
  const SZ = { 'pequeña': 'Pequeña (≤ 40 % del bote)', media: 'Media (40-80 %)', grande: 'Grande (> 80 %)', sobreapuesta: 'Sobreapuesta (> 130 %)' };
  const chips = (el, items, cur, on) => { el.innerHTML = items.map(([v, l]) => '<button type="button" class="chip' + (v === cur ? ' on' : '') + '" data-v="' + v + '">' + l + '</button>').join(''); el.onclick = e => { const b = e.target.closest('[data-v]'); if (b) on(b.dataset.v); }; };
  function gauge(fold, need, label) {
    const good = fold != null && need != null && fold > need, margin = fold != null && need != null ? fold - need : 0;
    return '<div class="gauge"><div class="gtrack"><span class="gfill" style="width:' + (100 * (fold || 0)).toFixed(1) + '%;background:' + (good ? 'var(--good)' : 'var(--bad)') + '"></span><span class="gneed" style="left:' + (100 * (need || 0)).toFixed(1) + '%"><em>necesita ' + pc(need) + '</em></span></div>' +
      '<div class="gv"><b style="color:' + (good ? 'var(--good)' : 'var(--bad)') + '">' + pc(fold) + '</b> ' + label + '</div>' +
      '<p class="verd ' + (good ? 'ok' : 'no') + '">' + (good ? (margin > 0.1 ? 'El farol gana claramente: apuesta con todo tu aire.' : 'El farol gana poco: farolea con las manos con algo de equity (proyectos).') : (margin > -0.08 ? 'Al límite: el farol puro pierde algo; apuesta solo con proyectos y valor.' : 'El farol pierde dinero: aquí apuesta solo por valor.')) + '</p></div>';
  }
  fetch('../data/lab.json').then(r => r.json()).then(D => {
    // ---------------------------------------------------------------- 1. rival map
    const P = D.players.filter(p => p.vpip != null && p.pfr != null && TY[p.k]); let only = null;
    const W = 560, H = 360, X = v => 40 + (W - 60) * Math.min(v, 70) / 70, Y = v => H - 30 - (H - 50) * Math.min(v, 50) / 50;
    function map() {
      const pts = P.map(p => '<circle cx="' + X(p.vpip).toFixed(1) + '" cy="' + Y(p.pfr).toFixed(1) + '" r="' + Math.min(9, 2.5 + Math.sqrt(p.n) / 4).toFixed(1) + '" fill="' + TY[p.k][1] + '" fill-opacity="' + (only && only !== p.k ? 0.08 : 0.6) + '" stroke="' + TY[p.k][1] + '"><title>' + TY[p.k][0] + ' · VPIP ' + p.vpip + ' · PFR ' + p.pfr + ' · ' + p.n + ' manos</title></circle>').join('');
      const ax = [0, 10, 20, 30, 40, 50, 60, 70].map(v => '<line x1="' + X(v) + '" y1="' + (H - 30) + '" x2="' + X(v) + '" y2="20" class="grid"/><text x="' + X(v) + '" y="' + (H - 12) + '" class="tick">' + v + '</text>').join('') +
        [0, 10, 20, 30, 40, 50].map(v => '<line x1="40" y1="' + Y(v) + '" x2="' + (W - 20) + '" y2="' + Y(v) + '" class="grid"/><text x="32" y="' + (Y(v) + 4) + '" class="tick" text-anchor="end">' + v + '</text>').join('');
      $('lab-map').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa de rivales: VPIP frente a PFR">' + ax + '<text x="' + (W / 2) + '" y="' + (H - 0) + '" class="axl">VPIP: % de manos que juega</text><text x="44" y="12" class="axl" style="text-anchor:start">PFR: % que sube</text>' + pts + '</svg>';
      const cnt = {}; P.forEach(p => cnt[p.k] = (cnt[p.k] || 0) + 1);
      chips($('lab-types'), Object.keys(TY).map(k => [k, '<i style="background:' + TY[k][1] + '"></i>' + TY[k][0] + ' · ' + Math.round(100 * (cnt[k] || 0) / P.length) + ' %']), only, v => { only = only === v ? null : v; map(); });
      const t = only || 'reg', pool = D.pool[t] || {}, avg = k => { const xs = P.filter(p => p.k === t && p[k] != null).map(p => p[k]); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
      const r = (a, b) => pool[b] ? pool[a] / pool[b] : null;
      $('lab-type').innerHTML = '<h3 style="margin:0 0 4px"><i class="dot" style="background:' + TY[t][1] + '"></i>' + TY[t][0] + '</h3><p class="small" style="margin:0 0 10px">' + (only ? 'Media de los jugadores de este tipo.' : 'Toca un tipo para ver su perfil.') + '</p>' +
        '<div class="kv"><span>Juega (VPIP)</span><b>' + Math.round(avg('vpip')) + ' %</b><span>Sube (PFR)</span><b>' + Math.round(avg('pfr')) + ' %</b><span>3-bet</span><b>' + (avg('three') != null ? Math.round(avg('three')) + ' %' : '–') + '</b>' +
        '<span>Paga un open</span><b>' + pc(r('op_c', 'op_n')) + '</b><span>Defiende la BB contra robo</span><b>' + pc(r('st_c', 'st_n')) + '</b><span>Foldea a la c-bet</span><b>' + pc(r('fc_f', 'fc_n')) + '</b></div>' +
        '<p class="small" style="margin-top:10px">' + ({ reg: 'Juega cerca de la tabla. Farolea donde foldea (flop y turn) y créete sus apuestas grandes de river.', lag: 'Abre y resube mucho. Defiende algo más ancho, apuesta por valor y paga más con manos medias.', maniac: 'Sube casi todo. Deja que farolee, paga más y no le farolees.', fish: 'Juega muchas manos pagando o con limp. Aísla sus limps grande y apuesta por valor fino; no le farolees.', nit: 'Juega muy pocas manos. Róbale las ciegas y no pagues sus subidas sin mano.' })[t] + '</p>';
    }
    map();
    // ---------------------------------------------------------------- 2. does my bluff work? (flop / turn)
    const B = { st: 'flop', role: 'cbet', sz: 'pequeña' };
    function bluff() {
      chips($('lab-bst'), [['flop', 'Flop'], ['turn', 'Turn']], B.st, v => { B.st = v; bluff(); });
      chips($('lab-brole'), [['cbet', 'Eres el agresor (c-bet / barril)'], ['other', 'Te pasan y apuestas tú']], B.role, v => { B.role = v; bluff(); });
      chips($('lab-bsz'), [['pequeña', 'Pequeña · 1/3'], ['media', 'Media · 2/3'], ['grande', 'Grande · bote o más']], B.sz, v => { B.sz = v; bluff(); });
      const d = (D.street[B.st][B.role] || {})[B.sz];
      $('lab-bout').innerHTML = d ? gauge(d.fold, d.need, 'de las veces foldean (' + d.n.toLocaleString('es-ES') + ' apuestas medidas)') : '<p class="small">Sin datos suficientes.</p>';
      const K = D.street[B.st].kinds || {};
      $('lab-bkinds').innerHTML = '<div class="lab">Foldean según quién recibe la apuesta (todas las apuestas)</div>' + ['reg', 'lag', 'maniac', 'fish'].filter(k => K[k]).map(k => '<div class="hb"><span>' + TY[k][0] + '</span><div class="bar"><span style="width:' + (100 * K[k].fold).toFixed(1) + '%;background:' + TY[k][1] + '"></span></div><b>' + pc(K[k].fold) + '</b></div>').join('');
      const cr = D.street.flop.raises && D.street.flop.raises.cr;
      $('lab-bcr').innerHTML = cr ? '¿Y el check-raise de farol en el flop? Foldean el <b>' + pc(cr.fold) + '</b> y haría falta el ' + pc(cr.need) + ': ' + (cr.fold > cr.need ? 'funciona.' : 'pierde dinero; haz check-raise con valor y proyectos.') : '';
    }
    bluff();
    // ---------------------------------------------------------------- 3. c-bet by flop texture
    const TX = Object.keys(D.tex).filter(k => D.tex[k].pop && D.tex[k].pop.n >= 40); let tx = TX.includes('A alta seca') ? 'A alta seca' : TX[0];
    const EX = { 'A alta seca': 'A♠ 7♦ 2♣', 'K/Q alta seca': 'K♥ 8♣ 3♦', 'J/T alta seca': 'J♣ 6♦ 2♥', 'baja seca': '8♦ 4♣ 2♠', 'alta conectada': 'K♦ Q♣ T♥', 'media/baja conectada': '9♠ 8♦ 6♣', 'doblada': 'Q♠ Q♦ 5♣', 'monocolor': 'T♥ 7♥ 3♥' };
    function tex() {
      chips($('lab-tex'), TX.map(k => [k, k]), tx, v => { tx = v; tex(); });
      const d = D.tex[tx], s = d.pop_small || {}, b = d.pop_big || {};
      $('lab-tout').innerHTML = '<div class="flop">' + (EX[tx] || '').split(' ').map(c => '<span class="pc ' + ({ '♥': 'h', '♦': 'd', '♣': 'c', '♠': '' })[c.slice(-1)] + '">' + c.slice(0, -1) + '<small>' + c.slice(-1) + '</small></span>').join('') + '<span class="small">ejemplo</span></div>' +
        '<div class="two"><div><div class="lab">C-bet pequeña</div>' + gauge(s.fold, s.need, 'foldean') + '</div><div><div class="lab">C-bet grande</div>' + gauge(b.fold, b.need, 'foldean') + '</div></div>' +
        '<p class="small">Suben (check-raise) el ' + pc(d.pop.raise_) + ' de las veces · ' + d.pop.n.toLocaleString('es-ES') + ' c-bets medidas en este tipo de flop.</p>';
    }
    tex();
    // ---------------------------------------------------------------- 4. river: call or fold?
    const RV = { sz: 'media', who: 'pop' };
    function river() {
      chips($('lab-rsz'), D.river.sizes.filter(s => D.river.pop[s]).map(s => [s, SZ[s] || s]), RV.sz, v => { RV.sz = v; river(); });
      chips($('lab-rwho'), [['pop', 'Cualquier rival']].concat(['reg', 'lag', 'maniac', 'fish'].filter(k => D.river.kinds[k]).map(k => [k, TY[k][0]])), RV.who, v => { RV.who = v; river(); });
      const src = RV.who === 'pop' ? D.river.pop : D.river.kinds[RV.who], d = src && (src[RV.sz] && src[RV.sz].sd >= 12 ? src[RV.sz] : src.todas);
      if (!d) { $('lab-rout').innerHTML = ''; return; }
      const parts = [['farol', 'Farol (nada)', '#c9cfd6'], ['par_baja', 'Pareja baja o media', '#d6a23a'], ['par_alta', 'Pareja alta', '#3b7d5c'], ['fuerte', 'Doble pareja o más', '#c8553d']];
      const beatPair = (d.farol || 0) + (d.par_baja || 0);
      $('lab-rout').innerHTML = '<div class="lab">Qué enseñan en el showdown cuando apuestan así' + (src[RV.sz] && src[RV.sz].sd >= 12 ? '' : ' (todas las apuestas: pocos casos de este tamaño)') + '</div>' +
        '<div class="stack">' + parts.map(([k, l, c]) => '<span style="flex:' + (d[k] || 0).toFixed(3) + ';background:' + c + '" title="' + l + ' ' + pc(d[k]) + '">' + ((d[k] || 0) > 0.08 ? pc(d[k]) : '') + '</span>').join('') + '</div>' +
        '<div class="legend2">' + parts.map(([k, l, c]) => '<span><i style="background:' + c + '"></i>' + l + ' ' + pc(d[k]) + '</span>').join('') + '</div>' +
        '<p class="verd ' + (beatPair > d.need_call ? 'ok' : 'no') + '">Una pareja alta gana al <b>' + pc(beatPair) + '</b> de estas apuestas y para pagar necesitas ' + pc(d.need_call) + ': ' + (beatPair > d.need_call + 0.05 ? '<b>paga con pareja</b>.' : beatPair > d.need_call - 0.05 ? 'al límite: paga con la parte alta de tus parejas.' : '<b>foldea las parejas</b>; paga con doble pareja o más.') + '</p>' +
        '<p class="small">' + d.sd + ' manos enseñadas de ' + d.n.toLocaleString('es-ES') + ' apuestas de river medidas.</p>';
    }
    river();
  }).catch(() => { document.querySelectorAll('.labout').forEach(e => e.textContent = 'No se han podido cargar los datos.'); });
})();
