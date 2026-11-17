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
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="5" width="18" height="24" rx="3" fill="#fffdf8" stroke="#b8862f" stroke-width="1.6" transform="rotate(-8 12 17)"/><rect x="11" y="3" width="18" height="24" rx="3" fill="#17584c" stroke="#b8862f" stroke-width="1.6" transform="rotate(7 20 15)"/><path d="M20 9l3.2 4.6-3.2 4.6-3.2-4.6z" fill="#e8c46e" transform="rotate(7 20 15)"/></svg>';

  function theme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  theme(store.get('theme', null));

  function chrome(active) {
    const h = document.createElement('div'); h.setAttribute('role', 'banner'); h.className = 'fp-top';
    h.innerHTML = '<div class="fp-wrap"><a class="brand" href="' + root + 'index.html">' + LOGO + 'PokerEFX</a>' +
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
    f.innerHTML = '<div class="fp-wrap"><div><b>PokerEFX</b> · entrenamiento de torneos con teoría GTO y rivales reales.<br>Solo para mayores de 18 años. Esto es formación: no se juega dinero aquí. Juega con responsabilidad (<a href="https://www.jugarbien.es" rel="noopener">jugarbien.es</a>).</div>' +
      '<div><a href="' + root + 'rangos/">Todos los rangos</a> · <a href="' + root + 'metodologia/">Cómo calculamos</a> · <a href="' + root + 'replayer/">Replayer de manos</a> · <a href="' + root + 'legal/privacidad.html">Privacidad</a> · <a href="' + root + 'legal/cookies.html">Cookies</a> · <a href="' + root + 'legal/aviso-legal.html">Aviso legal</a> · <a href="#" id="fp-cookies">Preferencias de cookies</a></div></div>';
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
      '<button class="btn" type="button" data-c="necessary">Solo necesarias</button><button class="btn pri" type="button" data-c="all">Aceptar todo</button>';
    b.querySelectorAll('button').forEach(x => x.addEventListener('click', () => { const prev = store.get('consent', null); store.set('consent', x.dataset.c); b.remove(); if (prev && prev !== x.dataset.c) location.reload(); }));
    document.body.appendChild(b);
  }
  // AdSense loads from each page head (Auto ads place the units); without full consent it serves non-personalised ads.
  function ads() {
    document.querySelectorAll('.ad').forEach(el => { if (ADSENSE_CLIENT) el.remove(); else el.textContent = 'Publicidad'; });
  }

  window.FP = { chrome, store, root };
})();
