/* PokerEFX — home page demo: a real chart spot, a random hand, your decision and the solver's answer. */
(function () {
  'use strict';
  const RK = 'AKQJT98765432', SUITS = [['♠', 's'], ['♥', 'h'], ['♦', 'd'], ['♣', 'c']];
  const N = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) N.push(i === j ? RK[i] + RK[j] : i < j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o');
  const $ = id => document.getElementById(id), box = $('demo');
  if (!box) return;
  const kind = c => c === 'F' ? 'F' : c === 'C' ? 'C' : c === 'L' ? 'L' : c === 'A' ? 'A' : 'R';
  const name = c => ({ F: 'Fold', C: 'Pagar', L: 'Limp', A: 'All-in' })[c] || 'Subir a ' + c.slice(1).replace('.', ',');
  const COL = { F: 'var(--k-F)', C: 'var(--k-C)', L: 'var(--k-L)', A: 'var(--k-A)', R: 'var(--k-R)' };
  let D = null, cur = null, score = [0, 0];
  const rnd = n => Math.floor(Math.random() * n);

  function deal() {
    const sp = D[rnd(D.length)];
    // prefer hands near the edge of the range: that is where people make mistakes
    let k, tries = 0;
    do { k = rnd(169); tries++; } while (tries < 40 && Math.max(...sp.F[k]) > .97 && kind(sp.ac[sp.F[k].indexOf(Math.max(...sp.F[k]))]) === 'F' && Math.random() < .8);
    const h = N[k], s1 = rnd(4); let s2 = rnd(4);
    if (h.length === 2) { while (s2 === s1) s2 = rnd(4); } else if (h[2] === 's') s2 = s1; else { while (s2 === s1) s2 = rnd(4); }
    cur = { sp, k, cards: [[h[0], SUITS[s1]], [h[1], SUITS[s2]]] };
    render(null);
  }
  function card([r, s]) { return '<span class="pc ' + s[1] + '">' + (r === 'T' ? '10' : r) + '<small>' + s[0] + '</small></span>'; }
  function grid(sp, k) {
    let h = '<div class="dg" aria-hidden="true">';
    for (let i = 0; i < 169; i++) { const f = sp.F[i]; const m = f.indexOf(Math.max(...f)); h += '<i style="background:' + COL[kind(sp.ac[m])] + (i === k ? ';outline:2px solid var(--accent);outline-offset:-1px;transform:scale(1.35);z-index:2;position:relative' : '') + '"></i>'; }
    return h + '</div>';
  }
  const POS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  function table(sp, cards) {
    const m = sp.slug.match(/^(open|bb|sb|btn|co|hj|utg)-/), hero = (sp.slug.startsWith('open-') ? sp.slug.split('-')[1] : m[1]).toUpperCase();
    const v = sp.slug.match(/vs-(open|all-in|limp)-([a-z]+)/), vil = v ? v[2].toUpperCase() : null, va = v ? { open: 'Sube 2', 'all-in': 'All-in', limp: 'Limp' }[v[1]] : '';
    const h = POS.indexOf(hero), slots = ['s0', 's1', 's2', 's3', 's4', 's5'];
    let seats = '', dslot = 0;
    for (let i = 0; i < 6; i++) {
      const p = POS[(h + i) % 6], pi = POS.indexOf(p); if (p === 'BTN') dslot = i;
      let st = '', cls = 'seat ' + slots[i];
      if (p === hero) { st = 'Tú'; cls += ' me'; } else if (p === vil) { st = va; cls += ' on'; } else if (pi < h && p !== 'SB' && p !== 'BB') { st = 'Fold'; cls += ' out'; } else if (p === 'SB' && pi < h) { st = 'Fold'; cls += ' out'; } else st = p === 'SB' ? '0,5' : p === 'BB' ? '1' : '';
      seats += '<span class="' + cls + '"><b>' + p + '</b>' + (st ? '<em>' + st + '</em>' : '') + '</span>';
    }
    return '<div class="tbl" aria-hidden="true"><div class="felt"><span class="btnd">D</span><div class="dc">' + cards.map(card).join('') + '</div></div>' + seats + '</div>';
  }
  function render(choice) {
    const { sp, k, cards } = cur, f = sp.F[k];
    let v = '';
    if (choice != null) {
      const best = f.indexOf(Math.max(...f)), fr = f[choice];
      const ok = fr >= .5 || choice === best, mix = !ok && fr >= .15;
      score[1]++; if (ok) score[0]++;
      v = '<div class="dv ' + (ok ? 'ok' : mix ? 'mx' : 'ko') + '"><b>' + (ok ? 'Correcto' : mix ? 'Aceptable' : 'Error') + '</b> — el solver con ' + N[k] + ': ' +
        sp.ac.map((c, a) => f[a] > .005 ? name(c) + ' ' + Math.round(100 * f[a]) + ' %' : '').filter(Boolean).join(' · ') + '</div>' +
        grid(sp, k) + '<div class="acts"><button class="btn btn--secondary" type="button" id="dnext">Repartir otra mano</button><a class="link" href="rangos/' + sp.slug + '/">Ver la tabla completa</a></div>';
    }
    box.innerHTML = '<div class="dh"><span class="chip2">ChipEV · ' + sp.S + ' bb</span><span class="small2">' + (score[1] ? 'Aciertos ' + score[0] + '/' + score[1] : 'Ciegas 0,5/1 · ante 1') + '</span></div>' +
      table(sp, cards) + '<p class="dt">' + sp.t + '</p><p class="small2">' + sp.sub + ' ¿Qué haces?</p>' +
      (choice == null ? '<div class="acts">' + sp.ac.map((c, a) => '<button class="act" type="button" data-a="' + a + '" style="--c:' + COL[kind(c)] + '">' + name(c) + '</button>').join('') + '</div>' : v);
    box.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => render(+b.dataset.a)));
    const nx = $('dnext'); if (nx) nx.addEventListener('click', deal);
  }
  fetch('/data/demo.json').then(r => r.json()).then(d => { D = d; deal(); }).catch(() => { box.innerHTML = '<p class="small2">No se pudo cargar la demo. <a href="simulador/">Abre el simulador</a>.</p>'; });
})();
/* Daily challenge: the same 10 hands for everyone each day (seeded by date), score, streak and a shareable result. */
(function () {
  'use strict';
  const box = document.getElementById('daily'); if (!box) return;
  const RK = 'AKQJT98765432', N = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) N.push(i === j ? RK[i] + RK[j] : i < j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o');
  const kind = c => c === 'F' ? 'F' : c === 'C' ? 'C' : c === 'L' ? 'L' : c === 'A' ? 'A' : 'R';
  const name = c => ({ F: 'Fold', C: 'Pagar', L: 'Limp', A: 'All-in' })[c] || 'Subir a ' + c.slice(1).replace('.', ',');
  const COL = { F: 'var(--k-F)', C: 'var(--k-C)', L: 'var(--k-L)', A: 'var(--k-A)', R: 'var(--k-R)' };
  const d = new Date(), key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  let seed = key; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const get = (k, v) => { try { const x = localStorage.getItem(k); return x == null ? v : JSON.parse(x); } catch (e) { return v; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
  const SU = [['♠', 's'], ['♥', 'h'], ['♦', 'd'], ['♣', 'c']];
  let Q = [], i = 0, res = [];
  function streak() { const days = get('fp.dailydays', []); let s = 0; const t = new Date(); for (;;) { const k = t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate(); if (days.includes(k)) { s++; t.setDate(t.getDate() - 1); } else if (s === 0 && k === key) { t.setDate(t.getDate() - 1); } else break; } return s; }
  function finish() {
    const ok = res.filter(Boolean).length, days = get('fp.dailydays', []);
    if (!days.includes(key)) { days.push(key); put('fp.dailydays', days.slice(-400)); }
    put('fp.daily', { key, res });
    const sq = res.map(x => x ? '🟩' : '🟥').join(''), txt = 'PokerEFX · reto del ' + d.getDate() + '/' + (d.getMonth() + 1) + ': ' + ok + '/10 ' + sq + ' pokerefx.com';
    box.innerHTML = '<h3>Reto del día completado</h3><p style="font-size:26px;margin:4px 0">' + sq + '</p><p><b>' + ok + '/10</b> · racha de <b>' + streak() + '</b> día' + (streak() === 1 ? '' : 's') + '. Vuelve mañana: cada día hay 10 manos nuevas, iguales para todos.</p>' +
      '<div class="row"><button class="btn btn--secondary" type="button" id="dl-share">Copiar resultado</button><a class="link" href="entrenar/">Entrenar los rangos</a></div><p class="small" id="dl-msg"></p>';
    document.getElementById('dl-share').addEventListener('click', () => {
      const m = document.getElementById('dl-msg');
      navigator.clipboard.writeText(txt).then(() => { m.textContent = 'Copiado. Pégalo en tu grupo de póker.'; }).catch(() => { m.textContent = txt; });
    });
  }
  function show() {
    if (i >= Q.length) { finish(); return; }
    const { sp, k, c } = Q[i];
    box.innerHTML = '<div class="row" style="justify-content:space-between;align-items:center"><span class="tag">Reto del día · ' + (i + 1) + '/10</span><span class="small">' + res.map(x => x ? '🟩' : '🟥').join('') + '</span></div>' +
      '<h3 style="margin:10px 0 2px">' + sp.t + ' · ' + sp.S + ' bb</h3><p class="small" style="margin:0">' + sp.sub + '</p>' +
      '<div class="dc" style="margin:12px 0">' + c.map(([r, s]) => '<span class="pc ' + s[1] + '">' + (r === 'T' ? '10' : r) + '<small>' + s[0] + '</small></span>').join('') + '</div>' +
      '<div class="row">' + sp.ac.map((a, j) => '<button class="act" type="button" data-a="' + j + '" style="--c:' + COL[kind(a)] + '">' + name(a) + '</button>').join('') + '</div><p class="small" id="dl-r" style="min-height:1.4em;margin-top:8px"></p>';
    box.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      const f = sp.F[k], a = +b.dataset.a; let m = 0; f.forEach((v, j) => { if (v > f[m]) m = j; });
      const ok = f[a] >= .25 || a === m; res.push(ok);
      document.getElementById('dl-r').textContent = (ok ? '✓ Correcto. ' : '✗ ') + 'Solver: ' + sp.ac.map((x, j) => f[j] > .005 ? name(x) + ' ' + Math.round(100 * f[j]) + ' %' : '').filter(Boolean).join(' · ');
      box.querySelectorAll('[data-a]').forEach(x => { x.disabled = true; });
      i++; setTimeout(show, ok ? 1000 : 2200);
    }));
  }
  fetch('/data/demo.json').then(r => r.json()).then(D => {
    const done = get('fp.daily', null); if (done && done.key === key) { res = done.res; finish(); return; }
    for (let n = 0; n < 10; n++) {
      const sp = D[Math.floor(rnd() * D.length)]; let k, t = 0;
      do { k = Math.floor(rnd() * 169); t++; } while (t < 50 && Math.max(...sp.F[k]) > .97 && kind(sp.ac[sp.F[k].indexOf(Math.max(...sp.F[k]))]) === 'F');
      const h = N[k], s1 = Math.floor(rnd() * 4); let s2 = Math.floor(rnd() * 4);
      if (h.length === 2 || h[2] === 'o') { while (s2 === s1) s2 = (s2 + 1) % 4; } else s2 = s1;
      Q.push({ sp, k, c: [[h[0], SU[s1]], [h[1], SU[s2]]] });
    }
    show();
  }).catch(() => { box.hidden = true; });
})();
