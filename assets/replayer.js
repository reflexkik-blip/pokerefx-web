/* PokerEFX — hand replayer. Parses Winamax and PokerStars hand histories in the browser (nothing is uploaded), then
   replays each hand action by action with stacks, bets, pot, board and the equity of every known hand. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), E = window.FPE;
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let H = [], hi = 0, step = 0, timer = null, inBB = true;

  // ---------------------------------------------------------------- parsing
  function split(txt) {
    return txt.replace(/\r/g, '').split(/\n(?=(?:Winamax Poker - |PokerStars (?:Hand|Home Game Hand|Zoom Hand) #))/).map(s => s.trim()).filter(s => /^(Winamax Poker|PokerStars)/.test(s));
  }
  const num = s => parseFloat(String(s).replace(/[€$,]/g, '')) || 0;
  function parse(raw) {
    const L = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const h = { title: '', seats: [], btn: 0, sb: 0, bb: 0, hero: null, acts: [], board: { flop: [], turn: [], river: [] }, shown: {}, won: {} };
    const head = L[0];
    // Winamax writes (ante/small blind/big blind); PokerStars and others (small blind/big blind).
    let m = head.match(/\((\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\)/);
    if (m) { h.ante = num(m[1]); h.sb = num(m[2]); h.bb = num(m[3]); }
    else if ((m = head.match(/\(([\d.€$]+)\/([\d.€$]+)/))) { h.sb = num(m[1]); h.bb = num(m[2]); }
    m = head.match(/Tournament "([^"]+)"/) || head.match(/Tournament #(\d+)/) || head.match(/- ([^-]+?) - /); h.title = m ? m[1] : 'Mano';
    const dt = head.match(/(\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2}(?::\d{2})?)/); h.date = dt ? dt[1] : '';
    let street = 'pre';
    for (const l0 of L.slice(1)) {
      const l = l0.replace(/^([^:]+): (?=(posts|raises|calls|bets|checks|folds|shows|mucks|collected|is all-in))/, '$1 ');   // PokerStars "name: action"
      if ((m = l.match(/Seat #(\d+) is the button/))) { h.btn = +m[1]; continue; }
      if (street === 'pre' && (m = l.match(/^Seat (\d+): (.+?) \(([\d.,€$]+)(?: in chips)?(?:,[^)]*)?\)/))) { h.seats.push({ seat: +m[1], name: m[2], stack: num(m[3]) }); continue; }
      if ((m = l.match(/^Dealt to (.+?) \[(.+?)\]/))) { h.hero = m[1]; h.shown[m[1]] = m[2].split(' '); continue; }
      if ((m = l.match(/^\*\*\* FLOP \*\*\* \[(.+?)\]/))) { street = 'flop'; h.board.flop = m[1].split(' '); h.acts.push({ st: 'flop' }); continue; }
      if ((m = l.match(/^\*\*\* TURN \*\*\* \[.+?\] ?\[(.+?)\]/))) { street = 'turn'; h.board.turn = m[1].split(' '); h.acts.push({ st: 'turn' }); continue; }
      if ((m = l.match(/^\*\*\* RIVER \*\*\* \[.+?\] ?\[(.+?)\]/))) { street = 'river'; h.board.river = m[1].split(' '); h.acts.push({ st: 'river' }); continue; }
      if (/^\*\*\* (SHOW ?DOWN|SUMMARY)/.test(l)) { if (/SUMMARY/.test(l)) street = 'end'; else h.acts.push({ st: 'show' }); continue; }
      if (street === 'end') continue;
      if ((m = l.match(/^(.+?) shows \[(.+?)\]/))) { h.shown[m[1]] = m[2].split(' '); h.acts.push({ p: m[1], a: 'shows' }); continue; }
      if ((m = l.match(/^(.+?) collected ([\d.,€$]+)/))) { h.won[m[1]] = (h.won[m[1]] || 0) + num(m[2]); h.acts.push({ p: m[1], a: 'wins', v: num(m[2]) }); continue; }
      if ((m = l.match(/^Uncalled bet \(([\d.,€$]+)\) returned to (.+)$/))) { h.acts.push({ p: m[2], a: 'return', v: num(m[1]) }); continue; }
      if ((m = l.match(/^(.+?) posts (?:the )?ante ([\d.,€$]+)/))) { h.acts.push({ p: m[1], a: 'ante', v: num(m[2]) }); continue; }
      if ((m = l.match(/^(.+?) posts small blind ([\d.,€$]+)/))) { h.acts.push({ p: m[1], a: 'sb', v: num(m[2]) }); continue; }
      if ((m = l.match(/^(.+?) posts big blind ([\d.,€$]+)/))) { h.acts.push({ p: m[1], a: 'bb', v: num(m[2]) }); continue; }
      if ((m = l.match(/^(.+?) raises [\d.,€$]+ to ([\d.,€$]+)/))) { h.acts.push({ p: m[1], a: 'raise', to: num(m[2]), allin: /all-in/.test(l) }); continue; }
      if ((m = l.match(/^(.+?) bets ([\d.,€$]+)/))) { h.acts.push({ p: m[1], a: 'bet', v: num(m[2]), allin: /all-in/.test(l) }); continue; }
      if ((m = l.match(/^(.+?) calls ([\d.,€$]+)/))) { h.acts.push({ p: m[1], a: 'call', v: num(m[2]), allin: /all-in/.test(l) }); continue; }
      if ((m = l.match(/^(.+?) checks/))) { h.acts.push({ p: m[1], a: 'check' }); continue; }
      if ((m = l.match(/^(.+?) folds/))) { h.acts.push({ p: m[1], a: 'fold' }); continue; }
    }
    // The posted blinds win over the header (a short stack can post less, so take the largest post).
    const posted = k => h.acts.filter(a => a.a === k).reduce((x, a) => Math.max(x, a.v), 0);
    if (posted('bb')) h.bb = Math.max(h.bb && h.bb >= posted('bb') ? h.bb : 0, posted('bb'));
    if (posted('sb') && !h.sb) h.sb = posted('sb');
    if (!h.bb) h.bb = 1;
    return h.seats.length >= 2 ? h : null;
  }

  // ---------------------------------------------------------------- state after n actions
  function state(h, n) {
    const S = {}; h.seats.forEach(s => { S[s.name] = { stack: s.stack, bet: 0, fold: false, allin: false, last: '' }; });
    let pot = 0, street = 'pre', board = [], showAll = false, line = 'Reparto';
    const collect = () => { Object.values(S).forEach(p => { pot += p.bet; p.bet = 0; }); };
    for (let i = 0; i < n; i++) {
      const a = h.acts[i];
      if (a.st) {
        collect(); Object.values(S).forEach(p => { p.last = ''; });
        if (a.st === 'show') { showAll = true; line = 'Se muestran las cartas'; continue; }
        street = a.st; board = h.board.flop.concat(a.st !== 'flop' ? h.board.turn : [], a.st === 'river' ? h.board.river : []);
        line = { flop: 'Flop', turn: 'Turn', river: 'River' }[a.st]; continue;
      }
      const p = S[a.p]; if (!p) continue;
      const put = v => { const x = Math.min(v, p.stack); p.stack -= x; p.bet += x; if (p.stack <= 1e-9) p.allin = true; };
      if (a.a === 'ante') { const x = Math.min(a.v, p.stack); p.stack -= x; pot += x; p.last = 'ante'; }
      else if (a.a === 'sb' || a.a === 'bb') { put(a.v); p.last = a.a.toUpperCase(); }
      else if (a.a === 'raise') { put(a.to - p.bet); p.last = 'sube a ' + fmt(a.to, h); }
      else if (a.a === 'bet') { put(a.v); p.last = 'apuesta ' + fmt(a.v, h); }
      else if (a.a === 'call') { put(a.v); p.last = 'paga ' + fmt(a.v, h); }
      else if (a.a === 'check') p.last = 'pasa';
      else if (a.a === 'fold') { p.fold = true; p.last = 'fold'; }
      else if (a.a === 'return') { p.bet -= a.v; p.stack += a.v; }
      else if (a.a === 'shows') { showAll = true; }
      else if (a.a === 'wins') { collect(); p.stack += a.v; pot = Math.max(0, pot - a.v); p.last = 'gana ' + fmt(a.v, h); }
      if (p.allin && ['raise', 'bet', 'call'].includes(a.a)) p.last += ' (all-in)';
      line = a.p + ': ' + (p.last || a.a);
    }
    return { S, pot, board, street, showAll, line };
  }
  const fmt = (v, h) => inBB && h.bb ? (Math.round(v / h.bb * 10) / 10).toString().replace('.', ',') + ' bb' : (Math.round(v * 100) / 100).toLocaleString('es-ES');

  // ---------------------------------------------------------------- drawing
  const SU = { s: ['♠', 's'], h: ['♥', 'h'], d: ['♦', 'd'], c: ['♣', 'c'] };
  const cardHTML = c => c ? '<span class="pc ' + SU[c[1]][1] + '">' + (c[0] === 'T' ? '10' : c[0]) + '<small>' + SU[c[1]][0] + '</small></span>' : '<span class="pc back"></span>';
  function draw() {
    const h = H[hi]; if (!h) return;
    const st = state(h, step), n = h.seats.length, hero = h.seats.findIndex(s => s.name === h.hero);
    // equity of every live hand whose cards we know
    const live = h.seats.filter(s => !st.S[s.name].fold && h.shown[s.name] && (s.name === h.hero || st.showAll));
    let eq = {};
    if (live.length >= 2 && E) {
      try { const r = E.equity(live.map(s => ({ cards: E.cards(h.shown[s.name].join('')) })), E.cards(st.board.join('')), { iters: 20000 }); live.forEach((s, i) => { eq[s.name] = r.players[i].eq; }); } catch (e) { eq = {}; }
    }
    let seats = '';
    h.seats.forEach((s, i) => {
      const k = (i - (hero >= 0 ? hero : 0) + n) % n, ang = Math.PI / 2 + 2 * Math.PI * k / n;
      const x = 50 + 43 * Math.cos(ang), y = 50 + 40 * Math.sin(ang), p = st.S[s.name];
      const known = h.shown[s.name] && (s.name === h.hero || st.showAll);
      seats += '<div class="seat' + (p.fold ? ' out' : '') + (s.name === h.hero ? ' me' : '') + '" style="left:' + x + '%;top:' + y + '%">' +
        '<div class="hc">' + (p.fold && !known ? '' : (known ? h.shown[s.name].map(cardHTML).join('') : cardHTML() + cardHTML())) + '</div>' +
        '<div class="nm">' + (s.seat === h.btn ? '<i class="btn-d">D</i>' : '') + esc(s.name) + '</div><div class="sk">' + fmt(p.stack, h) + (eq[s.name] != null ? ' · <b>' + Math.round(100 * eq[s.name]) + ' %</b>' : '') + '</div>' +
        (p.last ? '<div class="la">' + esc(p.last) + '</div>' : '') + '</div>' +
        (p.bet > 0 ? '<div class="chipb" style="left:' + (50 + 26 * Math.cos(ang)) + '%;top:' + (50 + 22 * Math.sin(ang)) + '%">' + fmt(p.bet, h) + '</div>' : '');
    });
    $('r-table').innerHTML = '<div class="felt"></div><div class="mid"><div class="bd">' + st.board.map(cardHTML).join('') + '</div><div class="pot">Bote ' + fmt(st.pot, h) + '</div></div>' + seats;
    $('r-line').textContent = (step ? step + '/' + h.acts.length + ' · ' : '') + st.line;
    $('r-prog').max = h.acts.length; $('r-prog').value = step;
    $('r-info').textContent = h.title + (h.date ? ' · ' + h.date : '') + ' · ciegas ' + (h.sb || 0).toLocaleString('es-ES') + '/' + h.bb.toLocaleString('es-ES') + (h.ante ? ' · ante ' + h.ante.toLocaleString('es-ES') : '') + (inBB ? ' (1 bb = ' + h.bb.toLocaleString('es-ES') + ' fichas)' : '');
  }
  function go(s) { const h = H[hi]; step = Math.max(0, Math.min(h.acts.length, s)); draw(); }
  // Moving past the end of a hand opens the next one; moving back from its start opens the previous one at its end.
  function hand(i, s) { if (i < 0 || i >= H.length) return false; hi = i; $('r-list').value = String(i); go(s); return true; }
  function fwd() { if (step < H[hi].acts.length) go(step + 1); else hand(hi + 1, 0); }
  function back() { if (step > 0) go(step - 1); else hand(hi - 1, 1e9); }
  function play() {
    if (timer) { clearInterval(timer); timer = null; $('r-play').textContent = '▶ Reproducir'; return; }
    $('r-play').textContent = '⏸ Pausa';
    let wait = 0;
    timer = setInterval(() => { if (step < H[hi].acts.length) { go(step + 1); return; } if (hi >= H.length - 1) { play(); return; } if (++wait >= 2) { wait = 0; hand(hi + 1, 0); } }, 900);
  }
  function load(txt) {
    H = split(txt).map(parse).filter(Boolean);
    if (!H.length) { $('r-msg').textContent = 'No he reconocido ninguna mano. Pega el historial tal cual lo guarda Winamax o PokerStars.'; return; }
    $('r-msg').textContent = H.length + ' mano' + (H.length > 1 ? 's' : '') + ' cargada' + (H.length > 1 ? 's' : '') + '. Todo se procesa en tu navegador: nada sale de tu dispositivo.';
    $('r-list').innerHTML = H.map((h, i) => { const c = h.shown[h.hero]; return '<option value="' + i + '">' + (i + 1) + '. ' + (c ? c.join(' ') + ' · ' : '') + esc(h.title) + (h.won[h.hero] ? ' · gana' : '') + '</option>'; }).join('');
    $('r-view').hidden = false; hi = 0; go(0);
  }
  $('r-load').addEventListener('click', () => load($('r-txt').value));
  $('r-file').addEventListener('change', e => { const fs = [...e.target.files]; Promise.all(fs.map(f => f.text())).then(t => load(t.join('\n'))); });
  $('r-demo').addEventListener('click', () => { $('r-txt').value = DEMO; load(DEMO); });
  $('r-list').addEventListener('change', e => { hi = +e.target.value; if (timer) play(); go(0); });
  $('r-first').addEventListener('click', () => go(0)); $('r-prev').addEventListener('click', back);
  $('r-next').addEventListener('click', fwd);
  $('r-phand').addEventListener('click', () => hand(hi - 1, 0)); $('r-nhand').addEventListener('click', () => hand(hi + 1, 0)); $('r-last').addEventListener('click', () => go(1e9));
  $('r-play').addEventListener('click', play);
  $('r-prog').addEventListener('input', e => go(+e.target.value));
  $('r-unit').addEventListener('change', e => { inBB = e.target.value === 'bb'; draw(); });
  document.addEventListener('keydown', e => { if ($('r-view').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; if (e.key === 'ArrowRight') fwd(); if (e.key === 'ArrowLeft') back(); if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); hand(hi + 1, 0); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); hand(hi - 1, 0); } });

  const DEMO = `Winamax Poker - Tournament "Demo MTT" buyIn: 9€ + 1€ level: 12 - HandId: #1-1-1 - Holdem no limit (500/250/500) - 2026/11/16 21:30:00 UTC
Table: 'Demo MTT(1)#3' 6-max (real money) Seat #4 is the button
Seat 1: Rival_UTG (14200)
Seat 2: Rival_HJ (9800)
Seat 3: Rival_CO (21000)
Seat 4: Tu (12500)
Seat 5: Rival_SB (7600)
Seat 6: Rival_BB (16300)
*** ANTE/BLINDS ***
Rival_BB posts ante 500
Rival_SB posts small blind 250
Rival_BB posts big blind 500
Dealt to Tu [Ah Qd]
*** PRE-FLOP ***
Rival_UTG folds
Rival_HJ folds
Rival_CO folds
Tu raises 600 to 1100
Rival_SB folds
Rival_BB calls 600
*** FLOP *** [Qs 7h 2c]
Rival_BB checks
Tu bets 900
Rival_BB raises 2100 to 3000
Tu calls 2100
*** TURN *** [Qs 7h 2c][Kd]
Rival_BB bets 11700 and is all-in
Tu calls 9300 and is all-in
Uncalled bet (2400) returned to Rival_BB
*** RIVER *** [Qs 7h 2c Kd][3s]
*** SHOW DOWN ***
Rival_BB shows [7d 7s] (Three of a kind : 7)
Tu shows [Ah Qd] (One pair : Q)
Rival_BB collected 25350 from pot
*** SUMMARY ***`;
})();
