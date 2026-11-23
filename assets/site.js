/* PokerEFX — shared page chrome: header, footer, theme, cookie consent and ads (only after consent). */
(function () {
  'use strict';
  // Fill in when the accounts exist (see /WEB_PLAN.md): Google AdSense publisher id, e.g. 'ca-pub-0000000000000000'.
  const ADSENSE_CLIENT = 'ca-pub-8353031616797469';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('fp.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fp.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const root = document.currentScript ? (document.currentScript.getAttribute('data-root') || '') : '';
  const NAV = [['simulador', 'Simulador'], ['entrenar', 'Entrenar rangos'], ['tablas', 'Tablas preflop'], ['laboratorio', 'Laboratorio'], ['herramientas', 'Herramientas'], ['aprende', 'Aprende'], ['cuenta', 'Mi cuenta']];
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="9" fill="#17584c"/><circle cx="16" cy="16" r="10.5" fill="none" stroke="#e8c46e" stroke-width="2" stroke-dasharray="4.2 2.4"/><path d="M16 8.6c3.2 3.1 6 5.1 6 7.9 0 2-1.6 3.4-3.3 3.4-1 0-1.8-.4-2.3-1.1l.9 4.6h-2.6l.9-4.6c-.5.7-1.3 1.1-2.3 1.1-1.7 0-3.3-1.4-3.3-3.4 0-2.8 2.8-4.8 6-7.9z" fill="#f6efe0"/></svg>';

  function theme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  theme(null); // one grade site-wide, as on the home page

  function chrome(active) {
    const R = root, A = (p, l, sub) => '<a href="' + R + p + '">' + l + (sub ? '<span>' + sub + '</span>' : '') + '</a>';
    const cur = p => (p === active ? ' aria-current="page"' : '');
    const CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const ARROW = '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const tools = ['simulador', 'entrenar', 'tablas', 'calculadoras', 'replayer', 'laboratorio', 'herramientas'].includes(active);
    const h = document.createElement('header'); h.className = 'fp-top';
    h.innerHTML = '<div class="fp-wrap fp-bar"><a class="skip-link" href="#fp-main">Ir al contenido</a>' +
      '<a class="fp-logo" href="' + R + 'index.html"><img src="/assets/icon.svg" alt="" width="24" height="24">PokerEFX</a>' +
      '<nav class="fp-links" id="nav" aria-label="Principal">' +
      '<div class="fp-item"><a class="fp-link" href="' + R + 'simulador/"' + cur('simulador') + '>Simulador</a></div>' +
      '<div class="fp-item"><a class="fp-link" href="' + R + 'tablas/"' + cur('tablas') + '>Tablas</a></div>' +
      '<div class="fp-item fp-has"><a class="fp-link" href="' + R + 'herramientas/"' + (tools && active !== 'simulador' && active !== 'tablas' ? ' aria-current="page"' : '') + '>Herramientas ' + CHEV + '</a>' +
      '<div class="fp-menu"><div class="fp-menu__grid">' +
      '<div class="fp-col"><p>Practicar</p>' + A('simulador/', 'Simulador', 'Juega y el solver te corrige') + A('entrenar/', 'Entrenar rangos', 'Memoriza con repetición espaciada') + A('tablas/', 'Tablas preflop', '11 formatos, de 5 a 100 ciegas') + '</div>' +
      '<div class="fp-col"><p>Analizar</p>' + A('calculadoras/', 'Calculadoras', 'Equity, ICM, pot odds y varianza') + A('replayer/', 'Replayer', 'Revive tus manos de Winamax') + A('laboratorio/', 'Laboratorio', 'Cómo juegan los rivales reales') + '</div>' +
      '<div class="fp-col"><p>Aprender</p>' + A('aprende/', 'Guías', '19 guías con números del solver') + A('rangos/', 'Todos los rangos', '1.061 tablas por stack') + A('aprende/glosario-poker.html', 'Glosario', 'Más de 70 términos explicados') + '</div>' +
      '</div></div></div>' +
      '<div class="fp-item"><a class="fp-link" href="' + R + 'aprende/"' + cur('aprende') + '>Aprende</a></div>' +
      '<div class="fp-item fp-sheet-only"><a class="fp-link" href="' + R + 'cuenta/">Mi cuenta</a></div></nav>' +
      '<div class="fp-actions">' + '<a class="fp-link fp-lang" href="' + ((document.documentElement.lang === 'en') ? location.pathname.replace(/^\/en(\/|$)/, '/') : '/en' + location.pathname) + '" hreflang="' + ((document.documentElement.lang === 'en') ? 'es' : 'en') + '" lang="' + ((document.documentElement.lang === 'en') ? 'es' : 'en') + '" aria-label="' + ((document.documentElement.lang === 'en') ? 'Ver en español' : 'Read in English') + '">' + ((document.documentElement.lang === 'en') ? 'ES' : 'EN') + '</a>' + '<a class="fp-link" href="' + R + 'cuenta/"' + cur('cuenta') + '>Mi cuenta</a><a class="btn btn--primary fp-cta" href="' + R + 'simulador/">Empezar a entrenar' + ARROW + '</a></div>' +
      '<button class="fp-toggle navbtn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menú"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>';
    document.body.prepend(h);
    const main = document.querySelector('main') || document.querySelector('.wrap'); if (main && !main.id) main.id = 'fp-main';
    const nb = h.querySelector('.fp-toggle'), nav = h.querySelector('.fp-links');
    nb.addEventListener('click', () => { const o = h.classList.toggle('open'); nb.setAttribute('aria-expanded', o); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { h.classList.remove('open'); nb.setAttribute('aria-expanded', 'false'); } });
    const col = (t, items) => '<div class="fp-fcol"><h3>' + t + '</h3><ul>' + items.map(([p, l]) => '<li><a href="' + (p.startsWith('http') ? p : R + p) + '"' + (p.startsWith('http') ? ' rel="noopener"' : '') + '>' + l + '</a></li>').join('') + '</ul></div>';
    const f = document.createElement('footer'); f.className = 'fp-foot';
    f.innerHTML = '<div class="fp-wrap">' +
      (active === 'simulador' ? '' : '<div class="fp-close"><div><h2>Entrena antes de tu próximo torneo</h2><p>Diez minutos de simulador antes de jugar. Gratis y sin registro.</p></div><a class="btn btn--primary fp-cta fp-cta--wide" href="' + R + 'simulador/">Empezar a entrenar' + ARROW + '</a></div>') +
      '<div class="fp-fgrid"><div class="fp-fbrand"><a class="fp-logo" href="' + R + 'index.html"><img src="/assets/icon.svg" alt="" width="24" height="24">PokerEFX</a>' +
      '<p class="fp-lede">Herramientas gratis para estudiar póker de torneos con un solver. Solo para mayores de 18 años; aquí no se juega dinero (<a href="https://www.jugarbien.es" rel="noopener">jugarbien.es</a>).</p></div>' +
      col('Practicar', [['simulador/', 'Simulador'], ['entrenar/', 'Entrenar rangos'], ['tablas/', 'Tablas preflop']]) +
      col('Analizar', [['calculadoras/', 'Calculadoras'], ['replayer/', 'Replayer'], ['laboratorio/', 'Laboratorio']]) +
      col('Aprender', [['aprende/', 'Guías'], ['rangos/', 'Todos los rangos'], ['metodologia/', 'Cómo calculamos']]) +
      col('PokerEFX', [['cuenta/', 'Mi cuenta'], ['contacto/', 'Contacto'], ['https://www.instagram.com/pokerefx/', 'Instagram'], ['https://www.youtube.com/@pokerefx', 'YouTube']]) + '</div>' +
      '<div class="fp-legal"><span>&copy; 2026 PokerEFX</span><a href="' + R + 'legal/privacidad.html">Privacidad</a><a href="' + R + 'legal/cookies.html">Cookies</a><a href="' + R + 'legal/aviso-legal.html">Aviso legal</a><a href="' + R + 'legal/cookies.html" id="fp-cookies">Preferencias de cookies</a></div></div>';
    document.body.appendChild(f);
    f.querySelector('#fp-cookies').addEventListener('click', e => { e.preventDefault(); consentBanner(true); });
    consentBanner(false); ads();
  }

  // cookie consent: ads and analytics only with an explicit yes; the choice can be changed from the footer
  function consentBanner(force) {
    if (!force && store.get('consent', null)) return;
    let b = document.querySelector('.consent'); if (b) b.remove();
    b = document.createElement('div'); b.className = 'consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookies');
    b.innerHTML = '<p>Usamos almacenamiento local para guardar tu progreso. Con tu permiso, también cookies de publicidad (Google) que mantienen la web gratis. <a href="' + root + 'legal/cookies.html">Más información</a></p>' +
      '<button class="btn btn--secondary" type="button" data-c="necessary">Solo necesarias</button><button class="btn pri btn--primary" type="button" data-c="all">Aceptar todo</button>';
    b.querySelectorAll('button').forEach(x => x.addEventListener('click', () => { const prev = store.get('consent', null); store.set('consent', x.dataset.c); b.remove(); if (prev && prev !== x.dataset.c) location.reload(); }));
    const host = document.querySelector('.closing__links') || document.querySelector('.fp-foot .fp-wrap'); if (host) host.insertBefore(b, host.querySelector('.footer__legal, .fp-legal')); else document.body.appendChild(b);
  }
  // AdSense loads from each page head (Auto ads place the units); without full consent it serves non-personalised ads.
  function ads() {
    document.querySelectorAll('.ad').forEach(el => { if (ADSENSE_CLIENT) el.remove(); else el.textContent = 'Publicidad'; });
  }

  function consentOnly() { const c = document.getElementById('fp-cookies'); if (c) c.addEventListener('click', e => { e.preventDefault(); consentBanner(true); }); consentBanner(false); }
  window.FP = { chrome, store, root, consentOnly };
})();
/* FX: header shadow once the page scrolls; numbers that count up when they come into view */
(function () {
  'use strict';
  const top = () => document.querySelector('.fp-top');
  let on = false;
  const tick = () => { const t = top(); if (!t) return; const s = window.scrollY > 8; if (s !== on) { on = s; t.classList.toggle('scrolled', s); } };
  window.addEventListener('scroll', tick, { passive: true }); document.addEventListener('DOMContentLoaded', tick);
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function count(el) {
    const end = parseFloat(el.dataset.n), pre = el.dataset.pre || '', fmt = n => pre + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (reduce) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), d = 1400;
    (function f(t) { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(end * e); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const els = document.querySelectorAll('[data-n]'); if (!els.length) return;
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); count(e.target); } }), { threshold: .6 });
    els.forEach(e => io.observe(e));
  });
})();
/* English edition: translate the text the tools create in the browser, with the same rules the build uses */
(function () {
  'use strict';
  if (document.documentElement.lang !== 'en') return;
  let R = null;
  const NUM = s => s.replace(/(?<=\d)\.(?=\d{3}(?!\d))/g, '⁣').replace(/(?<=\d),(?=\d)/g, '.').replace(/⁣/g, ',').replace(/(?<=\d) %/g, '%');
  // the page is already English when it loads: only text that still reads as Spanish is touched
  const ES = /[áéíóúñ¿¡]|\b(de|la|el|los|las|que|con|para|por|una|del|tus|tu|manos|mano|ciegas|cuando|más|según|pierdes|juegas|rival|rivales|tabla|tablas|aquí|sin|está|son|es|y|o|subir|sube|pagar|paga|apuesta|bote|mesa|jugada|correcto|error|imprecisión|foldear|foldea|resubir|cargando|repaso|repasos|nuevo|nueva|hoy|días|cada|todo|todas|todos|ver|elige|mejor|pierde|gana|ganas|cubren|cubres|burbuja)\b/i;
  const ESNUM = /\d,\d+ ?(%|bb|ciegas)/;
  function tr(seg) {
    if (!seg) return seg;
    if (Object.prototype.hasOwnProperty.call(R.exact, seg)) return R.exact[seg];
    if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]/.test(seg)) return (ESNUM.test(seg) || /^\d+,\d+$/.test(seg)) ? NUM(seg) : seg;
    for (const [rx, rep] of R.tpl) { const m = seg.match(rx); if (m && m[0] === seg) return NUM(phr(seg.replace(rx, rep))); }
    if (ES.test(seg) || ESNUM.test(seg)) return NUM(phr(seg));
    return seg;
  }
  function phr(s) { for (const [rx, rep] of R.phr) s = s.replace(rx, rep); return s; }
  const done = new WeakMap();
  function text(n) {
    const v = n.nodeValue; if (!v || !v.trim() || done.get(n) === v) return;
    const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0], core = v.trim().replace(/\s+/g, ' ');
    const out = (lead + tr(core) + trail).replace(/(\d)[\s\u00a0\u202f]%/g, '$1%'); done.set(n, out); if (out !== v) n.nodeValue = out;
  }
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const doneA = new WeakMap();
  function el(e) {
    if (!e.getAttribute) return;
    const seen = doneA.get(e) || {};
    for (const a of ATTRS) {
      const v = e.getAttribute(a); if (!v || seen[a] === v || !/[a-záéíóúñ]{3}/i.test(v)) continue;
      const t = tr(v.trim().replace(/\s+/g, ' ')); seen[a] = t; if (t !== v) e.setAttribute(a, t);
    }
    doneA.set(e, seen);
  }
  function walk(root) {
    if (root.nodeType === 3) { if (!skip(root.parentNode)) text(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    el(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 1) { if (skip(n)) continue; el(n); } else if (!skip(n.parentNode)) text(n); }
  }
  function skip(e) { return !e || (e.closest && e.closest('script,style,textarea,code,pre.hh,[data-no-tr]')); }
  fetch('/assets/i18n-en.json').then(r => r.json()).then(d => {
    R = { exact: d.exact, tpl: d.tpl.map(([p, r]) => [new RegExp(p), r]), phr: d.phr.map(([p, r]) => [new RegExp(p, 'g'), r]) };
    walk(document.body);
    new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') text(m.target); else m.addedNodes.forEach(walk); if (m.type === 'attributes') el(m.target); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }).catch(() => {});
})();
