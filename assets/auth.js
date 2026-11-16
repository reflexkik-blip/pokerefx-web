/* Forja Póker — cloud accounts (Supabase): Google sign-in, progress sync and plan (free / plus / premium).
   Inactive until FP_CFG.supabaseUrl and FP_CFG.supabaseKey are filled in; the anon key is public by design and every
   table is protected by row-level security (see supabase.sql). */
(function () {
  'use strict';
  const CFG = window.FP_CFG = Object.assign({
    supabaseUrl: 'https://mbbjgprfkmmysjhpyjas.supabase.co', supabaseKey: 'sb_publishable_WybvVuZs_IGCGV1IzgX6uQ_hbfUSTXa',
    google: true,                      // true once the Google provider is enabled in Supabase
    payPlus: '', payPremium: '',        // Stripe Payment Links
  }, window.FP_CFG || {});
  const KEYS = /^(sim|fp)\./;
  const $ = id => document.getElementById(id);
  const FP = window.FP || {};
  let sb = null, user = null;

  function snapshot() {
    const data = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (KEYS.test(k) && k !== 'fp.consent' && k !== 'fp.theme') data[k] = localStorage.getItem(k); } } catch (e) { /* storage blocked */ }
    return data;
  }
  function restore(data) { try { Object.entries(data || {}).forEach(([k, v]) => { if (KEYS.test(k)) localStorage.setItem(k, v); }); } catch (e) { /* storage blocked */ } }
  function histLen(data) { try { return JSON.parse(data['sim.hist'] || '[]').length; } catch (e) { return 0; } }

  async function sync() {
    if (!sb || !user) return;
    const { data: row } = await sb.from('progress').select('data, updated_at').eq('user_id', user.id).maybeSingle();
    const local = snapshot();
    // keep whichever copy has more training; then save the merged result
    if (row && histLen(row.data) > histLen(local)) restore(row.data);
    await sb.from('progress').upsert({ user_id: user.id, data: snapshot(), updated_at: new Date().toISOString() });
    try { localStorage.setItem('fp.lastsync', JSON.stringify(Date.now())); } catch (e) { /* storage blocked */ }
  }
  async function plan() {
    if (!sb || !user) return 'free';
    const { data } = await sb.from('profiles').select('plan, plan_until').eq('user_id', user.id).maybeSingle();
    const p = data && data.plan && (!data.plan_until || new Date(data.plan_until) > new Date()) ? data.plan : 'free';
    try { localStorage.setItem('fp.plan', JSON.stringify(p)); } catch (e) { /* storage blocked */ }
    return p;
  }

  function paint(p) {
    const box = $('acc-cloud'); if (!box) return;
    if (!CFG.supabaseUrl || !CFG.google) { box.innerHTML = '<p class="small">Las cuentas con Google llegan muy pronto. Mientras tanto tu progreso se guarda en este navegador.</p>'; return; }
    if (!user) {
      box.innerHTML = '<p>Guarda tu progreso en la nube y úsalo en el móvil y en el ordenador.</p><button class="btn pri" type="button" id="acc-google">' +
        '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Entrar con Google</button>';
      $('acc-google').addEventListener('click', () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }));
      return;
    }
    const nm = { free: 'Gratis', plus: 'Plus', premium: 'Premium' }[p] || 'Gratis';
    box.innerHTML = '<p>Has entrado como <b></b>. Plan: <span class="tag">' + nm + '</span></p><div class="row"><button class="btn" type="button" id="acc-sync">Sincronizar ahora</button><button class="btn" type="button" id="acc-out">Cerrar sesión</button></div><p class="small" id="acc-cmsg"></p>';
    box.querySelector('b').textContent = user.email || '';
    $('acc-sync').addEventListener('click', async () => { $('acc-cmsg').textContent = 'Sincronizando…'; await sync(); $('acc-cmsg').textContent = 'Progreso guardado en la nube.'; });
    $('acc-out').addEventListener('click', async () => { await sb.auth.signOut(); try { localStorage.removeItem('fp.plan'); } catch (e) { /* storage blocked */ } location.reload(); });
  }
  function plans(p) {
    const box = $('acc-plans'); if (!box) return;
    const P = [
      ['free', 'Gratis', '0 €', ['Simulador, tablas, rangos y calculadoras', 'Progreso en este navegador', 'Con anuncios'], ''],
      ['plus', 'Plus', '2,99 €/mes', ['Todo lo de Gratis', 'Sin anuncios', 'Progreso sincronizado en todos tus dispositivos'], CFG.payPlus],
      ['premium', 'Premium', '5,99 €/mes', ['Todo lo de Plus', 'Estadísticas avanzadas de tus fugas', 'Acceso anticipado a las novedades del solver'], CFG.payPremium]];
    box.innerHTML = P.map(([id, t, price, feats, link]) => '<div class="box plan' + (id === 'plus' ? ' hot' : '') + '"><h3>' + t + '</h3><div class="price">' + price + '</div><ul>' + feats.map(f => '<li>' + f + '</li>').join('') + '</ul>' +
      (p === id ? '<span class="tag">Tu plan</span>' : id === 'free' ? '' : link && user ? '<a class="btn pri" href="' + link + '?prefilled_email=' + encodeURIComponent(user.email || '') + '&client_reference_id=' + user.id + '">Elegir ' + t + '</a>'
        : link ? '<span class="small">Entra con Google para suscribirte.</span>' : '<span class="small">Disponible muy pronto.</span>') + '</div>').join('');
  }

  async function start() {
    if (!CFG.supabaseUrl || !CFG.google || !window.supabase) { paint('free'); plans('free'); return; }
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    const { data } = await sb.auth.getSession(); user = data.session ? data.session.user : null;
    let p = 'free';
    if (user) { await sync(); p = await plan(); }
    paint(p); plans(p);
    sb.auth.onAuthStateChange((ev, s) => { if (ev === 'SIGNED_IN' && !user) { user = s.user; sync().then(plan).then(q => { paint(q); plans(q); }); } });
  }
  FP.auth = { sync };
  start();
})();
