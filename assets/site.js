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
  theme(store.get('theme', null));

  function chrome(active) {
    const h = document.createElement('div'); h.setAttribute('role', 'banner'); h.className = 'fp-top';
    h.innerHTML = '<div class="fp-wrap"><a class="brand" href="' + root + 'index.html">' + LOGO + '<span class="wm">Poker<b>EFX</b></span></a>' +
      '<button class="navbtn" type="button" aria-expanded="false" aria-controls="nav">Menú</button>' +
      '<nav class="nav" id="nav">' + NAV.map(([p, l]) => '<a href="' + root + p + '/index.html"' + (p === active ? ' aria-current="page"' : '') + '>' + l + '</a>').join('') +
      '<button class="theme" type="button" title="Tema claro u oscuro" aria-label="Cambiar tema"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button></nav></div>';
    document.body.prepend(h);
    const nb = h.querySelector('.navbtn'), nav = h.querySelector('.nav');
    nb.addEventListener('click', () => { const o = nav.classList.toggle('open'); nb.setAttribute('aria-expanded', o); });
    h.querySelector('.theme').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark'; theme(next); store.set('theme', next);
    });
    const f = document.createElement('div'); f.setAttribute('role', 'contentinfo'); f.className = 'fp-foot';
    f.innerHTML = '<div class="fp-wrap fcols"><div class="fbrand"><b>PokerEFX</b><p>Estudia póker de torneos con un solver GTO, gratis y en español.</p><p class="small">Solo para mayores de 18 años. Aquí no se juega dinero. Juega con responsabilidad (<a href="https://www.jugarbien.es" rel="noopener">jugarbien.es</a>).</p></div>' +
      '<nav aria-label="Herramientas"><b>Herramientas</b><a href="' + root + 'simulador/">Simulador</a><a href="' + root + 'entrenar/">Entrenar rangos</a><a href="' + root + 'tablas/">Tablas preflop</a><a href="' + root + 'replayer/">Replayer de manos</a><a href="' + root + 'calculadoras/">Calculadoras</a><a href="' + root + 'herramientas/">Todas</a></nav>' +
      '<nav aria-label="Aprende"><b>Aprende</b><a href="' + root + 'aprende/como-estudiar-poker.html">Cómo estudiar póker</a><a href="' + root + 'rangos/">Todos los rangos</a><a href="' + root + 'aprende/rangos-push-fold.html">Push/fold</a><a href="' + root + 'aprende/glosario-poker.html">Glosario</a><a href="' + root + 'metodologia/">Cómo calculamos</a></nav>' +
      '<nav aria-label="Legal"><b>PokerEFX</b><a href="' + root + 'cuenta/">Mi cuenta y planes</a><a href="' + root + 'contacto/">Contacto</a><a href="' + root + 'legal/privacidad.html">Privacidad</a><a href="' + root + 'legal/cookies.html">Cookies</a><a href="' + root + 'legal/aviso-legal.html">Aviso legal</a><a href="#" id="fp-cookies">Preferencias de cookies</a></nav></div>';
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
    const host = document.querySelector('.closing__links'); if (host) host.insertBefore(b, host.querySelector('.footer__legal')); else document.body.appendChild(b);
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
