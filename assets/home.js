/* Forja Póker — home page demo: a real chart spot, a random hand, your decision and the solver's answer. */
(function () {
  'use strict';
  const RK = 'AKQJT98765432', SUITS = [['♠', 's'], ['♥', 'h'], ['♦', 'd'], ['♣', 'c']];
  const N = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) N.push(i === j ? RK[i] + RK[j] : i < j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o');
  const $ = id => document.getElementById(id), box = $('demo');
  if (!box) return;
  const kind = c => c === 'F' ? 'F' : c === 'C' ? 'C' : c === 'L' ? 'L' : c === 'A' ? 'A' : 'R';
  const name = c => ({ F: 'Fold', C: 'Pagar', L: 'Limp', A: 'All-in' })[c] || 'Subir a ' + c.slice(1).replace('.', ',');
  const COL = { F: 'var(--fold)', C: 'var(--call)', L: 'var(--limp)', A: 'var(--allin)', R: 'var(--raise)' };
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
    for (let i = 0; i < 169; i++) { const f = sp.F[i]; const m = f.indexOf(Math.max(...f)); h += '<i style="background:' + COL[kind(sp.ac[m])] + (i === k ? ';outline:2px solid #fff;outline-offset:-1px;transform:scale(1.35);z-index:2;position:relative' : '') + '"></i>'; }
    return h + '</div>';
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
        grid(sp, k) + '<div class="row" style="gap:8px;margin-top:10px"><button class="btn pri" type="button" id="dnext">Otra mano</button><a class="btn ghost" href="rangos/' + sp.slug + '/">Ver la tabla</a></div>';
    }
    box.innerHTML = '<div class="dh"><span class="chip2">ChipEV · ' + sp.S + ' bb</span><span class="small2">' + (score[1] ? 'Aciertos ' + score[0] + '/' + score[1] : 'Prueba rápida') + '</span></div>' +
      '<h3>' + sp.t + '</h3><p class="small2">' + sp.sub + ' ¿Qué haces?</p><div class="dc">' + cards.map(card).join('') + '</div>' +
      (choice == null ? '<div class="row" style="gap:8px">' + sp.ac.map((c, a) => '<button class="btn act" type="button" data-a="' + a + '" style="--c:' + COL[kind(c)] + '">' + name(c) + '</button>').join('') + '</div>' : v);
    box.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => render(+b.dataset.a)));
    const nx = $('dnext'); if (nx) nx.addEventListener('click', deal);
  }
  fetch('data/demo.json').then(r => r.json()).then(d => { D = d; deal(); }).catch(() => { box.innerHTML = '<p class="small2">No se pudo cargar la demo. <a href="simulador/">Abre el simulador</a>.</p>'; });
})();
