/* PokerEFX — local account page: progress from the simulator's stored decisions, export / import / delete. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const pc = x => Math.round(100 * x) + '%', f1 = x => (Math.round(x * 10) / 10).toString().replace('.', '.');
  // the street where you lose the most EV per decision: the one to study next
  function X0(H) { const S = { pre: 'preflop', flop: 'the flop', turn: 'the turn', river: 'the river' }; let w = null, wl = 0;
    Object.keys(S).forEach(s => { const X = H.filter(d => d.street === s); if (X.length >= 10) { const l = X.reduce((a, d) => a + (d.loss || 0), 0) / X.length; if (l > wl) { wl = l; w = s; } } });
    return w ? 'Where you lose the most EV is <b>' + S[w] + '</b>: practise it in the simulator with the «My leaks» mode.' : 'With 10 decisions per street we\'ll tell you where you lose the most EV.'; }
  function render() {
    const H = get('sim.hist', []), n = H.length, ok = H.filter(d => d.v === 'ok').length, loss = H.reduce((a, d) => a + (d.loss || 0), 0);
    const days = new Set(H.map(d => new Date(d.t || 0).toDateString())).size;
    const wk = H.filter(d => (d.t || 0) > Date.now() - 7 * 864e5).length;
    $('acc-kpi').innerHTML = [[n, 'decisions trained', wk ? wk + ' this week' : ''], [n ? pc(ok / n) : '–', 'correctas', ''], [n ? f1(loss / n) + ' bb' : '–', 'EV lost per decision', n ? 'the lower, the better' : ''], [days, days === 1 ? 'day training' : 'days training', '']]
      .map(([v, l, x]) => '<div class="box kpi"><b>' + v + '</b><span>' + l + '</span>' + (x ? '<small>' + x + '</small>' : '') + '</div>').join('');
    const ST = { pre: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
    $('acc-st').innerHTML = n ? '<div class="srow h"><span>Street</span><span>Accuracy</span><span></span><span class="ev">EV / decision</span></div>' + Object.keys(ST).map(s => { const X = H.filter(d => d.street === s); if (!X.length) return ''; const r = X.filter(d => d.v === 'ok').length / X.length;
        return '<div class="srow" title="' + X.length + ' decisions"><span>' + ST[s] + '</span><span class="sbar" title="' + pc(r) + '"><span style="width:' + Math.round(100 * r) + '%"></span></span><span>' + pc(r) + '</span><span class="ev">' + f1(X.reduce((a, d) => a + (d.loss || 0), 0) / X.length) + ' bb</span></div>'; }).join('') +
        '<p class="small" style="margin:12px 0 0">' + X0(H) + '</p>'
      : '<p style="margin:0 0 14px">You haven\'t trained any decision yet. Start here:</p><div class="start">' +
        '<a href="../simulador/"><span class="n">1</span><b>Play hands</b><span class="small">The simulator scores every decision against the solver.</span></a>' +
        '<a href="../entrenar/"><span class="n">2</span><b>Train ranges</b><span class="small">Spaced review of the preflop charts for your format.</span></a>' +
        '<a href="../#daily"><span class="n">3</span><b>Daily challenge</b><span class="small">10 new hands every day, the same for everyone.</span></a></div>';
    const nm = (get('fp.name', '') || '').trim(); $('acc-av').textContent = nm ? nm[0].toUpperCase() : '♠';
    $('acc-name').value = get('fp.name', '') || '';
  }
  $('acc-name').addEventListener('change', e => { set('fp.name', e.target.value.trim()); $('acc-msg').textContent = 'Saved.'; render(); });
  $('acc-exp').addEventListener('click', () => {
    const data = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(sim|fp)\./.test(k)) data[k] = localStorage.getItem(k); } } catch (e) { /* none */ }
    const blob = new Blob([JSON.stringify({ pokerefx: 1, saved: new Date().toISOString(), data })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pokerefx-progreso.json'; document.body.appendChild(a); a.click(); a.remove();
    $('acc-msg').textContent = 'File downloaded. Import it on another device from this page.';
  });
  $('acc-imp').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { const j = JSON.parse(r.result); if (!(j.forjapoker||j.pokerefx)) throw 0; Object.entries(j.data).forEach(([k, v]) => localStorage.setItem(k, v)); $('acc-msg').textContent = 'Progress imported.'; render(); } catch (err) { $('acc-msg').textContent = 'That file is not a PokerEFX backup.'; } };
    r.readAsText(f); });
  let armed = false;
  $('acc-del').addEventListener('click', () => {
    if (!armed) { armed = true; $('acc-del').textContent = 'Press again to delete'; $('acc-msg').textContent = 'All your progress in this browser will be deleted.'; setTimeout(() => { armed = false; $('acc-del').textContent = 'Delete all'; }, 5000); return; }
    try { Object.keys(localStorage).filter(k => /^(sim|fp)\./.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* none */ }
    armed = false; $('acc-del').textContent = 'Delete all'; $('acc-msg').textContent = 'Progress deleted.'; render();
  });
  render();
})();
