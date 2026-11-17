/* PokerEFX — interactive preflop charts: pick format, stack (slider, animatable), seat and situation; solid cells by
   main action, tap/hover detail, action filter, range text, and a quiz mode to learn the chart. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), RK = 'AKQJT98765432', CH = '0123456789abcdefghijk', B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  const POS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const CTX = [['chipev-eq', 'ChipEV'], ['pko-cubierto', 'PKO · te cubren'], ['pko-cubre', 'PKO · cubres'], ['burbuja-cubierto', 'Burbuja · te cubren'], ['burbuja-cubre', 'Burbuja · cubres'],
    ['itm-cubierto', 'ITM · te cubren'], ['itm-cubre', 'ITM · cubres'], ['icm_medio-cubierto', 'ICM medio · te cubren'], ['icm_medio-cubre', 'ICM medio · cubres'], ['mesa_final-cubierto', 'Mesa final · te cubren'], ['mesa_final-cubre', 'Mesa final · cubres']];
  const N = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) N.push(i === j ? RK[i] + RK[j] : i < j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o');
  const CMB = N.map(h => h.length === 2 ? 6 : h[2] === 's' ? 4 : 12);
  // situation families: the hero's seat and, when it matters, the villain's
  const FAM = [
    ['open', 'Abrir', k => k[0] === '', 'Primero en entrar: nadie ha subido antes que tú.'],
    ['vsopen', 'Contra open', k => k[0] === 'R', 'Alguien ha abierto antes que tú.'],
    ['vs3', 'Contra 3-bet', k => ['R3', 'RJ'].includes(k[0]), 'Abriste y te resuben.'],
    ['vs4', 'Contra 4-bet', k => ['R34', 'R3J', 'R34J'].includes(k[0]), 'Resubiste y te vuelven a subir.'],
    ['vsshove', 'Contra all-in', k => ['S', 'OVC'].includes(k[0]), 'Un rival va all-in (y a veces otro paga).'],
    ['squeeze', 'Squeeze', k => k[0] === 'SQZ', 'Un open y un call antes que tú.'],
    ['limp', 'Limps', k => ['ROL', 'L', 'LR', 'LJ', 'LRJ', 'LR3', 'LR3J', 'ROL3', 'ROLJ'].includes(k[0]), 'Botes con limp.'],
  ];
  function keyName(key) {
    const [h, p, v] = key.split('|'); const P = POS[+p]; const vs = (v || '').split(',').filter(x => x !== '').map(x => POS[+x]);
    return ({ '': 'Abrir desde ' + P, R: P + ' contra open de ' + vs[0], ROL: P + ' contra limp de ' + vs[0], L: 'BB contra limp de la SB', S: P + ' contra all-in de ' + vs[0],
      SQZ: P + ' contra open de ' + vs[0] + ' y call de ' + vs[1], OVC: P + ' contra all-in de ' + vs[0] + ' y call de ' + vs[1], R3: P + ' contra 3-bet de ' + vs[0], RJ: P + ' contra 3-bet all-in de ' + vs[0],
      R34: P + ' contra 4-bet de ' + vs[0], R3J: P + ' contra 4-bet all-in de ' + vs[0], R34J: P + ' contra 5-bet all-in de ' + vs[0], ROL3: P + ' contra limp-resubida de ' + vs[0], ROLJ: P + ' contra limp y all-in de ' + vs[0],
      LR: 'SB: limp y la BB sube', LJ: 'SB: limp y la BB va all-in', LRJ: 'BB: subes el limp y la SB va all-in', LR3: 'BB: subes el limp y la SB resube', LR3J: 'SB: resubes y la BB va all-in' })[h] || key;
  }
  function decode(sp) {
    if (sp.F) return sp; const A = sp.ac.length, q = sp.q, s = sp.f;
    const val = q === 20 ? (i => CH.indexOf(s[i])) : (i => B36.indexOf(s[2 * i]) * 36 + B36.indexOf(s[2 * i + 1]));
    sp.F = []; sp.W = []; sp.L = [];
    for (let k = 0; k < 169; k++) { const r = []; for (let a = 0; a < A; a++) r.push(val(k * A + a) / q); sp.F.push(r); sp.W.push(sp.w ? CH.indexOf(sp.w[k]) / 20 : 1);
      if (sp.ev) { const l = []; for (let a = 0; a < A; a++) l.push((B36.indexOf(sp.ev[2 * (k * A + a)]) * 36 + B36.indexOf(sp.ev[2 * (k * A + a) + 1])) / 10); sp.L.push(l); } }
    return sp;
  }
  const kind = c => c === 'F' ? 'F' : c === 'C' ? 'C' : c === 'L' ? 'L' : c === 'A' ? 'A' : 'R';
  const actName = c => c === 'F' ? 'Fold' : c === 'C' ? 'Pagar' : c === 'L' ? 'Limp' : c === 'A' ? 'All-in' : 'Subir a ' + c.slice(1).replace('.', ',') + ' bb';
  const COLOR = { F: 'var(--fold)', C: 'var(--call)', L: 'var(--limp)', A: 'var(--allin)', R: 'var(--raise)' };
  const st = FP.store, LIB = {};
  const S = Object.assign({ ctx: 'chipev-eq', stack: 25, fam: 'open', hero: 3, vil: null, key: null, filter: null }, st.get('tablas2', {}));
  let sp = null, quiz = null, playing = null;

  function lib() { return LIB[S.ctx]; }
  function stacks() { return Object.keys(lib()).map(Number).sort((a, b) => a - b); }
  function keysAt(s) { return Object.keys(lib()[s] || {}); }
  function parts(k) { const [h, p, v] = k.split('|'); return [h, +p, (v || '').split(',').filter(x => x !== '').map(Number)]; }
  function famKeys(s) { const f = FAM.find(x => x[0] === S.fam); return keysAt(s).filter(k => f[2](parts(k))); }

  // ---------------------------------------------------------------- controls
  $('t-ctx').innerHTML = CTX.map(([v, l]) => '<button type="button" class="chip" data-v="' + v + '">' + l + '</button>').join('');
  $('t-fam').innerHTML = FAM.map(([v, l]) => '<button type="button" class="chip" data-v="' + v + '">' + l + '</button>').join('');
  $('t-ctx').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; S.ctx = b.dataset.v; load(); });
  $('t-fam').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; S.fam = b.dataset.v; S.key = null; fill(); });
  $('t-stack').addEventListener('input', () => { S.stack = stacks()[+$('t-stack').value]; fill(); });
  $('t-play').addEventListener('click', () => {
    if (playing) { clearInterval(playing); playing = null; $('t-play').textContent = '▶ Ver cómo cambia con el stack'; return; }
    $('t-play').textContent = '❚❚ Parar'; let i = 0; const ss = stacks();
    playing = setInterval(() => { S.stack = ss[i++]; if (i > ss.length) { clearInterval(playing); playing = null; $('t-play').textContent = '▶ Ver cómo cambia con el stack'; return; } fill(); }, 700);
  });
  function seatMap(el, sel, opts, on) {
    el.innerHTML = POS.map((p, i) => '<button type="button" class="seat-b' + (i === sel ? ' on' : '') + '"' + (opts.includes(i) ? '' : ' disabled') + ' data-i="' + i + '">' + p + '</button>').join('');
    el.onclick = e => { const b = e.target.closest('[data-i]'); if (b && !b.disabled) on(+b.dataset.i); };
  }
  function load() {
    st.set('tablas2', S);
    [...$('t-ctx').children].forEach(b => b.classList.toggle('on', b.dataset.v === S.ctx));
    if (LIB[S.ctx]) return fill();
    $('t-grid').innerHTML = '<p class="small">Cargando la librería…</p>';
    fetch('../data/lib-' + S.ctx + '.json').then(r => r.json()).then(d => { LIB[S.ctx] = d; fill(); }).catch(() => { $('t-grid').innerHTML = '<p>No se ha podido cargar la librería.</p>'; });
  }
  function fill() {
    const ss = stacks(); if (!ss.includes(+S.stack)) S.stack = ss.reduce((a, b) => Math.abs(b - S.stack) < Math.abs(a - S.stack) ? b : a);
    $('t-stack').max = ss.length - 1; $('t-stack').value = ss.indexOf(+S.stack); $('t-stackv').textContent = S.stack + ' bb';
    [...$('t-fam').children].forEach(b => { b.classList.toggle('on', b.dataset.v === S.fam); const f = FAM.find(x => x[0] === b.dataset.v); b.disabled = !keysAt(S.stack).some(k => f[2](parts(k))); });
    let ks = famKeys(S.stack); if (!ks.length) { S.fam = 'open'; ks = famKeys(S.stack); }
    $('t-famhelp').textContent = FAM.find(x => x[0] === S.fam)[3];
    const heroes = [...new Set(ks.map(k => parts(k)[1]))];
    if (!heroes.includes(S.hero)) S.hero = heroes.includes(3) ? 3 : heroes[0];
    seatMap($('t-hero'), S.hero, heroes, i => { S.hero = i; S.key = null; fill(); });
    const mine = ks.filter(k => parts(k)[1] === S.hero), vils = [...new Set(mine.map(k => parts(k)[2][0]).filter(x => x != null))];
    $('t-vilrow').hidden = !vils.length;
    if (vils.length) { if (!vils.includes(S.vil)) S.vil = vils[0]; seatMap($('t-vil'), S.vil, vils, i => { S.vil = i; S.key = null; fill(); }); }
    const cand = mine.filter(k => !vils.length || parts(k)[2][0] === S.vil);
    $('t-variant').hidden = cand.length < 2;
    if (!cand.includes(S.key)) S.key = cand[0];
    $('t-variant').innerHTML = cand.map(k => '<option value="' + k + '">' + keyName(k) + '</option>').join(''); $('t-variant').value = S.key;
    st.set('tablas2', S); draw();
  }
  $('t-variant').addEventListener('change', () => { S.key = $('t-variant').value; draw(); });

  // ---------------------------------------------------------------- the chart
  function main(k) { let b = 0; sp.F[k].forEach((f, a) => { if (f > sp.F[k][b]) b = a; }); return b; }
  function draw() {
    sp = decode(lib()[S.stack][S.key]);
    const tot = sp.ac.map(() => 0); let all = 0;
    for (let k = 0; k < 169; k++) { const w = sp.W[k] * CMB[k]; all += w; sp.F[k].forEach((f, a) => tot[a] += f * w); }
    $('t-title').textContent = keyName(S.key) + ' · ' + S.stack + ' bb';
    $('t-sub').textContent = CTX.find(c => c[0] === S.ctx)[1] + ' · ' + Math.round(100 * (1 - (sp.ac.includes('F') ? tot[sp.ac.indexOf('F')] / all : 0))) + ' % de las manos juegan';
    if (S.filter != null && !sp.ac.some(c => kind(c) === S.filter)) S.filter = null;
    $('t-legend').innerHTML = sp.ac.map((c, a) => '<button type="button" class="lg' + (S.filter === kind(c) ? ' on' : '') + '" data-k="' + kind(c) + '"><i style="background:' + COLOR[kind(c)] + '"></i>' + actName(c) + ' <b>' + (all ? Math.round(100 * tot[a] / all) : 0) + ' %</b></button>').join('') +
      (S.filter ? '<button type="button" class="lg" data-k="">Ver todas</button>' : '');
    $('t-legend').onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; S.filter = b.dataset.k || null; if (S.filter === b.dataset.k && b.classList.contains('on')) S.filter = null; draw(); };
    $('t-grid').innerHTML = '<div class="g13" role="group" aria-label="169 manos">' + N.map((h, k) => {
      const m = main(k), c = kind(sp.ac[m]), f = sp.F[k][m], mixed = f < 0.85 && f > 0.15, sec = mixed ? sp.F[k].map((x, a) => [x, a]).filter(x => x[1] !== m).sort((a, b) => b[0] - a[0])[0][1] : -1;
      const dim = (S.filter && !sp.F[k].some((x, a) => x > 0.15 && kind(sp.ac[a]) === S.filter)) || sp.W[k] < 0.05;
      return '<button type="button" class="cell' + (dim ? ' dim' : '') + (c === 'F' ? ' fold' : c === 'L' ? ' limp' : '') + '" data-k="' + k + '" style="--c:' + COLOR[c] + ';--o:' + (0.72 + 0.28 * f).toFixed(2) + '"' + ' aria-label="' + h + ': ' + actName(sp.ac[m]) + ' ' + Math.round(100 * f) + ' %">' +
        h + (mixed ? '<i style="background:' + COLOR[kind(sp.ac[sec])] + '"></i>' : '') + '</button>';
    }).join('') + '</div>';
    $('t-range').value = rangeText();
    if (quiz) nextQuiz(); else detail(N.indexOf(sp.W[N.indexOf('AKs')] > 0.05 ? 'AKs' : 'AA'));
  }
  // compact range text for the hands whose main action is not fold (pairs, then suited, then offsuit)
  function rangeText() {
    const play = k => { const fi = sp.ac.indexOf('F'); return sp.W[k] > 0.05 && (fi < 0 ? 1 : 1 - sp.F[k][fi]) >= 0.5; };
    const out = []; const pairs = []; for (let i = 0; i < 13; i++) if (play(i * 13 + i)) pairs.push(RK[i] + RK[i]); if (pairs.length) out.push(pairs.join(' '));
    for (const t of ['s', 'o']) for (let i = 0; i < 13; i++) { const hs = []; for (let j = i + 1; j < 13; j++) { const k = t === 's' ? i * 13 + j : j * 13 + i; if (play(k)) hs.push(RK[i] + RK[j] + t); } if (hs.length) out.push(hs.join(' ')); }
    return out.join(', ');
  }
  function detail(k, el) {
    const best = sp.L.length ? Math.min(...sp.L[k]) : 0;
    $('t-detail').innerHTML = '<div class="dh"><span class="hand">' + N[k] + '</span><span class="small">' + CMB[k] + ' combinaciones</span></div>' + (sp.W[k] < 0.05 ? '<p class="small">Con esta línea, esta mano casi nunca llega aquí.</p>' : '') +
      sp.ac.map((c, a) => { const f = sp.F[k][a], loss = sp.L.length ? sp.L[k][a] - best : 0;
        return '<div class="act"><div class="row" style="justify-content:space-between;gap:6px"><span><i style="background:' + COLOR[kind(c)] + '"></i>' + actName(c) + '</span><b>' + Math.round(100 * f) + ' %</b></div><div class="bar"><span style="width:' + (100 * f).toFixed(1) + '%;background:' + COLOR[kind(c)] + '"></span></div>' +
          '<div class="small">' + (sp.L.length ? (loss < 0.05 ? 'No pierde nada: es correcta.' : 'Pierde ' + loss.toFixed(1).replace('.', ',') + ' bb frente a la mejor.') : '') + '</div></div>'; }).join('');
    document.querySelectorAll('.cell.sel').forEach(x => x.classList.remove('sel')); const c = document.querySelector('.cell[data-k="' + k + '"]'); if (c) c.classList.add('sel');
  }
  $('t-grid').addEventListener('click', e => { const b = e.target.closest('.cell'); if (b) quiz ? null : detail(+b.dataset.k); });
  $('t-grid').addEventListener('mouseover', e => { const b = e.target.closest('.cell'); if (b && !quiz && matchMedia('(hover: hover)').matches) detail(+b.dataset.k); });
  $('t-copy').addEventListener('click', () => { const t = $('t-range').value; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { $('t-copy').textContent = 'Copiado'; setTimeout(() => $('t-copy').textContent = 'Copiar', 1500); }).catch(() => { $('t-range').select(); }); });

  // ---------------------------------------------------------------- quiz: learn this chart
  $('t-quiz').addEventListener('click', () => { if (quiz) { quiz = null; $('t-quiz').textContent = 'Practicar esta tabla'; $('t-grid').classList.remove('quiz'); $('t-qbox').hidden = true; draw(); return; }
    quiz = { n: 0, ok: 0 }; $('t-quiz').textContent = 'Salir de la práctica'; $('t-grid').classList.add('quiz'); $('t-qbox').hidden = false; nextQuiz(); });
  function nextQuiz() {
    // hands weighted by combos, only ones that reach this spot, more often the mixed / borderline ones
    const pool = []; for (let k = 0; k < 169; k++) if (sp.W[k] > 0.05) { const f = sp.F[k][main(k)]; pool.push([k, CMB[k] * (f < 0.9 ? 3 : 1)]); }
    let r = Math.random() * pool.reduce((a, x) => a + x[1], 0), k = pool[0][0]; for (const [kk, w] of pool) { r -= w; if (r <= 0) { k = kk; break; } }
    quiz.k = k; document.querySelectorAll('.cell').forEach(c => c.classList.toggle('qh', +c.dataset.k === k));
    $('t-qbox').innerHTML = '<p style="margin:0 0 8px"><b>' + keyName(S.key) + ', ' + S.stack + ' bb.</b> Tienes <span class="hand">' + N[k] + '</span>. ¿Qué haces?</p><div class="row">' +
      sp.ac.map((c, a) => '<button type="button" class="btn" data-a="' + a + '">' + actName(c) + '</button>').join('') + '</div><p class="small" style="margin:8px 0 0">' + (quiz.n ? quiz.ok + ' de ' + quiz.n + ' bien' : 'Las manos dudosas salen más.') + '</p>';
    $('t-qbox').querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => answer(+b.dataset.a)));
  }
  function answer(a) {
    const k = quiz.k, best = sp.L.length ? Math.min(...sp.L[k]) : 0, loss = sp.L.length ? sp.L[k][a] - best : (a === main(k) ? 0 : 1), good = loss < 0.1 || sp.F[k][a] >= 0.25;
    quiz.n++; if (good) quiz.ok++;
    $('t-qbox').innerHTML = '<p style="margin:0 0 8px"><b class="' + (good ? 'okc' : 'badc') + '">' + (good ? '¡Bien!' : 'No.') + '</b> Con ' + N[k] + ' la tabla hace ' + sp.ac.map((c, j) => sp.F[k][j] > 0.02 ? actName(c) + ' ' + Math.round(100 * sp.F[k][j]) + ' %' : '').filter(Boolean).join(', ') + '.' +
      (good ? '' : ' Tu jugada pierde ' + loss.toFixed(1).replace('.', ',') + ' bb.') + '</p><div class="row"><button type="button" class="btn pri" id="t-qnext">Siguiente mano</button><span class="small">' + quiz.ok + ' de ' + quiz.n + ' bien (' + Math.round(100 * quiz.ok / quiz.n) + ' %)</span></div>';
    detail(k); $('t-qnext').addEventListener('click', nextQuiz); $('t-qnext').focus();
  }
  load();
})();
