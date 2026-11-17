/* PokerEFX — local account page: progress from the simulator's stored decisions, export / import / delete. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const pc = x => Math.round(100 * x) + ' %', f1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
  // the street where you lose the most EV per decision: the one to study next
  function X0(H) { const S = { pre: 'el preflop', flop: 'el flop', turn: 'el turn', river: 'el river' }; let w = null, wl = 0;
    Object.keys(S).forEach(s => { const X = H.filter(d => d.street === s); if (X.length >= 10) { const l = X.reduce((a, d) => a + (d.loss || 0), 0) / X.length; if (l > wl) { wl = l; w = s; } } });
    return w ? 'Donde más EV pierdes es en <b>' + S[w] + '</b>: practícalo en el simulador con el modo «Mis fugas».' : 'Con 10 decisiones por calle te diremos dónde pierdes más EV.'; }
  function render() {
    const H = get('sim.hist', []), n = H.length, ok = H.filter(d => d.v === 'ok').length, loss = H.reduce((a, d) => a + (d.loss || 0), 0);
    const days = new Set(H.map(d => new Date(d.t || 0).toDateString())).size;
    const wk = H.filter(d => (d.t || 0) > Date.now() - 7 * 864e5).length;
    $('acc-kpi').innerHTML = [[n, 'decisiones entrenadas', wk ? wk + ' esta semana' : ''], [n ? pc(ok / n) : '–', 'correctas', ''], [n ? f1(loss / n) + ' bb' : '–', 'EV perdido por decisión', n ? 'cuanto menos, mejor' : ''], [days, days === 1 ? 'día entrenando' : 'días entrenando', '']]
      .map(([v, l, x]) => '<div class="box kpi"><b>' + v + '</b><span>' + l + '</span>' + (x ? '<small>' + x + '</small>' : '') + '</div>').join('');
    const ST = { pre: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
    $('acc-st').innerHTML = n ? '<div class="srow h"><span>Calle</span><span>Acierto</span><span></span><span class="ev">EV / decisión</span></div>' + Object.keys(ST).map(s => { const X = H.filter(d => d.street === s); if (!X.length) return ''; const r = X.filter(d => d.v === 'ok').length / X.length;
        return '<div class="srow" title="' + X.length + ' decisiones"><span>' + ST[s] + '</span><span class="sbar" title="' + pc(r) + '"><span style="width:' + Math.round(100 * r) + '%"></span></span><span>' + pc(r) + '</span><span class="ev">' + f1(X.reduce((a, d) => a + (d.loss || 0), 0) / X.length) + ' bb</span></div>'; }).join('') +
        '<p class="small" style="margin:12px 0 0">' + X0(H) + '</p>'
      : '<p style="margin:0 0 14px">Aún no has entrenado ninguna decisión. Empieza por aquí:</p><div class="start">' +
        '<a href="../simulador/"><span class="n">1</span><b>Juega manos</b><span class="small">El simulador te puntúa cada decisión contra el solver.</span></a>' +
        '<a href="../entrenar/"><span class="n">2</span><b>Entrena rangos</b><span class="small">Repaso espaciado de las tablas preflop de tu formato.</span></a>' +
        '<a href="../#daily"><span class="n">3</span><b>Reto del día</b><span class="small">10 manos nuevas cada día, iguales para todos.</span></a></div>';
    const nm = (get('fp.name', '') || '').trim(); $('acc-av').textContent = nm ? nm[0].toUpperCase() : '♠';
    $('acc-name').value = get('fp.name', '') || '';
  }
  $('acc-name').addEventListener('change', e => { set('fp.name', e.target.value.trim()); $('acc-msg').textContent = 'Guardado.'; render(); });
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
