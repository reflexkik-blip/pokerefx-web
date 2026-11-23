/* PokerEFX — range trainer with spaced repetition. Three steps per range (study, trace, from memory), a hand-by-hand
   mode, mastery "heat", daily streak and a review queue. Progress lives in localStorage (fp.srs) and syncs with the
   cloud account like the rest of fp.* keys. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const RK = 'AKQJT98765432';
  const N = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) N.push(i === j ? RK[i] + RK[j] : i < j ? RK[i] + RK[j] + 's' : RK[j] + RK[i] + 'o');
  const CMB = N.map(h => h.length === 2 ? 6 : h[2] === 's' ? 4 : 12);
  const kind = c => c === 'F' ? 'F' : c === 'C' ? 'C' : c === 'L' ? 'L' : c === 'A' ? 'A' : 'R';
  const name = c => ({ F: 'Fold', C: 'Pagar', L: 'Limp', A: 'All-in' })[c] || (c.length > 1 ? 'Subir ' + c.slice(1).replace('.', ',') : 'Subir');
  const COL = { F: 'var(--fold)', C: 'var(--call)', L: 'var(--limp)', A: 'var(--allin)', R: 'var(--raise)' };
  const DAY = 864e5, today = () => Math.floor(Date.now() / DAY);
  const st = (() => { try { return JSON.parse(localStorage.getItem('fp.srs')) || {}; } catch (e) { return {}; } })();
  st.cards = st.cards || {}; st.days = st.days || [];
  const save = () => { try { localStorage.setItem('fp.srs', JSON.stringify(st)); } catch (e) { /* storage blocked */ } };
  let D = [], cur = null, step = 0, paint = null, brush = 0, drag = false, quiz = null;

  // ---------------------------------------------------------------- spaced repetition (SM-2 style, in days)
  function card(id) { return st.cards[id] || { ease: 2.3, ivl: 0, due: today(), best: 0, n: 0 }; }
  function review(id, score) {
    const c = card(id); c.n++; c.best = Math.max(c.best, score); c.last = today();
    if (score >= .97) { c.ivl = c.ivl ? Math.round(c.ivl * c.ease) : 1; c.ease = Math.min(3, c.ease + .1); }
    else if (score >= .85) { c.ivl = Math.max(1, Math.round((c.ivl || 1) * 1.2)); }
    else { c.ivl = 0; c.ease = Math.max(1.3, c.ease - .2); }
    c.due = today() + c.ivl; st.cards[id] = c;
    if (!st.days.includes(today())) st.days.push(today());
    save();
  }
  function heat(id) {
    const c = st.cards[id]; if (!c) return ['nuevo', 'var(--muted)'];
    const late = today() - c.due;
    if (c.best >= .97 && late < 0) return ['caliente', 'var(--raise)'];
    if (late <= 0) return ['templado', 'var(--limp)'];
    return ['enfriado', '#4f8fc0'];
  }
  function streak() { let s = 0, d = today(); const set = new Set(st.days); if (!set.has(d)) d--; while (set.has(d)) { s++; d--; } return s; }

  // ---------------------------------------------------------------- own ranges (editor / import)
  const SETS = [['F', 'R'], ['F', 'A'], ['F', 'C', 'R'], ['F', 'R', 'A'], ['F', 'C', 'A'], ['F', 'L', 'R', 'A']];
  const SETN = c => ({ F: 'Fold', C: 'Pagar', L: 'Limp', A: 'All-in', R: 'Subir' })[c];
  function mine() { return (st.mine || []).map(m => ({ id: 'mine:' + m.id, g: 'Mis rangos', t: m.t, S: m.S || '', slug: '', ac: m.ac, F: m.p.map(a => m.ac.map((_, j) => j === a ? 1 : 0)), own: m.id })); }
  function parseRange(txt) {
    const out = new Set(), ri = c => RK.indexOf(c.toUpperCase());
    txt.split(/[,;\s]+/).filter(Boolean).forEach(tok => {
      let m;
      if ((m = tok.match(/^([2-9TJQKA])\1\+$/i))) { for (let i = ri(m[1]); i >= 0; i--) out.add(RK[i] + RK[i]); return; }
      if ((m = tok.match(/^([2-9TJQKA])\1-([2-9TJQKA])\2$/i))) { const a = ri(m[1]), b = ri(m[2]); for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(RK[i] + RK[i]); return; }
      if ((m = tok.match(/^([2-9TJQKA])\1$/i))) { out.add(m[1].toUpperCase() + m[1].toUpperCase()); return; }
      const sfx = t => t ? [t.toLowerCase()] : ['s', 'o'];
      if ((m = tok.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)\+$/i))) { const h = ri(m[1]), k = ri(m[2]); for (let j = k; j > h; j--) sfx(m[3]).forEach(x => out.add(RK[h] + RK[j] + x)); return; }
      if ((m = tok.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)-\1([2-9TJQKA])\3$/i))) { const h = ri(m[1]), a = ri(m[2]), b = ri(m[4]); for (let j = Math.min(a, b); j <= Math.max(a, b); j++) sfx(m[3]).forEach(x => out.add(RK[h] + RK[j] + x)); return; }
      if ((m = tok.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)$/i))) { let h = ri(m[1]), k = ri(m[2]); if (h > k) [h, k] = [k, h]; if (h !== k) sfx(m[3]).forEach(x => out.add(RK[h] + RK[k] + x)); }
    });
    return [...out].map(h => N.indexOf(h)).filter(k => k >= 0);
  }
  function editor(m) {
    cur = null; step = 0; renderDeck();
    const e = m ? JSON.parse(JSON.stringify(m)) : { id: Date.now().toString(36), t: '', S: '', ac: ['F', 'R'], p: N.map(() => 0) };
    let br = 1;
    const draw = () => {
      $('e-work').innerHTML = '<div class="eyebrow">Mis rangos</div><h2>' + (m ? 'Editar rango' : 'Crear o importar un rango') + '</h2>' +
        '<div class="row" style="margin:10px 0"><label class="f" style="flex:1 1 240px">Nombre<input type="text" id="m-t" maxlength="40" placeholder="Ej.: Mi open CO 25 bb"></label><label class="f" style="width:110px">Stack (bb)<input type="number" id="m-s" min="1" max="300"></label>' +
        '<label class="f">Acciones<select id="m-ac">' + SETS.map((x, i) => '<option value="' + i + '"' + (x.join() === e.ac.join() ? ' selected' : '') + '>' + x.map(SETN).join(' / ') + '</option>').join('') + '</select></label></div>' +
        '<div class="pal">' + e.ac.map((c, a) => '<button type="button" data-b="' + a + '" class="' + (a === br ? 'on' : '') + '" style="--c:' + COL[c] + '"><i></i>' + SETN(c) + '</button>').join('') + '</div>' +
        '<div class="eg" id="e-grid">' + N.map((h, k) => '<span data-k="' + k + '" style="background:' + COL[e.ac[e.p[k]]] + '">' + h + '</span>').join('') + '</div>' +
        '<label class="f" style="margin-top:6px">Pegar un rango para la acción seleccionada (p. ej. «22+, A2s+, KTo+, QJs-Q9s»)<textarea id="m-txt" rows="2" style="font:14px ui-monospace,monospace;border:1px solid var(--line);border-radius:9px;padding:8px;background:var(--card);color:var(--ink)"></textarea></label>' +
        '<div class="row" style="gap:8px;margin-top:10px"><button class="btn" type="button" id="m-apply">Aplicar texto</button><button class="btn pri" type="button" id="m-save">Guardar y entrenar</button>' + (m ? '<button class="btn" type="button" id="m-del">Borrar</button>' : '') + '</div><p class="small" id="m-msg"></p>';
      $('m-t').value = e.t; $('m-s').value = e.S;
      $('m-ac').addEventListener('change', ev => { const old = e.ac; e.ac = SETS[+ev.target.value]; e.p = e.p.map(a => Math.max(0, e.ac.indexOf(old[a]))); br = Math.min(br, e.ac.length - 1); draw(); });
      document.querySelectorAll('.pal [data-b]').forEach(b => b.addEventListener('click', () => { br = +b.dataset.b; document.querySelectorAll('.pal [data-b]').forEach(x => x.classList.toggle('on', x === b)); }));
      const g = $('e-grid'); let dr = false;
      const hit = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t && t.dataset && t.dataset.k != null && g.contains(t) ? t : null; };
      const set = t => { e.p[+t.dataset.k] = br; t.style.background = COL[e.ac[br]]; };
      g.addEventListener('pointerdown', ev => { const t = hit(ev); if (!t) return; dr = true; g.setPointerCapture(ev.pointerId); set(t); ev.preventDefault(); });
      g.addEventListener('pointermove', ev => { if (dr) { const t = hit(ev); if (t) set(t); } });
      g.addEventListener('pointerup', () => { dr = false; });
      $('m-apply').addEventListener('click', () => { const ks = parseRange($('m-txt').value); ks.forEach(k => { e.p[k] = br; }); e.t = $('m-t').value; e.S = $('m-s').value; draw(); $('m-msg').textContent = ks.length + ' manos marcadas como ' + SETN(e.ac[br]).toLowerCase() + '.'; });
      $('m-save').addEventListener('click', () => {
        e.t = $('m-t').value.trim() || 'Mi rango'; e.S = +$('m-s').value || '';
        st.mine = (st.mine || []).filter(x => x.id !== e.id).concat([e]); save();
        D = D.filter(x => !x.own).concat(mine()); open(D.find(x => x.own === e.id));
      });
      if (m) $('m-del').addEventListener('click', ev => { if (ev.target.dataset.arm) { st.mine = st.mine.filter(x => x.id !== e.id); delete st.cards['mine:' + e.id]; save(); D = D.filter(x => x.own !== e.id); cur = null; renderDeck(); renderWork(); } else { ev.target.dataset.arm = 1; ev.target.textContent = 'Pulsa otra vez para borrar'; } });
    };
    draw();
  }
  const newBtn = $('e-new'); if (newBtn) newBtn.addEventListener('click', () => editor(null));

  // ---------------------------------------------------------------- deck panel
  function due() { return D.filter(x => st.cards[x.id] && card(x.id).due <= today()).sort((a, b) => card(a.id).due - card(b.id).due); }
  function renderDeck() {
    const dd = due(), fresh = D.filter(x => !st.cards[x.id]).slice(0, Math.max(0, 3 - dd.length));
    const mast = D.filter(x => (st.cards[x.id] || {}).best >= .97).length;
    $('e-kpi').innerHTML = '<div><b>' + streak() + '</b><span>días seguidos</span></div><div><b>' + mast + '/' + D.length + '</b><span>rangos dominados</span></div><div><b>' + dd.length + '</b><span>por repasar hoy</span></div>';
    const item = x => { const [h, c] = heat(x.id); return '<button type="button" class="di' + (cur && cur.id === x.id ? ' on' : '') + '" data-id="' + x.id + '"><span class="dot" style="background:' + c + '"></span><span>' + esc(x.t) + (x.S ? ' <small>' + x.S + ' bb</small>' : '') + '</span><em>' + h + '</em></button>'; };
    $('e-today').innerHTML = (dd.concat(fresh)).map(item).join('') || '<p class="small">Nada pendiente hoy. Elige cualquier rango abajo.</p>';
    const groups = [...new Set(D.map(x => x.g))];
    $('e-all').innerHTML = groups.map(g => '<details><summary>' + g + '</summary>' + D.filter(x => x.g === g).map(item).join('') + '</details>').join('');
    document.querySelectorAll('.di').forEach(b => b.addEventListener('click', () => open(D.find(x => x.id === b.dataset.id))));
  }

  // ---------------------------------------------------------------- range work
  const main = (r, k) => { const f = r.F[k]; let m = 0; f.forEach((v, a) => { if (v > f[m]) m = a; }); return m; };
  const okFor = (r, k, a) => r.F[k][a] >= .25 || a === main(r, k);
  function open(r) {
    cur = r; step = 0; quiz = null; paint = N.map(() => r.ac.indexOf('F') >= 0 ? r.ac.indexOf('F') : 0);
    brush = r.ac.findIndex(c => kind(c) !== 'F'); if (brush < 0) brush = 0;
    renderDeck(); renderWork();
    if (innerWidth < 900) $('e-work').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function grid(mode) {
    const r = cur; let h = '<div class="eg' + (mode === 'trace' ? ' trace' : '') + '" id="e-grid">';
    for (let k = 0; k < 169; k++) {
      let bg;
      if (mode === 'study') { let x = 0; const seg = []; r.ac.forEach((c, a) => { const w = r.F[k][a] * 100; if (w > 0) { seg.push(COL[kind(c)] + ' ' + x + '% ' + (x + w) + '%'); x += w; } }); bg = seg.length === 1 ? seg[0].split(' ')[0] : 'linear-gradient(90deg,' + seg.join(',') + ')'; }
      else bg = COL[kind(r.ac[paint[k]])];
      const ghost = mode === 'trace' ? ' style="--ghost:' + COL[kind(r.ac[main(r, k)])] + ';background:' + bg + '"' : ' style="background:' + bg + '"';
      h += '<span data-k="' + k + '"' + ghost + '>' + N[k] + '</span>';
    }
    return h + '</div>';
  }
  function palette() { return '<div class="pal">' + cur.ac.map((c, a) => '<button type="button" data-b="' + a + '" class="' + (a === brush ? 'on' : '') + '" style="--c:' + COL[kind(c)] + '"><i></i>' + name(c) + '</button>').join('') + '</div>'; }
  const STEPS = ['Estudiar', 'Calcar', 'De memoria', 'Mano a mano'];
  function renderWork() {
    const r = cur, w = $('e-work');
    if (!r) { w.innerHTML = '<div class="empty"><h2>Elige un rango</h2><p>Empieza por los de «Para repasar hoy». Cada rango se fija en tres pasos: lo estudias, lo calcas encima y lo redibujas de memoria. La app te lo vuelve a pedir justo antes de que lo olvides.</p></div>'; return; }
    const tabs = '<div class="steps">' + STEPS.map((s, i) => '<button type="button" data-s="' + i + '" class="' + (i === step ? 'on' : '') + '"><b>' + (i + 1) + '</b>' + s + '</button>').join('') + '</div>';
    const head = '<div class="wh"><div><div class="eyebrow">' + r.g + (r.own ? '' : ' · ChipEV') + (r.S ? ' · ' + r.S + ' bb' : '') + '</div><h2>' + esc(r.t) + '</h2></div>' + (r.own ? '<button class="btn" type="button" id="e-edit">Editar</button>' : '<a class="small" href="../rangos/' + r.slug + '/">Ver la página del rango →</a>') + '</div>';
    let body = '';
    if (step === 0) body = '<p class="small">Mira dónde va cada acción. Fíjate en las fronteras: la última mano que se juega en cada fila.</p>' + grid('study') + legend() + '<button class="btn pri" type="button" id="e-go">Ya lo tengo: a calcar</button>';
    else if (step === 1 || step === 2) body = '<p class="small">' + (step === 1 ? 'El rango aparece atenuado: pinta encima con el color de cada acción.' : 'Sin ayuda: redibuja el rango de memoria.') + ' Elige acción y pulsa o arrastra sobre las casillas.</p>' + palette() + grid(step === 1 ? 'trace' : 'blank') +
      '<div class="row" style="gap:8px;margin-top:12px"><button class="btn pri" type="button" id="e-check">Comprobar</button><button class="btn" type="button" id="e-clear">Borrar</button></div><div id="e-res"></div>';
    else body = '<div id="e-quiz"></div>';
    w.innerHTML = head + tabs + body;
    w.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { step = +b.dataset.s; renderWork(); }));
    if (r.own) $('e-edit').addEventListener('click', () => editor((st.mine || []).find(x => x.id === r.own)));
    if (step === 0) $('e-go').addEventListener('click', () => { step = 1; renderWork(); });
    if (step === 1 || step === 2) bindPaint();
    if (step === 3) nextHand();
  }
  function legend() { return '<div class="leg">' + cur.ac.map(c => '<span><i style="background:' + COL[kind(c)] + '"></i>' + name(c) + '</span>').join('') + '</div>'; }
  function bindPaint() {
    document.querySelectorAll('.pal [data-b]').forEach(b => b.addEventListener('click', () => { brush = +b.dataset.b; document.querySelectorAll('.pal [data-b]').forEach(x => x.classList.toggle('on', x === b)); }));
    const g = $('e-grid');
    const hit = e => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.dataset && t.dataset.k != null && g.contains(t) ? t : null; };
    const set = t => { const k = +t.dataset.k; if (paint[k] === brush) return; paint[k] = brush; t.style.background = COL[kind(cur.ac[brush])]; t.classList.remove('bad'); };
    g.addEventListener('pointerdown', e => { const t = hit(e); if (!t) return; drag = true; g.setPointerCapture(e.pointerId); set(t); e.preventDefault(); });
    g.addEventListener('pointermove', e => { if (!drag) return; const t = hit(e); if (t) set(t); });
    g.addEventListener('pointerup', () => { drag = false; }); g.addEventListener('pointercancel', () => { drag = false; });
    $('e-clear').addEventListener('click', () => { const f = cur.ac.indexOf('F'); paint = N.map(() => f >= 0 ? f : 0); renderWork(); });
    $('e-check').addEventListener('click', check);
  }
  function check() {
    let good = 0, tot = 0; const bad = [];
    for (let k = 0; k < 169; k++) { tot += CMB[k]; if (okFor(cur, k, paint[k])) good += CMB[k]; else bad.push(k); }
    const s = good / tot;
    document.querySelectorAll('#e-grid span').forEach(el => el.classList.toggle('bad', bad.includes(+el.dataset.k)));
    const pct = Math.round(1000 * s) / 10;
    if (step === 2) review(cur.id, s);
    const msg = s >= .97 ? '¡Perfecto! Rango dominado.' : s >= .85 ? 'Casi: repasa las casillas marcadas.' : 'Todavía no: vuelve a estudiarlo y repite.';
    $('e-res').innerHTML = '<div class="res ' + (s >= .97 ? 'ok' : s >= .85 ? 'mx' : 'ko') + '"><b>' + String(pct).replace('.', ',') + ' %</b> de acierto (ponderado por combos). ' + msg +
      (bad.length ? '<br><span class="small">Fallos: ' + bad.slice(0, 18).map(k => N[k] + ' (' + name(cur.ac[main(cur, k)]).toLowerCase() + ')').join(', ') + (bad.length > 18 ? '…' : '') + '</span>' : '') +
      (step === 2 ? '<br><span class="small">Próximo repaso: ' + nextTxt(card(cur.id).due) + '.</span>' : '') + '</div>' +
      (step === 1 && s >= .85 ? '<button class="btn pri" type="button" id="e-next">Ahora de memoria</button>' : '');
    const nx = $('e-next'); if (nx) nx.addEventListener('click', () => { step = 2; const f = cur.ac.indexOf('F'); paint = N.map(() => f >= 0 ? f : 0); renderWork(); });
    renderDeck();
  }
  function nextTxt(d) { const n = d - today(); return n <= 0 ? 'hoy' : n === 1 ? 'mañana' : 'en ' + n + ' días'; }
  // ---------------------------------------------------------------- hand by hand
  function nextHand() {
    quiz = quiz || { n: 0, ok: 0 };
    let k; do { k = Math.floor(Math.random() * 169); } while (Math.max(...cur.F[k]) > .98 && kind(cur.ac[main(cur, k)]) === 'F' && Math.random() < .75);
    const S = ['♠', '♥', '♦', '♣'], cls = ['s', 'h', 'd', 'c'], h = N[k]; const a = Math.floor(Math.random() * 4); let b = a;
    if (h.length === 2 || h[2] === 'o') while (b === a) b = Math.floor(Math.random() * 4);
    const c = (r, i) => '<span class="pc ' + cls[i] + '">' + (r === 'T' ? '10' : r) + '<small>' + S[i] + '</small></span>';
    $('e-quiz').innerHTML = '<p class="small">' + (quiz.n ? 'Aciertos ' + quiz.ok + '/' + quiz.n + ' · ' : '') + '10 manos seguidas sin fallo y el rango se calienta.</p><div class="dc">' + c(h[0], a) + c(h[1], b) + '</div><div class="row" style="gap:8px">' +
      cur.ac.map((x, i) => '<button class="btn act" type="button" data-q="' + i + '" style="--c:' + COL[kind(x)] + '">' + name(x) + '</button>').join('') + '</div><div id="e-qr"></div>';
    document.querySelectorAll('[data-q]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.q, ok = okFor(cur, k, i); quiz.n++; if (ok) quiz.ok++;
      $('e-qr').innerHTML = '<div class="res ' + (ok ? 'ok' : 'ko') + '"><b>' + (ok ? 'Correcto' : 'Error') + '</b> — ' + N[k] + ': ' + cur.ac.map((x, j) => cur.F[k][j] > .005 ? name(x) + ' ' + Math.round(100 * cur.F[k][j]) + ' %' : '').filter(Boolean).join(' · ') + '</div>';
      document.querySelectorAll('[data-q]').forEach(x => { x.disabled = true; });
      if (quiz.n >= 10) { review(cur.id, quiz.ok / quiz.n); renderDeck(); $('e-qr').innerHTML += '<p class="small">Serie terminada: ' + quiz.ok + '/10. Próximo repaso ' + nextTxt(card(cur.id).due) + '.</p>'; quiz = null; }
      setTimeout(nextHand, ok ? 900 : 2200);
    }));
  }
  fetch('/data/srs.json').then(r => r.json()).then(d => { D = d.concat(mine()); renderDeck(); const first = due()[0]; renderWork(); if (first && innerWidth >= 900) open(first); })
    .catch(() => { $('e-work').innerHTML = '<p>No se pudo cargar el entrenador. Recarga la página.</p>'; });
})();
