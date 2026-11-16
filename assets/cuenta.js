/* PokerEFX — local account page: progress from the simulator's stored decisions, export / import / delete. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const pc = x => Math.round(100 * x) + ' %', f1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
  function render() {
    const H = get('sim.hist', []), n = H.length, ok = H.filter(d => d.v === 'ok').length, loss = H.reduce((a, d) => a + (d.loss || 0), 0);
    const days = new Set(H.map(d => new Date(d.t || 0).toDateString())).size;
    $('acc-kpi').innerHTML = [[n, 'decisiones entrenadas'], [n ? pc(ok / n) : '–', 'correctas'], [n ? f1(loss / n) + ' bb' : '–', 'EV perdido por decisión'], [days, 'días entrenando']]
      .map(([v, l]) => '<div class="box kpi"><b>' + v + '</b><span>' + l + '</span></div>').join('');
    const ST = { pre: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
    $('acc-st').innerHTML = n ? '<table class="t"><tr><th>Calle</th><th>Decisiones</th><th>Correctas</th><th>EV perdido por decisión</th></tr>' + Object.keys(ST).map(s => { const X = H.filter(d => d.street === s); return X.length ? '<tr><td>' + ST[s] + '</td><td>' + X.length + '</td><td>' + pc(X.filter(d => d.v === 'ok').length / X.length) + '</td><td>' + f1(X.reduce((a, d) => a + (d.loss || 0), 0) / X.length) + ' bb</td></tr>' : ''; }).join('') + '</table>'
      : '<p class="small">Aún no hay decisiones. <a href="../simulador/index.html">Juega unas manos en el simulador</a>.</p>';
    $('acc-name').value = get('fp.name', '') || '';
  }
  $('acc-name').addEventListener('change', e => { set('fp.name', e.target.value.trim()); $('acc-msg').textContent = 'Guardado.'; });
  $('acc-exp').addEventListener('click', () => {
    const data = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(sim|fp)\./.test(k)) data[k] = localStorage.getItem(k); } } catch (e) { /* none */ }
    const blob = new Blob([JSON.stringify({ pokerefx: 1, saved: new Date().toISOString(), data })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pokerefx-progreso.json'; document.body.appendChild(a); a.click(); a.remove();
    $('acc-msg').textContent = 'Archivo descargado. Impórtalo en otro dispositivo desde esta página.';
  });
  $('acc-imp').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { const j = JSON.parse(r.result); if (!(j.forjapoker||j.pokerefx)) throw 0; Object.entries(j.data).forEach(([k, v]) => localStorage.setItem(k, v)); $('acc-msg').textContent = 'Progreso importado.'; render(); } catch (err) { $('acc-msg').textContent = 'Ese archivo no es una copia de PokerEFX.'; } };
    r.readAsText(f); });
  let armed = false;
  $('acc-del').addEventListener('click', () => {
    if (!armed) { armed = true; $('acc-del').textContent = 'Pulsa otra vez para borrar'; $('acc-msg').textContent = 'Se borrará todo tu progreso de este navegador.'; setTimeout(() => { armed = false; $('acc-del').textContent = 'Borrar todo'; }, 5000); return; }
    try { Object.keys(localStorage).filter(k => /^(sim|fp)\./.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* none */ }
    armed = false; $('acc-del').textContent = 'Borrar todo'; $('acc-msg').textContent = 'Progreso borrado.'; render();
  });
  render();
})();
