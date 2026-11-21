// Points de départ par défaut (surchargés par config.js)
let ORIGINS = {
  corbie:  { label: 'Corbie (80800)',  lat: 49.9086, lon: 2.5097 },
  oignies: { label: 'Oignies (62590)', lat: 50.4686, lon: 2.9933 },
};
function showFatal(title, detail) {
  const m = document.getElementById('main');
  if (m) m.innerHTML = `<div class="empty card"><h2>${title}</h2><p style="text-align:left;white-space:pre-line">${String(detail).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p></div>`;
}
window.addEventListener('error', e => { if (document.querySelector('#main .loading')) showFatal('Erreur au démarrage', e.message); });
window.addEventListener('unhandledrejection', e => { if (document.querySelector('#main .loading')) showFatal('Erreur au démarrage', e.reason?.message || e.reason); });
import { createLocalStore } from './store-local.js';

// ───────────────────────── Constantes ─────────────────────────
const STATUTS = {
  a_etudier:   { label: 'À étudier',   short: 'À étudier' },
  contacte:    { label: 'Contacté',    short: 'Contacté' },
  candidature: { label: 'Candidature envoyée', short: 'Candidature' },
  inscrit:     { label: 'Inscrit',     short: 'Inscrit' },
  hors_sujet:  { label: 'Hors sujet',  short: 'Hors sujet' },
};
const STATUT_ORDER = ['a_etudier', 'contacte', 'candidature', 'inscrit', 'hors_sujet'];

const IMG = { email: 'img/email.png', facebook: 'img/facebook.png', instagram: 'img/instagram.png' };
const svg = d => `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  calendar: svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13.5h3v3h-3z"/>'),
  hourglass: svg('<path d="M6 2.5h12M6 21.5h12M7 2.5c0 5 10 6 10 9.5s-10 4.5-10 9.5M17 2.5c0 5-10 6-10 9.5s10 4.5 10 9.5"/>'),
  pin: svg('<path d="M12 21.5s-7-6.2-7-11.5a7 7 0 0 1 14 0c0 5.3-7 11.5-7 11.5z"/><circle cx="12" cy="10" r="2.5"/>'),
  flag: svg('<path d="M5 21.5V3.5M5 4h11l-2 4 2 4H5"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  stack: svg('<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>'),
  chevron: svg('<path d="m9 6 6 6-6 6"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  download: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  sort: svg('<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>'),
  dots: svg('<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9z"/>'),
  phone: svg('<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>'),
  form: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
  az: svg('<path d="M3 17.5 6.5 7l3.5 10.5M4.2 14h4.6M14 7h6l-6 10.5h6"/>'),
};
const SORTS = [
  { k: 'date', icon: 'calendar', label: 'Prochaine date', title: 'Trier par date de la prochaine édition' },
  { k: 'limite', icon: 'hourglass', label: 'Date limite', title: 'Trier par date limite d\'inscription' },
  { k: 'corbie', icon: 'pin', label: 'Corbie', title: 'Trier par distance depuis Corbie' },
  { k: 'oignies', icon: 'pin', label: 'Oignies', title: 'Trier par distance depuis Oignies' },
  { k: 'statut', icon: 'flag', label: 'Mon statut', title: 'Inscrits d\'abord, puis candidatures, contactés…' },
  { k: 'nom', icon: 'az', label: 'Ville A→Z', title: 'Trier par ville' },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => {
  if (!u) return '';
  u = String(u).trim();
  if (/^www\./i.test(u)) u = 'https://' + u;
  return /^(https?:|mailto:|tel:)/i.test(u) ? u : '';
};
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const todayIso = () => new Date().toISOString().slice(0, 10);
const daysUntil = iso => Math.round((new Date(iso + 'T12:00:00') - new Date(todayIso() + 'T12:00:00')) / 86400000);
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
function fmtDate(iso, withDay = true) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d)) return iso;
  return `${withDay ? JOURS[d.getDay()] + ' ' : ''}${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtRange(a, b) {
  if (!a) return '';
  if (!b || b === a) return fmtDate(a);
  const d1 = new Date(a + 'T12:00:00'), d2 = new Date(b + 'T12:00:00');
  if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth())
    return `${JOURS[d1.getDay()]} ${d1.getDate()} – ${JOURS[d2.getDay()]} ${d2.getDate()} ${MOIS[d2.getMonth()]} ${d2.getFullYear()}`;
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}
const initials = name => String(name || '?').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

// ───────────────────────── État ─────────────────────────
let store;
let me = null;
let view = 'salons';
const prefsKey = 'salons-du-livre-filtres';
const ALL_ST = ['a_etudier', 'contacte', 'candidature', 'inscrit', 'hors_sujet'];
const ALL_PER = ['avenir', 'passe', 'sansdate'];
const DEF_ST = ['a_etudier', 'contacte', 'candidature', 'inscrit'];
let F = { q: '', statuts: DEF_ST.slice(), periodes: ALL_PER.slice(), tri: 'date', distMax: '', distRef: 'corbie' };
try { Object.assign(F, JSON.parse(localStorage.getItem(prefsKey)) || {}); } catch {}
if (!Array.isArray(F.statuts)) F.statuts = DEF_ST.slice();
if (!Array.isArray(F.periodes)) F.periodes = ALL_PER.slice();
delete F.statut; delete F.showHS; delete F.periode;
const periodeOf = s => isUpcoming(s) ? 'avenir' : (s.dateDebut || s.dateFin) ? 'passe' : 'sansdate';
const saveFilters = () => { try { localStorage.setItem(prefsKey, JSON.stringify(F)); } catch {} };

// ───────────────────────── Démarrage ─────────────────────────
async function boot() {
  let firebaseConfig = null;
  try {
    const cfg = await import('./config.js');
    firebaseConfig = cfg.firebaseConfig || null;
    if (cfg.ORIGINS) ORIGINS = cfg.ORIGINS;
  } catch (e) {
    console.error(e);
    showFatal('Le fichier config.js contient une erreur', `${e.message}<br><br>Il doit contenir uniquement le bloc « export const firebaseConfig = { … }; » (sans les lignes « import … » ni « initializeApp » fournies par Firebase), suivi du bloc ORIGINS.`.replace(/<br>/g, '\n'));
    return;
  }
  if (firebaseConfig) {
    try {
      const { createFirebaseStore } = await import('./store-firebase.js');
      store = await createFirebaseStore(firebaseConfig);
    } catch (e) {
      console.error(e);
      $('#main').innerHTML = `<div class="empty"><h2>Impossible de charger Firebase</h2><p>${esc(e.message)}</p></div>`;
      return;
    }
  } else {
    store = createLocalStore();
    $('#banner').textContent = 'Mode local : les données restent dans ce navigateur et ne sont pas partagées. Renseigne config.js pour activer le partage entre auteurs (voir README).';
  }
  store.start({
    onAuth: (user, info) => { me = user; renderUser(); if (!me) renderLogin(info); else render(); },
    onData: () => { if (me && view !== 'ia' && view !== 'c-ia') render(); },
    onError: err => {
      console.error(err);
      const denied = /permission|insufficient/i.test(err.code + ' ' + err.message);
      $('#main').innerHTML = `<div class="empty"><h2>${denied ? 'Accès refusé' : 'Erreur'}</h2><p>${denied
        ? `Ton compte (${esc(me?.email || '')}) n'est pas dans la liste des auteurs autorisés. Demande à l'administrateur de l'ajouter dans les règles Firestore.`
        : esc(err.message)}</p><button class="btn" id="errLogout">Se déconnecter</button></div>`;
      $('#errLogout').onclick = () => store.logout();
    },
  });
}

// ───────────────────────── En-tête / utilisateur ─────────────────────────
function renderUser() {
  const box = $('#userBox');
  $('#tabs').hidden = !me;
  $('#subtabs').hidden = !me;
  if (!me) { box.innerHTML = ''; return; }
  box.innerHTML = `<button class="avatar-btn" id="profileBtn" title="Mon profil"><span class="avatar">${esc(initials(me.name))}</span><span class="uname">${esc(me.name)}</span>${ICONS.down}</button>`;
  $('#profileBtn').onclick = openProfile;
}
const SECTIONS = {
  salons:   { title: 'Salons du livre', tabs: [['salons', 'Liste des salons'], ['sources', 'Sources'], ['ia', '✨ Recherche IA']] },
  concours: { title: 'Concours littéraires', tabs: [['c-liste', 'Liste des concours'], ['c-sources', 'Sources'], ['c-ia', '✨ Recherche IA']] },
};
const sectionOf = v => v.startsWith('c-') ? 'concours' : 'salons';
const lastView = { salons: 'salons', concours: 'c-liste' };
try { const sv = localStorage.getItem('salons-du-livre-vue'); if (sv && /^(salons|sources|ia|c-liste|c-sources|c-ia)$/.test(sv)) view = sv; } catch {}
function setView(v) {
  view = v; lastView[sectionOf(v)] = v;
  try { localStorage.setItem('salons-du-livre-vue', v); } catch {}
  render();
  window.scrollTo({ top: 0 });
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-section]'); if (!b) return;
  setView(lastView[b.dataset.section]);
});
$('#subtabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-view]'); if (!b) return;
  setView(b.dataset.view);
});
function renderNav() {
  const sec = sectionOf(view);
  $$('#tabs button').forEach(x => x.classList.toggle('active', x.dataset.section === sec));
  $('#subtabs').innerHTML = SECTIONS[sec].tabs.map(([k, l]) => `<button data-view="${k}" class="${view === k ? 'on' : ''}">${l}</button>`).join('');
  $('#subtabs').hidden = !me;
  $('#heroTitle').textContent = SECTIONS[sec].title;
  document.body.dataset.section = sec;
}

function renderLogin(info) {
  const main = $('#main');
  if (store.mode === 'local') {
    const profiles = store.listProfiles();
    main.innerHTML = `<section class="login card">
      <h2>Qui es-tu ?</h2>
      <p class="muted">Choisis ton profil d'auteur ou crée-en un.</p>
      <div class="profile-list">${profiles.map(p => `<button class="btn profile" data-uid="${esc(p.uid)}"><span class="avatar">${esc(initials(p.name))}</span>${esc(p.name)}${p.hasPwd ? '<span class="lock" title="Protégé par mot de passe">🔒</span>' : ''}</button>`).join('') || '<p class="muted">Aucun profil pour l\'instant.</p>'}</div>
      <form id="unlock" class="stack" hidden>
        <label>Mot de passe de <b id="unlockName"></b><input name="pwd" type="password" autocomplete="current-password" required></label>
        <div class="actions"><button class="btn primary">Entrer</button><button type="button" class="btn ghost" id="unlockCancel">Annuler</button></div>
        <p class="err" id="unlockErr"></p>
      </form>
      <div class="sep"><span>nouveau profil</span></div>
      <form id="newProfile" class="stack">
        <input name="name" placeholder="Nom de l'auteur" required autocomplete="username">
        <input name="pwd" type="password" placeholder="Mot de passe (6 caractères min.)" minlength="6" required autocomplete="new-password">
        <input name="pwd2" type="password" placeholder="Confirmer le mot de passe" minlength="6" required autocomplete="new-password">
        <button class="btn primary">Créer le profil</button>
        <p class="err" id="newErr"></p>
      </form>
    </section>`;
    let target = null;
    $$('.profile', main).forEach(b => b.onclick = () => {
      const pr = profiles.find(x => x.uid === b.dataset.uid);
      if (!pr.hasPwd) return store.selectProfile(pr.uid);
      target = pr; $('#unlock').hidden = false; $('#unlockName').textContent = pr.name; $('#unlockErr').textContent = '';
      $('#unlock').pwd.value = ''; $('#unlock').pwd.focus();
    });
    $('#unlockCancel').onclick = () => { $('#unlock').hidden = true; target = null; };
    $('#unlock').onsubmit = async e => {
      e.preventDefault();
      if (!(await store.selectProfile(target.uid, e.target.pwd.value))) $('#unlockErr').textContent = 'Mot de passe incorrect.';
    };
    $('#newProfile').onsubmit = e => {
      e.preventDefault(); const f = e.target;
      if (f.pwd.value !== f.pwd2.value) { $('#newErr').textContent = 'Les deux mots de passe ne correspondent pas.'; return; }
      if (profiles.some(x => norm(x.name) === norm(f.name.value))) { $('#newErr').textContent = 'Ce nom de profil existe déjà.'; return; }
      store.createProfile(f.name.value.trim(), f.pwd.value);
    };
    return;
  }
  if (info?.unverified) {
    main.innerHTML = `<section class="login card"><h2>Vérifie ton adresse email</h2>
      <p>Un lien de confirmation a été envoyé à <b>${esc(info.unverified)}</b>. Clique dessus, puis reviens ici.</p>
      <div class="actions"><button class="btn primary" id="vDone">J'ai confirmé</button><button class="btn" id="vResend">Renvoyer l'email</button><button class="btn ghost" id="vOut">Se déconnecter</button></div></section>`;
    $('#vDone').onclick = () => store.reloadUser();
    $('#vResend').onclick = async () => { await store.resendVerification(); toast('Email renvoyé'); };
    $('#vOut').onclick = () => store.logout();
    return;
  }
  main.innerHTML = `<section class="login card">
    <h2>Connexion</h2>
    <p class="muted">Chaque auteur a son propre profil : ses inscriptions et ses notes. La liste des salons est commune à tous.</p>
    <button class="btn google" id="gLogin"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuer avec Google</button>
    <div class="sep"><span>ou par email</span></div>
    <form id="emailForm" class="stack">
      <input name="name" placeholder="Nom d'auteur (création de compte)" autocomplete="name">
      <input name="email" type="email" placeholder="Email" required autocomplete="email">
      <input name="pwd" type="password" placeholder="Mot de passe (6 caractères min.)" required minlength="6" autocomplete="current-password">
      <input name="pwd2" type="password" placeholder="Confirmer le mot de passe (création de compte)" minlength="6" autocomplete="new-password">
      <div class="actions">
        <button class="btn primary" name="act" value="login">Se connecter</button>
        <button class="btn" name="act" value="signup">Créer un compte</button>
        <button class="btn ghost" type="button" id="forgot">Mot de passe oublié</button>
      </div>
      <p class="err" id="loginErr"></p>
    </form>
  </section>`;
  const showErr = e => { $('#loginErr').textContent = authMsg(e); };
  $('#gLogin').onclick = () => store.loginGoogle().catch(showErr);
  $('#emailForm').onsubmit = async e => {
    e.preventDefault();
    const f = e.target, act = e.submitter?.value || 'login';
    try {
      if (act === 'signup') {
        if (!f.name.value.trim()) return showErr({ message: 'Indique ton nom d\'auteur pour créer le compte.' });
        if (f.pwd.value !== f.pwd2.value) return showErr({ message: 'Les deux mots de passe ne correspondent pas.' });
        await store.signupEmail(f.email.value.trim(), f.pwd.value, f.name.value.trim()); }
      else await store.loginEmail(f.email.value.trim(), f.pwd.value);
    } catch (err) { showErr(err); }
  };
  $('#forgot').onclick = async () => {
    const email = $('#emailForm').email.value.trim();
    if (!email) return showErr({ message: 'Saisis ton email d\'abord.' });
    try { await store.resetPassword(email); toast('Email de réinitialisation envoyé'); } catch (err) { showErr(err); }
  };
}
function authMsg(e) {
  const c = e.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Email ou mot de passe incorrect.';
  if (c.includes('email-already-in-use')) return 'Un compte existe déjà avec cet email.';
  if (c.includes('weak-password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (c.includes('popup-closed')) return '';
  if (c.includes('unauthorized-domain')) return 'Ce domaine n\'est pas autorisé dans Firebase (Authentication → Paramètres → Domaines autorisés).';
  return e.message || String(e);
}

function openProfile() {
  const others = Object.entries(store.users).filter(([id]) => id !== me.uid).map(([, u]) => u.name).filter(Boolean);
  openModal(`<form class="modal-inner" id="profForm">
    <header class="m-head"><h2>Mon profil</h2><button type="button" class="x" data-close>×</button></header>
    <label>Nom affiché<input name="name" value="${esc(me.name)}" required></label>
    <span class="save-state" id="profState"></span>
    ${me.email ? `<p class="muted">Connecté avec ${esc(me.email)}</p>` : ''}
    ${others.length ? `<p class="muted">Autres auteurs : ${others.map(esc).join(', ')}</p>` : ''}
    <div class="actions"><button type="button" class="btn" id="exportAll">Exporter tout (JSON)</button><button type="button" class="btn danger" id="logout">${store.mode === 'local' ? 'Changer de profil' : 'Se déconnecter'}</button></div>
  </form>`);
  const f = $('#profForm');
  f.onsubmit = e => e.preventDefault();
  onModalClose(autosave(f, async () => {
    const name = f.name.value.trim(); if (!name) return false;
    await store.setProfile({ name });
  }, $('#profState')));
  $('#logout').onclick = () => { closeModal(); store.logout(); };
  $('#exportAll').onclick = () => download(`salons-sauvegarde-${todayIso()}.json`, JSON.stringify({ salons: store.salons, users: store.users, sources: store.sources }, null, 1), 'application/json');
}

// Enregistrement automatique : déclenché à la saisie (avec délai), et à la fermeture.
function autosave(root, saveFn, stateEl, delay = 700) {
  let timer = null, pending = false, running = Promise.resolve();
  const set = (t, cls = '') => { if (stateEl) { stateEl.textContent = t; stateEl.className = 'save-state ' + cls; } };
  const flush = () => {
    if (!pending) return running;
    pending = false; clearTimeout(timer);
    running = running.then(async () => {
      set('Enregistrement…', 'busy');
      try { const r = await saveFn(); set(r === false ? '' : 'Enregistré ✓', 'ok'); }
      catch (err) { console.error(err); set('Erreur d\'enregistrement : ' + err.message, 'err'); }
    });
    return running;
  };
  const schedule = () => { pending = true; set('Modifications en cours…', 'busy'); clearTimeout(timer); timer = setTimeout(flush, delay); };
  root.addEventListener('input', schedule);
  root.addEventListener('change', schedule);
  schedule.flush = flush;
  return flush;
}

// ───────────────────────── Rendu principal ─────────────────────────
function render() {
  if (!me) return;
  renderNav();
  if (view === 'sources') return renderSources('salons');
  if (view === 'ia') return renderIA();
  if (view === 'c-liste') return renderConcours();
  if (view === 'c-sources') return renderSources('concours');
  if (view === 'c-ia') return renderCIA();
  renderSalons();
}

const myEntry = id => (store.users[me.uid]?.salons || {})[id] || {};
const myStatut = id => myEntry(id).statut || 'a_etudier';

function effectiveLimite(s) {
  if (s.dateLimite) return { date: s.dateLimite, ancienne: false };
  const h = (s.historiqueLimites || []).filter(Boolean);
  if (h.length) return { date: h[h.length - 1], ancienne: true };
  return null;
}
const isUpcoming = s => (s.dateFin || s.dateDebut) && (s.dateFin || s.dateDebut) >= todayIso();

function filteredSalons() {
  const q = norm(F.q);
  let list = Object.entries(store.salons).map(([id, s]) => ({ id, ...s, _st: myStatut(id) }));
  list = list.filter(s => {
    if (!F.statuts.includes(s._st)) return false;
    if (!F.periodes.includes(periodeOf(s))) return false;
    if (F.distMax) {
      const d = F.distRef === 'oignies' ? s.distOignies : s.distCorbie;
      if (d == null || d > +F.distMax) return false;
    }
    if (q) {
      const c = s.contacts || {};
      const hay = norm([s.nom, s.ville, s.codePostal, s.notes, c.autres, (c.emails || []).join(' ')].join(' '));
      if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const t = todayIso();
  const cmpNum = (a, b) => (a ?? 1e9) - (b ?? 1e9);
  const dateKey = s => isUpcoming(s) ? '0' + s.dateDebut : (s.dateDebut ? '1' + (9999 - +s.dateDebut.slice(0, 4)) + s.dateDebut.slice(4) : '2');
  const limKey = s => { const l = effectiveLimite(s); return !l ? '3' : (l.date >= t ? '0' + l.date : '1' + l.date); };
  const sorters = {
    date: (a, b) => dateKey(a).localeCompare(dateKey(b)),
    limite: (a, b) => limKey(a).localeCompare(limKey(b)),
    corbie: (a, b) => cmpNum(a.distCorbie, b.distCorbie),
    oignies: (a, b) => cmpNum(a.distOignies, b.distOignies),
    nom: (a, b) => norm(a.ville + a.nom).localeCompare(norm(b.ville + b.nom)),
    statut: (a, b) => STATUT_ORDER.indexOf(b._st) - STATUT_ORDER.indexOf(a._st) || dateKey(a).localeCompare(dateKey(b)),
  };
  return list.sort(sorters[F.tri] || sorters.date);
}

function renderSalons() {
  const main = $('#main');
  const all = Object.keys(store.salons);
  if (!all.length) {
    main.innerHTML = `<section class="empty card">
      <h2>La base est vide</h2>
      <p>Importe la liste initiale : choisis le fichier <b>salons-initiaux.json</b> fourni avec l'application (il reste sur ton ordinateur, il n'est pas publié sur GitHub).</p>
      <label class="check"><input type="checkbox" id="applyMine" checked> Appliquer à mon profil les statuts et le suivi (colonnes « message ») du fichier</label>
      <div class="actions"><button class="btn primary" id="doImport">Choisir le fichier et importer</button><button class="btn" id="startEmpty">Commencer avec une base vide</button></div>
    </section>`;
    $('#doImport').onclick = async () => {
      $('#doImport').disabled = true; $('#doImport').textContent = 'Import…';
      try {
        const seed = await loadSeed();
        if (!seed) { $('#doImport').disabled = false; $('#doImport').textContent = 'Importer'; return; }
        if (!Array.isArray(seed.salons)) throw new Error('Ce fichier ne contient pas de liste de salons.');
        await store.importSeed(seed, $('#applyMine').checked);
        toast(`${seed.salons.length} salons importés`);
      } catch (e) { toast('Erreur : ' + e.message); $('#doImport').disabled = false; }
    };
    $('#startEmpty').onclick = () => openSalon(null);
    return;
  }

  const list = filteredSalons();
  const mine = store.users[me.uid]?.salons || {};
  const t = todayIso();
  const nbInscrits = Object.entries(mine).filter(([id, v]) => v.statut === 'inscrit' && store.salons[id] && isUpcoming(store.salons[id])).length;
  const limites30 = Object.entries(store.salons).filter(([id, s]) => { const l = s.dateLimite; return l && l >= t && daysUntil(l) <= 30 && !['inscrit', 'hors_sujet'].includes(myStatut(id)); }).length;
  const aVenir = Object.values(store.salons).filter(isUpcoming).length;
  const counts = { st: {}, per: {} };
  for (const [id, s] of Object.entries(store.salons)) {
    const st = myStatut(id); counts.st[st] = (counts.st[st] || 0) + 1;
    const pe = periodeOf(s); counts.per[pe] = (counts.per[pe] || 0) + 1;
  }

  main.innerHTML = `
  <section class="stats">
    <button class="stat s-green" data-quick="inscrit"><span class="s-ico">${ICONS.calendar}</span><span class="s-txt"><b>${nbInscrits}</b><span>inscriptions à venir</span></span><span class="s-chev">${ICONS.chevron}</span></button>
    <button class="stat s-orange" data-quick="limite"><span class="s-ico">${ICONS.clock}</span><span class="s-txt"><b>${limites30}</b><span>dates limites ≤ 30 j</span></span><span class="s-chev">${ICONS.chevron}</span></button>
    <button class="stat s-blue" data-quick="avenir"><span class="s-ico">${ICONS.calendar}</span><span class="s-txt"><b>${aVenir}</b><span>salons à venir</span></span><span class="s-chev">${ICONS.chevron}</span></button>
    <button class="stat s-red" data-quick="all"><span class="s-ico">${ICONS.stack}</span><span class="s-txt"><b>${all.length}</b><span>salons recensés</span></span><span class="s-chev">${ICONS.chevron}</span></button>
  </section>
  <section class="toolbar card">
    <div class="search">${ICONS.search}<input type="search" id="q" placeholder="Rechercher un salon, une ville, un code postal…" value="${esc(F.q)}"></div>
    <button class="btn primary" id="addSalon">${ICONS.plus}Nouveau salon</button>
    <button class="btn btn-outline" id="exportCsv" title="Exporter la liste affichée">${ICONS.download}Export CSV</button>
    <div class="filters">
      <div class="fblock">
        <div class="fb-head"><span class="fb-title">${ICONS.flag}Mon statut</span><span class="fb-links"><button class="lnk" data-st-all>tous</button> · <button class="lnk" data-st-none>aucun</button></span></div>
        <div class="fchips">${ALL_ST.map(k => `<label class="fchip fs-${k} ${F.statuts.includes(k) ? 'on' : ''}"><input type="checkbox" data-st="${k}" ${F.statuts.includes(k) ? 'checked' : ''}><span class="dot"></span>${STATUTS[k].label}<b>${counts.st[k] || 0}</b></label>`).join('')}</div>
      </div>
      <div class="fblock">
        <div class="fb-head"><span class="fb-title">${ICONS.calendar}Période</span></div>
        <div class="fchips">${[['avenir', 'À venir'], ['passe', 'Passés'], ['sansdate', 'Sans date']].map(([k, l]) => `<label class="fchip ${F.periodes.includes(k) ? 'on' : ''}"><input type="checkbox" data-per="${k}" ${F.periodes.includes(k) ? 'checked' : ''}>${l}<b>${counts.per[k] || 0}</b></label>`).join('')}</div>
      </div>
      <div class="fblock fb-dist">
        <div class="fb-head"><span class="fb-title">${ICONS.pin}Distance</span>${F.distMax ? '<span class="fb-links"><button class="lnk" id="distClear">effacer</button></span>' : ''}</div>
        <div class="dist-row">
          <span>à moins de</span>
          <span class="km-in"><input type="number" id="fDist" min="0" step="5" placeholder="—" value="${esc(F.distMax)}"><i>km</i></span>
          <span>de</span>
          <span class="seg-mini">${['corbie', 'oignies'].map(k => `<button class="${F.distRef === k ? 'on' : ''}" data-ref="${k}">${k === 'corbie' ? 'Corbie' : 'Oignies'}</button>`).join('')}</span>
        </div>
        <div class="km-presets">${[25, 50, 75, 100, 150].map(n => `<button class="${+F.distMax === n ? 'on' : ''}" data-km="${n}">${n} km</button>`).join('')}</div>
      </div>
    </div>
  </section>
  <section class="sortbar" role="group" aria-label="Trier">
    <span class="sort-lbl">Trier par</span>
    ${SORTS.map(s => `<button class="sort-btn ${F.tri === s.k ? 'on' : ''}" data-tri="${s.k}" title="${s.title}" aria-pressed="${F.tri === s.k}">${ICONS[s.icon]}<span>${s.label}</span></button>`).join('')}
  </section>
  <p class="count">${list.length} salon${list.length > 1 ? 's' : ''} affiché${list.length > 1 ? 's' : ''}</p>
  <section class="list">
    <div class="row head">
      ${[['nom', 'Ville · salon', ''], ['date', 'Prochaine édition', ''], ['limite', 'Date limite', ''], ['corbie', 'Corbie', 'num'], ['oignies', 'Oignies', 'num']].map(([k, l, c]) => `<button class="th ${c} ${F.tri === k ? 'on' : ''}" data-tri="${k}">${l}${ICONS.sort}</button>`).join('')}<div>Contacts</div><div>Auteurs</div>
    </div>
    ${list.map(rowHtml).join('') || '<div class="empty-row">Aucun salon ne correspond aux filtres.</div>'}
  </section>`;

  $$('.sort-btn, .th[data-tri]').forEach(b => b.onclick = () => { F.tri = b.dataset.tri; saveFilters(); render(); });
  const bind = (id, key, ev = 'change', fn = el => el.value) => $(id).addEventListener(ev, e => { F[key] = fn(e.target); saveFilters(); renderSalonsKeepFocus(id); });
  bind('#q', 'q', 'input');
  bind('#fDist', 'distMax', 'input');
  $$('input[data-st]').forEach(i => i.onchange = () => { F.statuts = $$('input[data-st]:checked').map(x => x.dataset.st); saveFilters(); render(); });
  $$('input[data-per]').forEach(i => i.onchange = () => { F.periodes = $$('input[data-per]:checked').map(x => x.dataset.per); saveFilters(); render(); });
  $('[data-st-all]').onclick = () => { F.statuts = ALL_ST.slice(); saveFilters(); render(); };
  $('[data-st-none]').onclick = () => { F.statuts = []; saveFilters(); render(); };
  $$('[data-ref]').forEach(b => b.onclick = () => { F.distRef = b.dataset.ref; saveFilters(); render(); });
  $$('[data-km]').forEach(b => b.onclick = () => { F.distMax = +F.distMax === +b.dataset.km ? '' : b.dataset.km; saveFilters(); render(); });
  if ($('#distClear')) $('#distClear').onclick = () => { F.distMax = ''; saveFilters(); render(); };
  $('#addSalon').onclick = () => openSalon(null);
  $('#exportCsv').onclick = () => exportCsv(list);
  $$('.stat').forEach(b => b.onclick = () => {
    const k = b.dataset.quick;
    Object.assign(F, { q: '', distMax: '', statuts: DEF_ST.slice(), periodes: ALL_PER.slice(), tri: 'date' });
    if (k === 'inscrit') Object.assign(F, { statuts: ['inscrit'], periodes: ['avenir'] });
    if (k === 'limite') Object.assign(F, { tri: 'limite' });
    if (k === 'avenir') Object.assign(F, { periodes: ['avenir'] });
    if (k === 'all') Object.assign(F, { statuts: ALL_ST.slice() });
    saveFilters(); render();
  });
  $$('.row[data-id]').forEach(r => r.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    const sb = e.target.closest('[data-setst]');
    if (sb) { store.setMine(r.dataset.id, { statut: sb.dataset.setst }); return; }
    openSalon(r.dataset.id);
  }));
}
function renderSalonsKeepFocus(id) {
  const el = $(id); const pos = el?.selectionStart;
  renderSalons();
  const n = $(id); if (n) { n.focus(); if (pos != null && n.setSelectionRange && n.type !== 'number') try { n.setSelectionRange(pos, pos); } catch {} }
}

function rowHtml(s) {
  const st = s._st;
  const t = todayIso();
  // Prochaine édition
  let when;
  if (isUpcoming(s)) {
    const d = daysUntil(s.dateDebut);
    when = `<div class="when">${esc(fmtRange(s.dateDebut, s.dateFin))}</div>
      <div class="sub">${s.horaires ? esc(s.horaires) + ' · ' : ''}${d <= 0 ? 'en cours' : d === 1 ? 'demain' : 'dans ' + d + ' j'}</div>`;
  } else if (s.dateDebut) {
    when = `<div class="when past">Dernière : ${esc(fmtDate(s.dateDebut, false))}</div><div class="sub warn-text">prochaine date à trouver</div>`;
  } else when = `<div class="sub warn-text">date inconnue</div>`;
  // Limite
  const l = effectiveLimite(s);
  let lim = '<span class="muted">—</span>';
  if (l) {
    const d = daysUntil(l.date);
    const cls = l.date < t ? 'lim past' : d <= 14 ? 'lim urgent' : d <= 30 ? 'lim soon' : 'lim';
    const tag = l.date < t ? (l.ancienne || !isUpcoming(s) ? 'dernière connue' : 'passée') : d === 0 ? "aujourd'hui" : `J-${d}`;
    lim = `<span class="${cls}">${esc(fmtDate(l.date, false))}</span><div class="sub">${tag}</div>`;
  }
  const c = s.contacts || {};
  const links = [];
  const pill = (href, cls, icon, label, title = '', ext = true) => `<a class="pill ${cls}" href="${esc(href)}" ${ext ? 'target="_blank" rel="noopener"' : ''} ${title ? `title="${esc(title)}"` : ''}>${icon}<span>${label}</span></a>`;
  const img = k => `<img src="${IMG[k]}" alt="" width="22" height="22">`;
  if ((c.emails || []).length) links.push(pill('mailto:' + c.emails[0], 'p-mail', img('email'), 'Email' + (c.emails.length > 1 ? ' ×' + c.emails.length : ''), c.emails.join(', '), false));
  if (c.facebook) links.push(pill(safeUrl(c.facebook), 'p-fb', img('facebook'), 'Facebook'));
  if (c.instagram) links.push(pill(safeUrl(c.instagram), 'p-ig', img('instagram'), 'Instagram'));
  if (c.site) links.push(pill(safeUrl(c.site), 'p-web', ICONS.globe, 'Site'));
  if (c.formulaire) links.push(pill(safeUrl(c.formulaire), 'p-web', ICONS.form, 'Formulaire'));
  if ((c.telephones || []).length) links.push(pill('tel:' + c.telephones[0].replace(/\s/g, ''), 'p-web', ICONS.phone, 'Tél.', c.telephones.join(', '), false));
  // Autres auteurs
  const others = Object.entries(store.users).filter(([uid, u]) => uid !== me.uid && ['inscrit', 'candidature'].includes(u.salons?.[s.id]?.statut))
    .map(([, u]) => `<span class="mini-av ${u.salons[s.id].statut}" title="${esc(u.name)} — ${esc(STATUTS[u.salons[s.id].statut].label)}">${esc(initials(u.name))}</span>`);
  const hasNote = myEntry(s.id).notes;
  return `<div class="row st-${st}" data-id="${esc(s.id)}" tabindex="0">
    <div class="c-name">
      <div class="name"><span class="pin">${ICONS.pin}</span>${esc(s.ville || '—')}${s.codePostal ? ' <span class="cp">' + esc(s.codePostal) + '</span>' : ''}${s.pays && s.pays !== 'France' ? ' <span class="cp">' + esc(s.pays) + '</span>' : ''} ${hasNote ? '<span class="note-dot" title="J\'ai des notes">✎</span>' : ''}</div>
      <div class="salon-name">${esc(s.nom || 'Sans nom')} <span class="badge st-${st}">${STATUTS[st].short}</span></div>
    </div>
    <div class="c-when"><span class="lbl">Édition</span><span class="cal">${ICONS.calendar}</span><div>${when}</div></div>
    <div class="c-lim"><span class="lbl">Limite</span>${lim}</div>
    <div class="num"><span class="lbl">Corbie</span>${s.distCorbie != null ? esc(s.distCorbie) + ' km' : '—'}</div>
    <div class="num"><span class="lbl">Oignies</span>${s.distOignies != null ? esc(s.distOignies) + ' km' : '—'}</div>
    <div class="c-links">${links.join('') || '<span class="muted">—</span>'}</div>
    <div class="c-authors">${others.join('')}<button class="kebab" title="Ouvrir la fiche" aria-label="Ouvrir la fiche">${ICONS.dots}</button></div>
  </div>`;
}

// ───────────────────────── Fiche salon ─────────────────────────
function openSalon(id) {
  let sid = id;
  const orig = id ? JSON.parse(JSON.stringify(store.salons[id])) : { contacts: {}, pays: 'France' };
  const s = orig, c = s.contacts || {};
  const mine = id ? myEntry(id) : {};
  const st = mine.statut || 'a_etudier';
  const others = id ? Object.entries(store.users).filter(([uid, u]) => uid !== me.uid && u.salons?.[id]?.statut && u.salons[id].statut !== 'a_etudier') : [];
  const histL = (s.historiqueLimites || []).filter(Boolean);
  const histE = (s.historiqueEditions || []).filter(e => e && e.dateDebut);

  openModal(`<div class="modal-inner salon-modal">
    <header class="m-head">
      <div>
        <h2 id="mTitle">${id ? esc(s.ville) + ' <span class="m-sub">' + esc(s.nom) + '</span>' : 'Nouveau salon'}</h2>
        <p class="muted" id="mMeta">${id && s.majPar ? `Modifié par ${esc(s.majPar)} le ${esc(fmtDate((s.majLe || '').slice(0, 10), false))}` : id ? '' : 'Commence par la ville : le code postal et les distances se remplissent tout seuls.'}</p>
      </div>
      <div class="m-right"><span class="save-state" id="saveState"></span>${id ? `<button type="button" class="btn btn-ia" id="iaFiche" title="Chercher la prochaine édition avec ChatGPT">✨ IA</button>` : ''}<button type="button" class="x" data-close aria-label="Fermer">×</button></div>
    </header>

    <form id="salonForm" class="salon-form" autocomplete="off">
      <section class="mine">
        <h3>Mon suivi</h3>
        <div class="seg" id="stSeg">${STATUT_ORDER.map(k => `<button type="button" data-st="${k}" class="st-${k} ${k === st ? 'on' : ''}">${STATUTS[k].label}</button>`).join('')}</div>
        <label><span>Mes notes <span class="muted">(personnelles)</span></span>
          <textarea id="myNotes" name="_myNotes" rows="10" placeholder="Échanges, relances, conditions (prix de la table…), ressenti…">${esc(mine.notes || '')}</textarea></label>
        ${others.length ? `<div class="others"><h4>Les autres auteurs</h4>${others.map(([, u]) => `<span class="badge st-${u.salons[id].statut}">${esc(u.name)} · ${STATUTS[u.salons[id].statut].short}</span>`).join(' ')}</div>` : ''}
      </section>

      <h3>Informations du salon <span class="muted">(communes à tous)</span></h3>
      <div class="grid">
        <div class="ac-wrap">
          <label>Ville<input name="ville" value="${esc(s.ville)}" placeholder="Tape les premières lettres…" required></label>
          <div class="ac-list" id="acList" hidden></div>
        </div>
        <label>Code postal<input name="codePostal" value="${esc(s.codePostal)}" inputmode="numeric" maxlength="6"></label>
        <label class="span2">Nom du salon<input name="nom" value="${esc(s.nom)}" required></label>
        <p class="dup-warn span2" id="dupWarn" hidden></p>
        <label>Pays<input name="pays" value="${esc(s.pays || 'France')}"></label>
        <div></div>
        <label>Distance Corbie (km)<input name="distCorbie" type="number" min="0" value="${esc(s.distCorbie ?? '')}"></label>
        <label>Distance Oignies (km)<input name="distOignies" type="number" min="0" value="${esc(s.distOignies ?? '')}"></label>
        <p class="muted small span2 dist-state" id="distState"></p>

        <label>Date de début<input name="dateDebut" type="date" value="${esc(s.dateDebut)}"></label>
        <label>Date de fin<input name="dateFin" type="date" value="${esc(s.dateFin)}"></label>
        <label class="span2">Horaires<input name="horaires" value="${esc(s.horaires)}" placeholder="ex. sam. 10h-18h / dim. 10h-17h"></label>
        <label>Date limite d'inscription<input name="dateLimite" type="date" value="${esc(s.dateLimite)}"></label>
        <div class="hist small muted">${histL.length ? 'Limites précédentes : ' + histL.map(d => esc(fmtDate(d, false))).join(', ') : ''}${histE.length ? `<br>Éditions précédentes : ${histE.map(e => esc(fmtRange(e.dateDebut, e.dateFin))).join(' · ')}` : ''}</div>
      </div>

      <h3>Contacts</h3>
      <div class="grid">
        <label class="span2">Personne(s) / organisateur<input name="c_nom" value="${esc(c.nom)}" placeholder="Nom, association, mairie…"></label>
        <label class="span2"><span>Email(s) <span class="muted">(séparés par des virgules)</span></span><input name="c_emails" value="${esc((c.emails || []).join(', '))}"></label>
        <label>Téléphone(s)<input name="c_telephones" value="${esc((c.telephones || []).join(', '))}"></label>
        <label>Site web<input name="c_site" value="${esc(c.site)}" placeholder="https://"></label>
        <label>Page Facebook<input name="c_facebook" value="${esc(c.facebook)}" placeholder="https://facebook.com/…"></label>
        <label>Instagram<input name="c_instagram" value="${esc(c.instagram)}" placeholder="https://instagram.com/…"></label>
        <label class="span2">Formulaire d'inscription / contact<input name="c_formulaire" value="${esc(c.formulaire)}" placeholder="https://"></label>
        <label class="span2">Autres infos de contact<textarea name="c_autres" rows="2">${esc(c.autres)}</textarea></label>
      </div>

      <h3>Notes communes</h3>
      <textarea name="notes" rows="4" placeholder="Thème, public, conditions, récurrence… (visible par tous les auteurs)">${esc(s.notes)}</textarea>

      <div class="actions m-foot">
        <span class="muted small">Tout est enregistré automatiquement.</span>
        <div class="grow"></div>
        <button type="button" class="btn danger" id="delSalon" ${id ? '' : 'hidden'}>Supprimer</button>
        <button type="button" class="btn primary" data-close>Terminé</button>
      </div>
    </form>
  </div>`);

  const form = $('#salonForm');
  form.onsubmit = e => e.preventDefault();
  const stateEl = $('#saveState');
  const v = n => form[n].value.trim();

  function collect() {
    const list = n => v(n).split(/[,;]\s*/).map(x => x.trim()).filter(Boolean);
    const numOrNull = n => v(n) === '' ? null : Math.round(+v(n));
    const payload = {
      nom: v('nom'), ville: v('ville'), codePostal: v('codePostal'), pays: v('pays') || 'France',
      distCorbie: numOrNull('distCorbie'), distOignies: numOrNull('distOignies'),
      dateDebut: v('dateDebut'), dateFin: v('dateFin'), horaires: v('horaires'), dateLimite: v('dateLimite'),
      notes: form.notes.value.trim(),
      contacts: {
        nom: v('c_nom'), emails: list('c_emails'), telephones: list('c_telephones'), site: v('c_site'),
        facebook: v('c_facebook'), instagram: v('c_instagram'), formulaire: v('c_formulaire'), autres: form.c_autres.value.trim(),
      },
    };
    // Historique : comparé à l'état à l'ouverture de la fiche (garde la dernière date limite / édition connue)
    const hl = [...(orig.historiqueLimites || [])];
    if (orig.dateLimite && orig.dateLimite !== payload.dateLimite && !hl.includes(orig.dateLimite)) hl.push(orig.dateLimite);
    payload.historiqueLimites = hl.sort();
    const he = [...(orig.historiqueEditions || [])];
    if (orig.dateDebut && orig.dateDebut !== payload.dateDebut && !he.some(x => x.dateDebut === orig.dateDebut)) he.push({ dateDebut: orig.dateDebut, dateFin: orig.dateFin || '', horaires: orig.horaires || '' });
    payload.historiqueEditions = he.sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
    return payload;
  }

  // Création à la volée dès qu'on a une ville ou un nom
  let creating = null;
  function ensureId() {
    if (sid) return Promise.resolve(sid);
    if (creating) return creating;
    const p = collect();
    if (!p.nom && !p.ville) return Promise.resolve(null);
    creating = store.saveSalon(null, p).then(k => { sid = k; $('#delSalon').hidden = false; return k; }).finally(() => { creating = null; });
    return creating;
  }

  const saveInfos = autosave(form, async () => {
    const p = collect();
    if (!p.nom && !p.ville) return false;
    if (!sid) { await ensureId(); } else await store.saveSalon(sid, p);
    $('#mTitle').innerHTML = esc(p.ville || '—') + ' <span class="m-sub">' + esc(p.nom) + '</span>';
    checkDup(p);
  }, stateEl);
  onModalClose(saveInfos);

  function checkDup(p) {
    const w = $('#dupWarn');
    const dup = Object.entries(store.salons).find(([k, x]) => k !== sid && p.ville && norm(x.ville) === norm(p.ville) && (!p.nom || norm(x.nom) === norm(p.nom) || norm(x.nom).includes(norm(p.nom)) || norm(p.nom).includes(norm(x.nom))));
    if (dup && (id == null)) { w.hidden = false; w.innerHTML = `Déjà recensé à ${esc(dup[1].ville)} : « ${esc(dup[1].nom)} ». <a href="#" id="openDup">Ouvrir cette fiche</a>`; $('#openDup').onclick = ev => { ev.preventDefault(); openSalon(dup[0]); }; }
    else w.hidden = true;
  }

  // Mon suivi — les notes perso sont exclues du formulaire commun
  const notesEl = $('#myNotes');
  // (autosave écoute d'abord la zone elle-même, puis on empêche la remontée vers le formulaire commun)
  const saveNotes = autosave(notesEl, async () => {
    const k = await ensureId();
    if (!k) { stateEl.textContent = 'Indique d\'abord la ville ou le nom du salon'; return false; }
    await store.setMine(k, { notes: notesEl.value });
  }, stateEl);
  onModalClose(saveNotes);
  ['input', 'change'].forEach(ev => notesEl.addEventListener(ev, e => e.stopPropagation()));

  $$('#stSeg button').forEach(b => b.onclick = async () => {
    const k = await ensureId();
    if (!k) { toast('Indique d\'abord la ville ou le nom du salon'); return; }
    $$('#stSeg button').forEach(x => x.classList.toggle('on', x === b));
    await store.setMine(k, { statut: b.dataset.st });
    stateEl.textContent = 'Statut : ' + STATUTS[b.dataset.st].label + ' ✓'; stateEl.className = 'save-state ok';
  });

  if ($('#iaFiche')) $('#iaFiche').onclick = async () => { await saveInfos(); iaFiche(sid); };
  $('#delSalon').onclick = async () => {
    if (!confirm(`Supprimer « ${v('nom') || v('ville')} » pour tous les auteurs ?`)) return;
    closeHooks = []; // pas de sauvegarde après suppression
    await store.deleteSalon(sid); modal.close(); toast('Salon supprimé');
  };

  // ── Ville → code postal (autocomplétion) ; code postal → ville ; puis distances ──
  const villeIn = form.ville, cpIn = form.codePostal, ac = $('#acList');
  let acItems = [], acIdx = -1, acTimer;
  const distTouched = { corbie: false, oignies: false };
  form.distCorbie.addEventListener('input', () => distTouched.corbie = true);
  form.distOignies.addEventListener('input', () => distTouched.oignies = true);

  function showAc(items) {
    acItems = items; acIdx = -1;
    if (!items.length) { ac.hidden = true; return; }
    ac.innerHTML = items.map((x, i) => `<button type="button" data-i="${i}"><b>${esc(x.nom)}</b><span>${esc(x.cp)}${x.dep ? ' · ' + esc(x.dep) : ''}</span></button>`).join('');
    ac.hidden = false;
    $$('button', ac).forEach(b => b.onmousedown = ev => { ev.preventDefault(); pick(acItems[+b.dataset.i]); });
  }
  async function pick(x) {
    ac.hidden = true;
    villeIn.value = x.nom; cpIn.value = x.cp;
    if (!v('pays')) form.pays.value = 'France';
    form.dispatchEvent(new Event('input'));
    await fillDistances(x);
  }
  async function searchVille(q) {
    try {
      const r = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,codesPostaux,centre,departement&boost=population&limit=8`).then(r => r.json());
      const items = [];
      for (const cm of r) for (const cp of (cm.codesPostaux || []).slice(0, 3)) items.push({ nom: cm.nom, cp, centre: cm.centre, dep: cm.departement?.nom });
      return items.slice(0, 10);
    } catch { return []; }
  }
  villeIn.addEventListener('input', () => {
    clearTimeout(acTimer);
    const q = villeIn.value.trim();
    if (q.length < 2) { ac.hidden = true; return; }
    acTimer = setTimeout(async () => showAc(await searchVille(q)), 250);
  });
  villeIn.addEventListener('keydown', e => {
    if (ac.hidden) return;
    const btns = $$('button', ac);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); acIdx = (acIdx + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length; btns.forEach((b, i) => b.classList.toggle('on', i === acIdx)); }
    else if (e.key === 'Enter' && acIdx >= 0) { e.preventDefault(); pick(acItems[acIdx]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ac.hidden = true; }
  });
  villeIn.addEventListener('blur', () => setTimeout(() => { ac.hidden = true; }, 150));

  cpIn.addEventListener('input', async () => {
    const cp = v('codePostal');
    if (!/^\d{5}$/.test(cp)) return;
    try {
      const r = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,centre,departement&format=json`).then(r => r.json());
      const items = r.map(cm => ({ nom: cm.nom, cp, centre: cm.centre, dep: cm.departement?.nom }));
      const exact = items.find(x => norm(x.nom) === norm(v('ville')));
      if (exact) return fillDistances(exact);
      if (items.length === 1) return pick(items[0]);
      if (items.length > 1) { villeIn.focus(); showAc(items); }
    } catch {}
  });

  async function fillDistances(x) {
    const st = $('#distState');
    if (!x?.centre) return;
    const [lon, lat] = x.centre.coordinates;
    st.textContent = 'Calcul des distances…';
    const [dc, doi] = await Promise.all([roadKm(ORIGINS.corbie, { lat, lon }), roadKm(ORIGINS.oignies, { lat, lon })]);
    // on ne remplace pas une distance saisie à la main dans cette fiche
    if (!distTouched.corbie) form.distCorbie.value = dc.km;
    if (!distTouched.oignies) form.distOignies.value = doi.km;
    st.textContent = `Distances ${dc.approx || doi.approx ? 'estimées à vol d\'oiseau × 1,25 (service d\'itinéraire injoignable)' : 'routières calculées automatiquement'} pour ${x.nom}.`;
    form.dispatchEvent(new Event('input'));
  }

  if (!id) setTimeout(() => villeIn.focus(), 50);
}

function loadSeed() {
  return new Promise((resolve, reject) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return resolve(null);
      try { resolve(JSON.parse(await f.text())); } catch (e) { reject(new Error('Fichier illisible : ' + e.message)); }
    };
    inp.addEventListener('cancel', () => resolve(null));
    inp.click();
  });
}

// ───────────────────────── Distances ─────────────────────────
async function roadKm(a, b) {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`).then(r => r.json());
    if (r.routes?.[0]) return { km: Math.round(r.routes[0].distance / 1000) };
  } catch {}
  const R = 6371, rad = x => x * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return { km: Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25), approx: true };
}

// ───────────────────────── Sources ─────────────────────────
function renderSources(section = 'salons') {
  const C = section === 'concours';
  const entries = Object.entries(store.sources).filter(([, x]) => (x.section || 'salons') === section).sort((a, b) => norm(a[1].titre).localeCompare(norm(b[1].titre)));
  $('#main').innerHTML = `
  <section class="card sources-intro">
    <h2>Sources</h2>
    <p class="muted">${C ? 'Sites, annuaires de prix littéraires, newsletters, groupes… où repérer de nouveaux concours.' : 'Sites, agendas, groupes Facebook, newsletters… où repérer de nouveaux salons.'} Communes à tous les auteurs.</p>
    <form id="srcForm" class="grid src-form">
      <label>Titre<input name="titre" required placeholder="${C ? 'ex. Annuaire des prix littéraires' : 'ex. Agenda AR2L Hauts-de-France'}"></label>
      <label>Lien<input name="url" placeholder="https://"></label>
      <label class="span2">Note<input name="note" placeholder="À consulter chaque mois, filtre par région…"></label>
      <div class="actions span2"><button class="btn primary">Ajouter la source</button></div>
    </form>
  </section>
  <section class="sources">
    ${entries.map(([id, x]) => `<article class="card src" data-id="${esc(id)}">
      <div class="src-main">
        <h3>${esc(x.titre || x.url)}</h3>
        ${x.url ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.url)}</a>` : ''}
        ${x.note ? `<p>${esc(x.note)}</p>` : ''}
        <p class="muted small">Ajouté par ${esc(x.ajoutePar || '?')}${x.ajouteLe ? ' le ' + esc(fmtDate(x.ajouteLe.slice(0, 10), false)) : ''}</p>
      </div>
      <div class="src-actions"><button class="btn small" data-edit>Modifier</button><button class="btn small danger" data-del>Supprimer</button></div>
    </article>`).join('') || '<p class="muted">Aucune source pour l\'instant.</p>'}
  </section>`;
  $('#srcForm').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    await store.saveSource(null, { titre: f.titre.value.trim(), url: f.url.value.trim(), note: f.note.value.trim(), section });
    toast('Source ajoutée');
  };
  $$('.src').forEach(card => {
    const id = card.dataset.id, x = store.sources[id];
    $('[data-del]', card).onclick = async () => { if (confirm('Supprimer cette source ?')) { await store.deleteSource(id); toast('Source supprimée'); } };
    $('[data-edit]', card).onclick = () => {
      openModal(`<form class="modal-inner" id="srcEdit">
        <header class="m-head"><h2>Modifier la source</h2><div class="m-right"><span class="save-state" id="srcState"></span><button type="button" class="x" data-close>×</button></div></header>
        <label>Titre<input name="titre" value="${esc(x.titre)}" required></label>
        <label>Lien<input name="url" value="${esc(x.url)}"></label>
        <label>Note<textarea name="note" rows="4">${esc(x.note)}</textarea></label>
        <div class="actions"><span class="muted small">Enregistrement automatique.</span><div class="grow"></div><button type="button" class="btn primary" data-close>Terminé</button></div>
      </form>`);
      const f = $('#srcEdit'); f.onsubmit = e => e.preventDefault();
      onModalClose(autosave(f, async () => {
        if (!f.titre.value.trim() && !f.url.value.trim()) return false;
        await store.saveSource(id, { titre: f.titre.value.trim(), url: f.url.value.trim(), note: f.note.value.trim() });
      }, $('#srcState')));
    };
  });
}

// ───────────────────────── Utilitaires UI ─────────────────────────
const modal = $('#modal');
let closeHooks = [];
function onModalClose(fn) { closeHooks.push(fn); }
modal.addEventListener('close', () => { const h = closeHooks; closeHooks = []; h.forEach(fn => fn()); });
function openModal(html) {
  const h = closeHooks; closeHooks = []; h.forEach(fn => fn());
  $('#modalBody').innerHTML = html;
  if (!modal.open) modal.showModal();
  $$('[data-close]', modal).forEach(b => b.onclick = closeModal);
  modal.scrollTop = 0;
}
function closeModal() { if (modal.open) modal.close(); }
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportCsv(list) {
  const cols = ['Salon', 'Ville', 'Code postal', 'Pays', 'Début', 'Fin', 'Horaires', 'Date limite', 'Distance Corbie', 'Distance Oignies', 'Mon statut', 'Emails', 'Téléphones', 'Facebook', 'Instagram', 'Site', 'Formulaire', 'Autres contacts', 'Notes communes', 'Mes notes'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = list.map(s => {
    const c = s.contacts || {}; const l = effectiveLimite(s);
    return [s.nom, s.ville, s.codePostal, s.pays, s.dateDebut, s.dateFin, s.horaires, l?.date, s.distCorbie, s.distOignies, STATUTS[s._st].label,
      (c.emails || []).join(', '), (c.telephones || []).join(', '), c.facebook, c.instagram, c.site, c.formulaire, c.autres, s.notes, myEntry(s.id).notes].map(q).join(';');
  });
  download(`salons-${todayIso()}.csv`, '﻿' + [cols.map(q).join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
}

// ───────────────────────── Recherche IA ─────────────────────────
const REGIONS = {
  ARA: { label: 'Auvergne-Rhône-Alpes', deps: '01 03 07 15 26 38 42 43 63 69 73 74' },
  BFC: { label: 'Bourgogne-Franche-Comté', deps: '21 25 39 58 70 71 89 90' },
  BRE: { label: 'Bretagne', deps: '22 29 35 56' },
  CVL: { label: 'Centre-Val de Loire', deps: '18 28 36 37 41 45' },
  COR: { label: 'Corse', deps: '20' },
  GES: { label: 'Grand Est', deps: '08 10 51 52 54 55 57 67 68 88' },
  HDF: { label: 'Hauts-de-France', deps: '02 59 60 62 80' },
  IDF: { label: 'Île-de-France', deps: '75 77 78 91 92 93 94 95' },
  NOR: { label: 'Normandie', deps: '14 27 50 61 76' },
  NAQ: { label: 'Nouvelle-Aquitaine', deps: '16 17 19 23 24 33 40 47 64 79 86 87' },
  OCC: { label: 'Occitanie', deps: '09 11 12 30 31 32 34 46 48 65 66 81 82' },
  PDL: { label: 'Pays de la Loire', deps: '44 49 53 72 85' },
  PAC: { label: "Provence-Alpes-Côte d'Azur", deps: '04 05 06 13 83 84' },
  OM:  { label: 'Outre-mer', deps: '97' },
  BE:  { label: 'Belgique (Wallonie, Bruxelles)', deps: '' },
};
function regionOf(s) {
  if (norm(s.pays) === 'belgique') return 'BE';
  const cp = String(s.codePostal || '');
  if (!/^\d{5}$/.test(cp)) return null;
  const d = cp.slice(0, 2);
  return Object.keys(REGIONS).find(k => REGIONS[k].deps.split(' ').includes(d)) || null;
}

const IA_KEY = 'salons-du-livre-ia';
let IA = { mode: 'nouveaux', regions: ['HDF'], toutes: false, horizon: 12, exclHS: true, sansDate: false, sel: null, refs: {}, prompt: '', reponse: '', resultat: null, erreur: '' };
try { Object.assign(IA, JSON.parse(localStorage.getItem(IA_KEY)) || {}); } catch {}
const saveIA = () => { try { const { resultat, ...rest } = IA; localStorage.setItem(IA_KEY, JSON.stringify(rest)); } catch {} };

function addMonths(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); }
const lastDate = s => s.dateFin || s.dateDebut || '';

function candidatsMaj() {
  const seuil = addMonths(todayIso(), -3);
  return Object.entries(store.salons)
    .map(([id, s]) => ({ id, ...s }))
    .filter(s => {
      if (IA.exclHS && myStatut(s.id) === 'hors_sujet') return false;
      const d = lastDate(s);
      if (!d) return IA.sansDate;
      return d <= seuil;
    })
    .sort((a, b) => (lastDate(a) || '0').localeCompare(lastDate(b) || '0'));
}

function renderIA() {
  const main = $('#main');
  main.innerHTML = `
  <section class="ia-switch">
    <button class="ia-tab ${IA.mode === 'nouveaux' ? 'on' : ''}" data-mode="nouveaux">${ICONS.search}<span><b>Trouver de nouveaux salons</b><small>Salons pas encore dans la base, par région</small></span></button>
    <button class="ia-tab ${IA.mode === 'maj' ? 'on' : ''}" data-mode="maj">${ICONS.calendar}<span><b>Mettre à jour les dates</b><small>Salons passés depuis plus de 3 mois</small></span></button>
  </section>
  <div id="iaBody"></div>`;
  $$('.ia-tab').forEach(b => b.onclick = () => {
    if (IA.mode === b.dataset.mode) return;
    Object.assign(IA, { mode: b.dataset.mode, prompt: '', reponse: '', resultat: null, erreur: '' });
    saveIA(); renderIA();
  });
  IA.mode === 'maj' ? renderIAMaj() : renderIANouveaux();
}

// Étapes 2-3-4 communes
function iaStepsHtml(S = IA) {
  return `
  <section class="card ia-step">
    <div class="step-n">2</div>
    <div class="step-body">
      <h3>Copier le prompt et ouvrir ChatGPT</h3>
      <p class="muted">Le prompt est copié dans le presse-papiers et ChatGPT s'ouvre dans un nouvel onglet : colle-le (Ctrl/Cmd + V) et lance la recherche. Active la recherche web de ChatGPT si elle ne l'est pas.</p>
      <div class="actions"><button class="btn primary" id="iaGo">${ICONS.search}Générer, copier et ouvrir ChatGPT</button><button class="btn" id="iaCopy" ${S.prompt ? '' : 'disabled'}>Recopier le prompt</button></div>
      <details class="ia-prompt" ${S.prompt ? '' : 'hidden'}><summary>Voir le prompt généré</summary><textarea id="iaPrompt" rows="10" readonly>${esc(S.prompt)}</textarea></details>
    </div>
  </section>
  <section class="card ia-step">
    <div class="step-n">3</div>
    <div class="step-body">
      <h3>Coller la réponse de ChatGPT</h3>
      <p class="muted">Copie toute la réponse (ou seulement le bloc JSON) et colle-la ici.</p>
      <textarea id="iaRep" rows="8" placeholder="Colle ici la réponse de ChatGPT…">${esc(S.reponse)}</textarea>
      <div class="actions"><button class="btn primary" id="iaParse">Analyser la réponse</button><button class="btn ghost" id="iaClear">Effacer</button><span class="err" id="iaErr">${esc(S.erreur)}</span></div>
    </div>
  </section>
  <div id="iaResult"></div>`;
}
function bindIASteps(buildPrompt, parse, S = IA, save = saveIA, rerender = renderIA) {
  $('#iaGo').onclick = async () => {
    const pr = buildPrompt();
    if (!pr) return;
    S.prompt = pr; save();
    const ok = await copyText(pr);
    window.open('https://chatgpt.com/?hints=search', '_blank', 'noopener');
    toast(ok ? 'Prompt copié — colle-le dans ChatGPT' : 'Copie auto impossible : copie le prompt affiché');
    rerender();
    if (!ok) { const d = $('.ia-prompt'); d.open = true; $('#iaPrompt').select(); }
  };
  $('#iaCopy').onclick = async () => toast((await copyText(S.prompt)) ? 'Prompt copié' : 'Copie impossible');
  $('#iaRep').addEventListener('input', e => { S.reponse = e.target.value; save(); });
  $('#iaClear').onclick = () => { Object.assign(IA, { reponse: '', resultat: null, erreur: '' }); save(); rerender(); };
  $('#iaParse').onclick = () => {
    S.reponse = $('#iaRep').value; S.erreur = '';
    try { S.resultat = parse(extractJson(S.reponse)); }
    catch (e) { S.resultat = null; S.erreur = e.message; }
    save(); rerender();
    $('#iaResult')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {}
  try {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch { return false; }
}
function extractJson(txt) {
  if (!txt.trim()) throw new Error('Colle d\'abord la réponse de ChatGPT.');
  const block = txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let s = block ? block[1] : txt;
  const i = Math.min(...['{', '['].map(c => { const k = s.indexOf(c); return k < 0 ? Infinity : k; }));
  const j = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (i === Infinity || j < i) throw new Error('Aucun bloc JSON trouvé dans la réponse. Demande à ChatGPT : « Donne le résultat au format JSON demandé ».');
  s = s.slice(i, j + 1).replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(s); } catch (e) { throw new Error('Le JSON de la réponse est mal formé (' + e.message + '). Demande à ChatGPT de redonner uniquement le bloc JSON.'); }
}
function normDate(v) {
  if (!v) return '';
  v = String(v).trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}
const arr = v => Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : (v ? String(v).split(/[,;]\s*/).map(x => x.trim()).filter(Boolean) : []);
const str = v => (v == null ? '' : String(v).trim());
const CONF = { haute: 'Fiable', moyenne: 'À vérifier', faible: 'Incertain' };

// ── Fonction 1 : nouveaux salons ──
function renderIANouveaux() {
  const body = $('#iaBody');
  body.innerHTML = `
  <section class="card ia-step">
    <div class="step-n">1</div>
    <div class="step-body">
      <h3>Zone de recherche</h3>
      <label class="check big"><input type="checkbox" id="iaAll" ${IA.toutes ? 'checked' : ''}> <b>France entière</b></label>
      <div class="regions ${IA.toutes ? 'disabled' : ''}">
        ${Object.entries(REGIONS).map(([k, r]) => `<label class="check chip ${IA.regions.includes(k) ? 'on' : ''}"><input type="checkbox" value="${k}" ${IA.regions.includes(k) ? 'checked' : ''} ${IA.toutes && k !== 'BE' ? 'disabled' : ''}>${esc(r.label)}</label>`).join('')}
      </div>
      <div class="actions"><button class="btn small ghost" id="rgAll">Tout cocher</button><button class="btn small ghost" id="rgNone">Tout décocher</button>
        <span class="grow"></span>
        <label class="inline">Période : les <select id="iaHorizon">${[6, 12, 18, 24].map(n => `<option ${IA.horizon === n ? 'selected' : ''}>${n}</option>`).join('')}</select> prochains mois</label></div>
    </div>
  </section>
  ${iaStepsHtml()}`;
  $('#iaAll').onchange = e => { IA.toutes = e.target.checked; saveIA(); renderIA(); };
  $$('.regions input').forEach(i => i.onchange = () => {
    IA.regions = $$('.regions input:checked').map(x => x.value); saveIA();
    i.parentElement.classList.toggle('on', i.checked);
  });
  $('#rgAll').onclick = () => { IA.regions = Object.keys(REGIONS); saveIA(); renderIA(); };
  $('#rgNone').onclick = () => { IA.regions = []; IA.toutes = false; saveIA(); renderIA(); };
  $('#iaHorizon').onchange = e => { IA.horizon = +e.target.value; saveIA(); };
  bindIASteps(buildPromptNouveaux, parseNouveaux);
  renderResultNouveaux();
}

function zoneLabel() {
  const r = IA.regions.filter(k => IA.toutes ? k === 'BE' : true).map(k => REGIONS[k].label);
  return IA.toutes ? 'France entière' + (r.length ? ' + ' + r.join(', ') : '') : r.join(', ');
}
function buildPromptNouveaux() {
  if (!IA.toutes && !IA.regions.length) { toast('Coche au moins une région'); return ''; }
  const inZone = s => IA.toutes ? (regionOf(s) !== 'BE' || IA.regions.includes('BE')) : IA.regions.includes(regionOf(s));
  const connus = Object.values(store.salons).filter(inZone).map(s => `- ${s.nom} — ${s.ville}${s.codePostal ? ' (' + s.codePostal + ')' : ''}`).sort();
  const t = todayIso(), fin = addMonths(t, IA.horizon);
  return `Tu es un assistant de veille pour des auteurs de romans (souvent auto-édités ou publiés par de petites maisons d'édition) qui cherchent des salons où tenir un stand de dédicace.

MISSION : utilise la recherche web pour trouver des SALONS DU LIVRE, fêtes du livre, festivals littéraires, marchés d'auteurs ou salons des auteurs locaux qui se tiendront entre le ${fmtDate(t, false)} et le ${fmtDate(fin, false)}.
ZONE : ${zoneLabel()}.

CRITÈRES :
- Événements ouverts aux auteurs exposants (stand, table de dédicace), y compris les petits salons de villages, médiathèques, mairies, associations.
- Exclure les salons réservés à la BD seule, à la jeunesse seule, ou purement professionnels, sauf s'ils acceptent clairement d'autres auteurs.
- Chercher sur les sites des mairies, médiathèques, offices de tourisme, pages Facebook des événements, agendas régionaux du livre, Loumina, etc.
- N'invente rien : si une information n'est pas trouvée, laisse le champ vide. Donne la source (URL) de chaque salon.

SALONS DÉJÀ CONNUS (à NE PAS redonner) :
${connus.join('\n') || '(aucun)'}

FORMAT DE RÉPONSE : réponds UNIQUEMENT avec un bloc de code JSON valide, sans texte autour, exactement de cette forme :
\`\`\`json
{
  "salons": [
    {
      "nom": "Nom du salon",
      "ville": "Commune",
      "codePostal": "00000",
      "pays": "France",
      "dateDebut": "AAAA-MM-JJ",
      "dateFin": "AAAA-MM-JJ ou vide",
      "horaires": "ex. 10h-18h",
      "dateLimite": "AAAA-MM-JJ (date limite d'inscription des auteurs) ou vide",
      "organisateur": "mairie, association, contact…",
      "emails": ["..."],
      "telephones": ["..."],
      "site": "URL",
      "facebook": "URL",
      "instagram": "URL",
      "formulaire": "URL du formulaire d'inscription auteur",
      "description": "1-2 phrases : thème, nombre d'auteurs, conditions (prix de la table…)",
      "source": "URL où l'information a été trouvée",
      "confiance": "haute | moyenne | faible"
    }
  ]
}
\`\`\`
Donne le plus de salons possible (vise 20 à 40), classés par date.`;
}

function findExisting(n) {
  const nv = norm(n.ville), cp = n.codePostal;
  const STOP = new Set(['salon', 'salons', 'livre', 'livres', 'fete', 'festival', 'des', 'les', 'aux', 'edition', 'eme', 'annuel', ...nv.split(/\W+/)]);
  const words = w => norm(w).replace(/[’']/g, ' ').split(/[^a-z0-9]+/).filter(x => x.length > 2 && !STOP.has(x) && !/^\d+(e|er|eme)?$/.test(x));
  const wn = words(n.nom);
  return Object.entries(store.salons).find(([, s]) => {
    const sameTown = (nv && norm(s.ville) === nv) || (cp && s.codePostal === cp && nv && norm(s.ville).includes(nv.slice(0, 4)));
    if (!sameTown) return false;
    const ws = words(s.nom);
    return (!wn.length && !ws.length) || wn.some(w => ws.includes(w)) || norm(s.nom) === norm(n.nom);
  });
}
function parseNouveaux(j) {
  const list = Array.isArray(j) ? j : (j.salons || j.resultats || []);
  if (!list.length) throw new Error('La réponse ne contient aucun salon.');
  return list.map((x, i) => {
    const n = {
      nom: str(x.nom), ville: str(x.ville), codePostal: str(x.codePostal || x.cp), pays: str(x.pays) || 'France',
      dateDebut: normDate(x.dateDebut), dateFin: normDate(x.dateFin), horaires: str(x.horaires), dateLimite: normDate(x.dateLimite),
      contacts: { nom: str(x.organisateur), emails: arr(x.emails || x.email), telephones: arr(x.telephones || x.telephone), site: str(x.site), facebook: str(x.facebook), instagram: str(x.instagram), formulaire: str(x.formulaire), autres: '' },
      description: str(x.description), source: str(x.source), confiance: norm(x.confiance),
    };
    const dup = findExisting(n);
    n._k = i; n._dup = dup ? { id: dup[0], nom: dup[1].nom, ville: dup[1].ville } : null;
    n._on = !dup && n.nom && n.ville && n.confiance !== 'faible';
    return n;
  }).filter(n => n.nom || n.ville);
}

function renderResultNouveaux() {
  const box = $('#iaResult'); const R = IA.resultat;
  if (!R) { box.innerHTML = ''; return; }
  const nb = R.filter(n => n._on).length;
  box.innerHTML = `
  <section class="card ia-step">
    <div class="step-n">4</div>
    <div class="step-body">
      <h3>${R.length} salon${R.length > 1 ? 's' : ''} proposé${R.length > 1 ? 's' : ''} — coche ceux à ajouter</h3>
      <p class="muted">Les salons qui ressemblent à un salon déjà listé sont décochés. Les distances depuis Corbie et Oignies sont calculées à l'ajout.</p>
      <div class="actions"><button class="btn small ghost" id="rAll">Tout cocher</button><button class="btn small ghost" id="rNone">Tout décocher</button></div>
      <div class="ia-list">
        ${R.map(n => `<label class="ia-item ${n._on ? 'on' : ''} ${n._dup ? 'dup' : ''}">
          <input type="checkbox" data-k="${n._k}" ${n._on ? 'checked' : ''}>
          <div class="ia-main">
            <div class="ia-title"><b>${esc(n.ville || '?')}</b> <span class="cp">${esc(n.codePostal)}</span> · ${esc(n.nom)} ${n.confiance ? `<span class="conf c-${esc(n.confiance)}">${CONF[n.confiance] || esc(n.confiance)}</span>` : ''}</div>
            <div class="ia-meta">${n.dateDebut ? ICONS.calendar + ' ' + esc(fmtRange(n.dateDebut, n.dateFin)) : '<span class="warn-text">date non trouvée</span>'}${n.horaires ? ' · ' + esc(n.horaires) : ''}${n.dateLimite ? ' · limite ' + esc(fmtDate(n.dateLimite, false)) : ''}</div>
            ${n.description ? `<div class="ia-desc">${esc(n.description)}</div>` : ''}
            <div class="ia-meta">${[n.contacts.nom, ...n.contacts.emails, ...n.contacts.telephones].filter(Boolean).map(esc).join(' · ')}
              ${['site', 'facebook', 'instagram', 'formulaire'].filter(k => n.contacts[k]).map(k => `<a href="${esc(safeUrl(n.contacts[k]))}" target="_blank" rel="noopener">${k}</a>`).join(' ')}
              ${n.source ? `<a href="${esc(safeUrl(n.source))}" target="_blank" rel="noopener">source</a>` : ''}</div>
            ${n._dup ? `<div class="dup-note">Ressemble à « ${esc(n._dup.nom)} » (${esc(n._dup.ville)}) déjà listé</div>` : ''}
          </div>
        </label>`).join('')}
      </div>
      <div class="actions ia-apply"><button class="btn primary" id="rApply" ${nb ? '' : 'disabled'}>${ICONS.plus}Ajouter <span id="rNb">${nb}</span> salon${nb > 1 ? 's' : ''} à la base</button><span class="muted small" id="rState"></span></div>
    </div>
  </section>`;
  const upd = () => { const k = R.filter(n => n._on).length; $('#rNb').textContent = k; $('#rApply').disabled = !k; };
  $$('.ia-item input', box).forEach(i => i.onchange = () => { R[+i.dataset.k]._on = i.checked; i.closest('.ia-item').classList.toggle('on', i.checked); upd(); });
  $('#rAll').onclick = () => { R.forEach(n => n._on = true); renderResultNouveaux(); };
  $('#rNone').onclick = () => { R.forEach(n => n._on = false); renderResultNouveaux(); };
  $('#rApply').onclick = async () => {
    const todo = R.filter(n => n._on);
    $('#rApply').disabled = true;
    let done = 0;
    for (const n of todo) {
      $('#rState').textContent = `Ajout ${done + 1}/${todo.length} : ${n.ville}…`;
      const payload = {
        nom: n.nom, ville: n.ville, codePostal: n.codePostal, pays: n.pays, dateDebut: n.dateDebut, dateFin: n.dateFin, horaires: n.horaires,
        dateLimite: n.dateLimite, contacts: n.contacts, distCorbie: null, distOignies: null, historiqueLimites: [], historiqueEditions: [],
        notes: [n.description, n.source ? `Trouvé par recherche IA le ${fmtDate(todayIso(), false)} — source : ${n.source}` : ''].filter(Boolean).join('\n'),
        origine: 'Recherche IA',
      };
      try {
        const pt = await geocode(n.codePostal, n.ville);
        if (pt) {
          const [dc, doi] = await Promise.all([roadKm(ORIGINS.corbie, pt), roadKm(ORIGINS.oignies, pt)]);
          payload.distCorbie = dc.km; payload.distOignies = doi.km;
          if (!payload.codePostal && pt.cp) payload.codePostal = pt.cp;
        }
      } catch {}
      await store.saveSalon(null, payload);
      done++;
    }
    IA.resultat = null; IA.reponse = ''; saveIA();
    toast(`${done} salon${done > 1 ? 's' : ''} ajouté${done > 1 ? 's' : ''}`);
    setView('salons');
  };
}
async function geocode(cp, ville) {
  let r = [];
  if (/^\d{5}$/.test(cp || '')) r = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,centre,codesPostaux`).then(x => x.json());
  if (!r.length && ville) r = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=nom,centre,codesPostaux&boost=population&limit=3`).then(x => x.json());
  if (!r.length) return null;
  const hit = r.find(x => norm(x.nom) === norm(ville)) || r[0];
  const [lon, lat] = hit.centre.coordinates;
  return { lat, lon, cp: (hit.codesPostaux || [])[0] };
}

// ── Fonction 2 : mise à jour des salons passés ──
function renderIAMaj() {
  const cands = candidatsMaj();
  if (!IA.sel) IA.sel = cands.slice(0, 25).map(s => s.id);
  const sel = new Set(IA.sel.filter(id => cands.some(c => c.id === id)));
  const body = $('#iaBody');
  body.innerHTML = `
  <section class="card ia-step">
    <div class="step-n">1</div>
    <div class="step-body">
      <h3>Salons à vérifier <span class="muted">(dernière édition passée depuis plus de 3 mois)</span></h3>
      <div class="actions">
        <label class="check"><input type="checkbox" id="iaHS" ${IA.exclHS ? 'checked' : ''}> Exclure mes « hors sujet »</label>
        <label class="check"><input type="checkbox" id="iaND" ${IA.sansDate ? 'checked' : ''}> Inclure les salons sans aucune date</label>
      </div>
      <div class="actions"><button class="btn small ghost" id="sAll">Tout cocher</button><button class="btn small ghost" id="s25">Les 25 premiers</button><button class="btn small ghost" id="sNone">Tout décocher</button>
        <span class="muted small"><b id="selNb">${sel.size}</b> / ${cands.length} sélectionnés — ChatGPT est plus fiable par lots de 20 à 30.</span></div>
      <div class="cand-list">
        ${cands.map(s => `<label class="cand ${sel.has(s.id) ? 'on' : ''}"><input type="checkbox" value="${esc(s.id)}" ${sel.has(s.id) ? 'checked' : ''}>
          <span class="c-v"><b>${esc(s.ville)}</b> <span class="cp">${esc(s.codePostal || '')}</span></span>
          <span class="c-n">${esc(s.nom)}</span>
          <span class="c-d">${lastDate(s) ? 'dernière : ' + esc(fmtDate(lastDate(s), false)) : '<i>sans date</i>'}</span></label>`).join('') || '<p class="muted">Aucun salon à mettre à jour : toutes les dates sont récentes ou à venir.</p>'}
      </div>
    </div>
  </section>
  ${iaStepsHtml()}`;
  const setSel = ids => { IA.sel = ids; saveIA(); renderIA(); };
  $('#iaHS').onchange = e => { IA.exclHS = e.target.checked; IA.sel = null; saveIA(); renderIA(); };
  $('#iaND').onchange = e => { IA.sansDate = e.target.checked; IA.sel = null; saveIA(); renderIA(); };
  $('#sAll').onclick = () => setSel(cands.map(s => s.id));
  $('#s25').onclick = () => setSel(cands.slice(0, 25).map(s => s.id));
  $('#sNone').onclick = () => setSel([]);
  $$('.cand input').forEach(i => i.onchange = () => {
    i.parentElement.classList.toggle('on', i.checked);
    IA.sel = $$('.cand input:checked').map(x => x.value); saveIA();
    $('#selNb').textContent = IA.sel.length;
  });
  bindIASteps(buildPromptMaj, parseMaj);
  renderResultMaj();
}

function buildPromptMaj() {
  const ids = (IA.sel || []).filter(id => store.salons[id]);
  if (!ids.length) { toast('Coche au moins un salon'); return ''; }
  const r = promptMaj(ids);
  IA.refs = r.refs; saveIA();
  return r.prompt;
}
function promptMaj(ids) {
  const refs = {};
  const lignes = ids.map((id, i) => {
    const ref = 'S' + (i + 1); refs[ref] = id;
    const s = store.salons[id], c = s.contacts || {};
    const liens = [c.site, c.facebook, c.instagram].filter(Boolean).join(' ; ');
    return `${ref} | ${s.nom} | ${s.ville}${s.codePostal ? ' (' + s.codePostal + ')' : ''}${s.pays && s.pays !== 'France' ? ', ' + s.pays : ''} | dernière édition connue : ${lastDate(s) ? fmtRange(s.dateDebut, s.dateFin) : 'inconnue'}${liens ? ' | liens connus : ' + liens : ''}`;
  });
  return { refs, prompt: `Tu es un assistant de veille pour des auteurs qui participent à des salons du livre (stands de dédicace).

MISSION : pour chacun des salons ci-dessous, dont la dernière édition connue est passée, utilise la recherche web pour trouver la date de la PROCHAINE édition (postérieure au ${fmtDate(todayIso(), false)}), ainsi que les horaires, la date limite d'inscription des auteurs et les contacts à jour.
Privilégie les sources officielles et récentes : site de la mairie ou de la médiathèque, page Facebook / Instagram de l'événement, site de l'organisateur, agendas régionaux du livre.
N'invente rien : si la prochaine édition n'est pas encore annoncée, mets "trouve": false et explique brièvement dans "commentaire" (ex. « date 2027 non publiée, édition habituellement en avril »). Si le salon semble arrêté, indique-le dans "commentaire".

SALONS (garde la référence Sx dans ta réponse) :
${lignes.join('\n')}

FORMAT DE RÉPONSE : réponds UNIQUEMENT avec un bloc de code JSON valide, sans texte autour, avec une entrée par salon, exactement de cette forme :
\`\`\`json
{
  "resultats": [
    {
      "ref": "S1",
      "trouve": true,
      "dateDebut": "AAAA-MM-JJ",
      "dateFin": "AAAA-MM-JJ ou vide",
      "horaires": "ex. 10h-18h",
      "dateLimite": "AAAA-MM-JJ ou vide",
      "emails": ["..."],
      "telephones": ["..."],
      "site": "URL ou vide",
      "facebook": "URL ou vide",
      "instagram": "URL ou vide",
      "formulaire": "URL du formulaire d'inscription auteur ou vide",
      "commentaire": "précisions utiles (conditions, lieu, arrêt du salon…)",
      "source": "URL où l'information a été trouvée",
      "confiance": "haute | moyenne | faible"
    }
  ]
}
\`\`\`` };
}

const MAJ_FIELDS = [
  ['dateDebut', 'Date de début', 'date'], ['dateFin', 'Date de fin', 'date'], ['horaires', 'Horaires'], ['dateLimite', 'Date limite', 'date'],
  ['emails', 'Emails (ajout)', 'list'], ['telephones', 'Téléphones (ajout)', 'list'],
  ['site', 'Site web', 'c'], ['facebook', 'Facebook', 'c'], ['instagram', 'Instagram', 'c'], ['formulaire', 'Formulaire', 'c'],
];
function parseMaj(j, refs = IA.refs) {
  const list = Array.isArray(j) ? j : (j.resultats || j.salons || []);
  if (!list.length) throw new Error('La réponse ne contient aucun résultat.');
  const t = todayIso();
  return list.map((x, i) => {
    const id = refs[str(x.ref).toUpperCase()] || (Object.keys(refs).length === 1 ? Object.values(refs)[0] : null);
    const s = id && store.salons[id];
    const r = { _k: i, ref: str(x.ref), id, trouve: x.trouve !== false && x.trouve !== 'false', commentaire: str(x.commentaire), source: str(x.source), confiance: norm(x.confiance), changes: [] };
    if (!s) { r.orphelin = true; return r; }
    const c = s.contacts || {};
    const val = {
      dateDebut: normDate(x.dateDebut), dateFin: normDate(x.dateFin), horaires: str(x.horaires), dateLimite: normDate(x.dateLimite),
      emails: arr(x.emails || x.email), telephones: arr(x.telephones || x.telephone),
      site: str(x.site), facebook: str(x.facebook), instagram: str(x.instagram), formulaire: str(x.formulaire),
    };
    for (const [k, label, type] of MAJ_FIELDS) {
      const nv = val[k];
      if (!nv || (Array.isArray(nv) && !nv.length)) continue;
      if (type === 'list') {
        const cur = (c[k] || []).map(norm);
        const add = nv.filter(v => !cur.includes(norm(v)));
        if (add.length) r.changes.push({ k, label, type, old: (c[k] || []).join(', '), neu: add, on: true });
      } else {
        const old = type === 'c' ? (c[k] || '') : (s[k] || '');
        if (norm(old) === norm(nv)) continue;
        let on = r.confiance !== 'faible';
        let warn = '';
        if (type === 'date' && nv < t && k !== 'dateLimite') { on = false; warn = 'date déjà passée'; }
        r.changes.push({ k, label, type, old, neu: nv, on, warn });
      }
    }
    r.noteOn = !!(r.commentaire || r.source);
    return r;
  });
}

const fmtV = (c, v) => c.type === 'num' ? (v === '' || v == null ? '—' : +v === 0 ? 'Gratuit' : v + ' €') : c.type === 'date' ? (v ? fmtDate(v, false) : '—') : Array.isArray(v) ? v.join(', ') : (v || '—');
const noteText = r => `MAJ IA ${fmtDate(todayIso(), false)}${r.commentaire ? ' — ' + r.commentaire : ''}${r.source ? ' — source : ' + r.source : ''}`;

function majCardHtml(r, withTitle = true, heading = null) {
  const s = store.salons[r.id] || {};
  heading = heading || `<b>${esc(s.ville)}</b> <span class="cp">${esc(s.codePostal || '')}</span> · ${esc(s.nom)}`;
  return `<div class="maj-card" data-k="${r._k}">
    ${withTitle ? `<div class="ia-title"><label class="check"><input type="checkbox" class="m-all" ${r.changes.every(c => c.on) ? 'checked' : ''}></label>
      ${heading}
      ${r.confiance ? `<span class="conf c-${esc(r.confiance)}">${CONF[r.confiance] || esc(r.confiance)}</span>` : ''}
      ${r.source ? `<a href="${esc(safeUrl(r.source))}" target="_blank" rel="noopener" class="small">source</a>` : ''}</div>`
    : `<div class="ia-title">${r.confiance ? `<span class="conf c-${esc(r.confiance)}">${CONF[r.confiance] || esc(r.confiance)}</span>` : ''}${r.source ? `<a href="${esc(safeUrl(r.source))}" target="_blank" rel="noopener" class="small">voir la source</a>` : ''}</div>`}
    ${r.commentaire ? `<div class="ia-desc">${esc(r.commentaire)}</div>` : ''}
    <table class="diff"><tbody>
      ${r.changes.map((c, i) => `<tr class="${c.on ? 'on' : ''}"><td><input type="checkbox" data-i="${i}" ${c.on ? 'checked' : ''}></td><th>${esc(c.label)}</th>
        <td class="old ${c.type === 'list' ? 'keep' : ''}">${esc(fmtV(c, c.old))}${c.type === 'list' && c.old ? ' <span class="small">(conservés)</span>' : ''}</td><td class="arrow">→</td><td class="neu">${esc(fmtV(c, c.neu))}${c.warn ? ` <span class="warn-text small">(${esc(c.warn)})</span>` : ''}</td></tr>`).join('')}
      ${(r.commentaire || r.source) ? `<tr class="${r.noteOn ? 'on' : ''}"><td><input type="checkbox" data-note ${r.noteOn ? 'checked' : ''}></td><th>Notes communes</th><td colspan="3" class="neu">ajouter : « ${esc(noteText(r))} »</td></tr>` : ''}
    </tbody></table>
  </div>`;
}
function bindMajCard(card, r, rerender) {
  $$('input[data-i]', card).forEach(i => i.onchange = () => { r.changes[+i.dataset.i].on = i.checked; i.closest('tr').classList.toggle('on', i.checked); const a = $('.m-all', card); if (a) a.checked = r.changes.every(c => c.on); });
  const nt = $('input[data-note]', card); if (nt) nt.onchange = () => { r.noteOn = nt.checked; nt.closest('tr').classList.toggle('on', nt.checked); };
  const all = $('.m-all', card); if (all) all.onchange = e => { r.changes.forEach(c => c.on = e.target.checked); r.noteOn = e.target.checked; rerender(); };
}
// Applique les modifications cochées d'un résultat ; renvoie true si quelque chose a été enregistré
async function applyMaj(r) {
  const on = r.changes.filter(c => c.on);
  if (!on.length && !r.noteOn) return false;
  const s = store.salons[r.id]; if (!s) return false;
  const patch = { contacts: { ...(s.contacts || {}) } };
  for (const c of on) {
    if (c.type === 'list') patch.contacts[c.k] = [...(s.contacts?.[c.k] || []), ...c.neu];
    else if (c.type === 'c') patch.contacts[c.k] = c.neu;
    else patch[c.k] = c.neu;
  }
  // Historique : on garde l'édition et la date limite précédentes
  if (patch.dateDebut && s.dateDebut && patch.dateDebut !== s.dateDebut) {
    const he = [...(s.historiqueEditions || [])];
    if (!he.some(x => x.dateDebut === s.dateDebut)) he.push({ dateDebut: s.dateDebut, dateFin: s.dateFin || '', horaires: s.horaires || '' });
    patch.historiqueEditions = he.sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
    if (!('dateFin' in patch)) patch.dateFin = '';
  }
  if (patch.dateLimite && s.dateLimite && patch.dateLimite !== s.dateLimite) {
    const hl = [...(s.historiqueLimites || [])]; if (!hl.includes(s.dateLimite)) hl.push(s.dateLimite); patch.historiqueLimites = hl.sort();
  }
  if (r.noteOn && (r.commentaire || r.source)) patch.notes = [s.notes, noteText(r)].filter(Boolean).join('\n');
  await store.saveSalon(r.id, patch);
  return true;
}

function renderResultMaj() {
  const box = $('#iaResult'); const R = IA.resultat;
  if (!R) { box.innerHTML = ''; return; }
  const found = R.filter(r => r.id && r.changes.length);
  const rest = R.filter(r => !(r.id && r.changes.length));
  box.innerHTML = `
  <section class="card ia-step">
    <div class="step-n">4</div>
    <div class="step-body">
      <h3>${found.length} salon${found.length > 1 ? 's' : ''} avec des informations nouvelles — coche ce que tu veux conserver</h3>
      <div class="ia-list">${found.map(r => majCardHtml(r)).join('') || '<p class="muted">Aucune information nouvelle à appliquer.</p>'}</div>
      ${rest.length ? `<details class="ia-rest"><summary>${rest.length} salon${rest.length > 1 ? 's' : ''} sans nouvelle information</summary><ul>
        ${rest.map(r => { const s = r.id && store.salons[r.id]; return `<li><b>${s ? esc(s.ville) + ' · ' + esc(s.nom) : esc(r.ref) + ' (référence inconnue)'}</b> — ${esc(r.commentaire || (r.trouve ? 'rien de nouveau' : 'prochaine édition non trouvée'))}${r.source ? ` <a href="${esc(safeUrl(r.source))}" target="_blank" rel="noopener">source</a>` : ''}</li>`; }).join('')}
      </ul></details>` : ''}
      <div class="actions ia-apply"><button class="btn primary" id="mApply">Appliquer les mises à jour cochées</button><span class="muted small" id="mState"></span></div>
    </div>
  </section>`;
  $$('.maj-card', box).forEach(card => bindMajCard(card, R.find(x => x._k === +card.dataset.k), renderResultMaj));
  $('#mApply').onclick = async () => {
    $('#mApply').disabled = true;
    let n = 0;
    for (const r of found) { $('#mState').textContent = `Mise à jour : ${store.salons[r.id]?.ville || ''}…`; if (await applyMaj(r)) n++; }
    IA.resultat = null; IA.reponse = ''; IA.sel = null; saveIA();
    toast(`${n} salon${n > 1 ? 's' : ''} mis à jour`);
    renderIA();
  };
}

// ── IA depuis une fiche (salon ou concours) : popup coller → valider ──
async function iaPopup({ subtitle, prompt, parse, apply, back, emptyMsg, heading }) {
  const ok = await copyText(prompt);
  window.open('https://chatgpt.com/?hints=search', '_blank', 'noopener');
  let res = null;
  const title = `<header class="m-head"><div><h2>✨ Mise à jour IA</h2><p class="muted">${esc(subtitle)}</p></div><button type="button" class="x" data-close aria-label="Fermer">×</button></header>`;
  const step1 = () => {
    openModal(`<div class="modal-inner ia-pop">
      ${title}
      <p class="ia-hint">${ok ? '✅ Le prompt est copié et ChatGPT s\'est ouvert dans un nouvel onglet : colle-le (Ctrl/Cmd + V), lance la recherche, puis copie la réponse ici.' : '⚠️ La copie automatique a échoué : clique « Recopier le prompt », puis colle-le dans ChatGPT.'}</p>
      <textarea id="popRep" rows="10" placeholder="Colle ici la réponse de ChatGPT…"></textarea>
      <p class="err" id="popErr"></p>
      <div class="actions"><button class="btn primary" id="popParse">Analyser la réponse</button><button class="btn" id="popCopy">Recopier le prompt</button><div class="grow"></div><button class="btn ghost" id="popBack">Retour à la fiche</button></div>
    </div>`);
    $('#popRep').focus();
    $('#popCopy').onclick = async () => toast((await copyText(prompt)) ? 'Prompt copié' : 'Copie impossible');
    $('#popBack').onclick = back;
    $('#popParse').onclick = () => {
      try { res = parse(extractJson($('#popRep').value))[0]; if (!res || !res.id) throw new Error('La réponse ne correspond pas à cette fiche.'); step2(); }
      catch (e) { $('#popErr').textContent = e.message; }
    };
  };
  const step2 = () => {
    const has = res.changes.length || res.commentaire || res.source;
    openModal(`<div class="modal-inner ia-pop">
      ${title}
      ${res.changes.length ? '<p class="ia-hint">Coche les modifications à conserver, puis valide.</p>'
        : `<p class="ia-hint">${emptyMsg}${res.trouve ? '' : ' : la prochaine édition ne semble pas encore annoncée'}.</p>`}
      ${has ? majCardHtml(res, false, heading ? heading(res) : null) : ''}
      <div class="actions m-foot"><button class="btn ghost" id="popRetry">Coller une autre réponse</button><div class="grow"></div><button class="btn" id="popCancel">Annuler</button><button class="btn primary" id="popApply" ${has ? '' : 'disabled'}>Valider les modifications</button></div>
    </div>`);
    const card = $('.ia-pop .maj-card'); if (card) bindMajCard(card, res, step2);
    $('#popRetry').onclick = step1;
    $('#popCancel').onclick = back;
    $('#popApply').onclick = async () => {
      $('#popApply').disabled = true;
      const done = await apply(res);
      toast(done ? 'Fiche mise à jour' : 'Rien à enregistrer');
      back();
    };
  };
  step1();
}
async function iaFiche(id) {
  const s = store.salons[id]; if (!s) return;
  const { prompt, refs } = promptMaj([id]);
  iaPopup({ subtitle: `${s.ville} · ${s.nom}`, prompt, parse: j => parseMaj(j, refs), apply: applyMaj, back: () => openSalon(id), emptyMsg: 'Aucune nouvelle date ni nouveau contact trouvé' });
}

// ═════════════════════════ SECTION CONCOURS ═════════════════════════
const CSTATUTS = {
  a_etudier:   { label: 'À étudier',      short: 'À étudier' },
  preparation: { label: 'En préparation', short: 'En préparation' },
  depose:      { label: 'Dossier déposé', short: 'Déposé' },
  selection:   { label: 'Présélectionné', short: 'Présélectionné' },
  laureat:     { label: 'Lauréat',        short: 'Lauréat 🏆' },
  non_retenu:  { label: 'Non retenu',     short: 'Non retenu' },
  hors_sujet:  { label: 'Hors sujet',     short: 'Hors sujet' },
};
const C_ORDER = Object.keys(CSTATUTS);
const C_DEF_ST = C_ORDER.filter(k => k !== 'hors_sujet');
const C_ALL_PER = ['ouvert', 'clos', 'sansdate'];
const C_TYPES = ['Prix littéraire', "Concours d'écriture", 'Appel à manuscrits', 'Concours de nouvelles', 'Premier roman', 'Résidence / bourse'];
const C_SORTS = [
  { k: 'limite', icon: 'hourglass', label: 'Date limite', title: 'Dates limites les plus proches d\'abord' },
  { k: 'resultats', icon: 'calendar', label: 'Résultats', title: 'Date des résultats' },
  { k: 'frais', icon: 'stack', label: 'Frais', title: 'Gratuits d\'abord' },
  { k: 'statut', icon: 'flag', label: 'Mon statut', title: 'Lauréat, présélectionné, déposé… d\'abord' },
  { k: 'nom', icon: 'az', label: 'Nom A→Z', title: 'Ordre alphabétique' },
];
const CF_KEY = 'salons-du-livre-filtres-concours';
let CF = { q: '', statuts: C_DEF_ST.slice(), periodes: C_ALL_PER.slice(), gratuit: false, autoEd: false, tri: 'limite' };
try { Object.assign(CF, JSON.parse(localStorage.getItem(CF_KEY)) || {}); } catch {}
const saveCF = () => { try { localStorage.setItem(CF_KEY, JSON.stringify(CF)); } catch {} };

const allConcours = () => (store.concours || {});
const myC = id => (store.users[me.uid]?.concours || {})[id] || {};
const myCSt = id => myC(id).statut || 'a_etudier';
const cLimite = c => {
  if (c.dateLimite) return { date: c.dateLimite, ancienne: false };
  const h = (c.historiqueLimites || []).filter(Boolean);
  return h.length ? { date: h[h.length - 1], ancienne: true } : null;
};
const cPeriode = c => c.dateLimite ? (c.dateLimite >= todayIso() ? 'ouvert' : 'clos') : 'sansdate';
const fraisNum = v => {
  if (v === '' || v == null) return null;
  if (typeof v === 'number') return v;
  const t = norm(v);
  if (/gratuit|aucun|^0\b|free/.test(t)) return 0;
  const n = parseFloat(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
};
const fraisLabel = f => f == null || f === '' ? '—' : +f === 0 ? 'Gratuit' : `${String(f).replace('.', ',')} €`;
const autoEdLabel = { oui: 'Auto-édition acceptée', non: 'Auto-édition refusée' };

function filteredConcours() {
  const q = norm(CF.q);
  let list = Object.entries(allConcours()).map(([id, c]) => ({ id, ...c, _st: myCSt(id) }));
  list = list.filter(c => {
    if (!CF.statuts.includes(c._st)) return false;
    if (!CF.periodes.includes(cPeriode(c))) return false;
    if (CF.gratuit && fraisNum(c.frais) !== 0) return false;
    if (CF.autoEd && c.autoEdition !== 'oui') return false;
    if (q) {
      const hay = norm([c.nom, c.organisateur, c.type, c.genres, c.formats, c.zone, c.dotation, c.conditions, c.notes].join(' '));
      if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const t = todayIso();
  const limKey = c => { const l = cLimite(c); return !l ? '3' : (l.date >= t ? '0' + l.date : '1' + (9999 - +l.date.slice(0, 4)) + l.date.slice(4)); };
  const sorters = {
    limite: (a, b) => limKey(a).localeCompare(limKey(b)),
    resultats: (a, b) => (a.dateResultats || '9999').localeCompare(b.dateResultats || '9999'),
    frais: (a, b) => (fraisNum(a.frais) ?? 1e9) - (fraisNum(b.frais) ?? 1e9) || limKey(a).localeCompare(limKey(b)),
    statut: (a, b) => C_ORDER.indexOf(b._st === 'hors_sujet' || b._st === 'non_retenu' ? 'a_etudier' : b._st) - C_ORDER.indexOf(a._st === 'hors_sujet' || a._st === 'non_retenu' ? 'a_etudier' : a._st) || limKey(a).localeCompare(limKey(b)),
    nom: (a, b) => norm(a.nom).localeCompare(norm(b.nom)),
  };
  return list.sort(sorters[CF.tri] || sorters.limite);
}

function concoursRulesHelp() {
  return `<section class="card empty"><h2>Section Concours pas encore autorisée</h2>
    <p>La base refuse l'accès aux concours : il faut ajouter une ligne aux règles de sécurité Firestore (console Firebase → Firestore Database → Règles), à côté du bloc « sources », puis <b>Publier</b> :</p>
    <pre class="code">match /concours/{concoursId} {
  allow read, write: if auteurAutorise();
}</pre>
    <p class="muted small">Les salons ne sont pas concernés et continuent de fonctionner.</p></section>`;
}

function renderConcours() {
  const main = $('#main');
  if (store.concoursError) { main.innerHTML = concoursRulesHelp(); return; }
  const all = Object.keys(allConcours());
  const t = todayIso();
  const mine = store.users[me.uid]?.concours || {};
  const enCours = Object.entries(mine).filter(([id, v]) => ['depose', 'selection'].includes(v.statut) && allConcours()[id]).length;
  const lim30 = Object.entries(allConcours()).filter(([id, c]) => c.dateLimite && c.dateLimite >= t && daysUntil(c.dateLimite) <= 30 && ['a_etudier', 'preparation'].includes(myCSt(id))).length;
  const ouverts = Object.values(allConcours()).filter(c => cPeriode(c) === 'ouvert').length;
  const counts = { st: {}, per: {} };
  for (const [id, c] of Object.entries(allConcours())) {
    const st = myCSt(id); counts.st[st] = (counts.st[st] || 0) + 1;
    const pe = cPeriode(c); counts.per[pe] = (counts.per[pe] || 0) + 1;
  }
  if (!all.length) {
    main.innerHTML = `<section class="card empty">
      <h2>Aucun concours recensé pour l'instant</h2>
      <p>Ajoute un concours à la main, ou lance une recherche assistée par IA pour en trouver.</p>
      <div class="actions"><button class="btn primary" id="cAddEmpty">${ICONS.plus}Nouveau concours</button><button class="btn btn-outline" id="cIaEmpty">✨ Recherche IA</button></div>
    </section>`;
    $('#cAddEmpty').onclick = () => openConcours(null);
    $('#cIaEmpty').onclick = () => setView('c-ia');
    return;
  }
  const list = filteredConcours();
  main.innerHTML = `
  <section class="stats">
    <button class="stat s-green" data-cq="encours"><span class="s-ico">${ICONS.flag}</span><span class="s-txt"><b>${enCours}</b><span>dossiers en lice</span></span><span class="s-chev">${ICONS.chevron}</span></button>
    <button class="stat s-orange" data-cq="limite"><span class="s-ico">${ICONS.clock}</span><span class="s-txt"><b>${lim30}</b><span>dates limites ≤ 30 j</span></span><span class="s-chev">${ICONS.chevron}</span></button>
    <button class="stat s-blue" data-cq="ouverts"><span class="s-ico">${ICONS.calendar}</span><span class="s-txt"><b>${ouverts}</b><span>concours ouverts</span></span><span class="s-chev">${ICONS.chevron}</span></button>
    <button class="stat s-red" data-cq="all"><span class="s-ico">${ICONS.stack}</span><span class="s-txt"><b>${all.length}</b><span>concours recensés</span></span><span class="s-chev">${ICONS.chevron}</span></button>
  </section>
  <section class="toolbar card">
    <div class="search">${ICONS.search}<input type="search" id="cq" placeholder="Rechercher un concours, un organisateur, un genre…" value="${esc(CF.q)}"></div>
    <button class="btn primary" id="cAdd">${ICONS.plus}Nouveau concours</button>
    <button class="btn btn-outline" id="cExport" title="Exporter la liste affichée">${ICONS.download}Export CSV</button>
    <div class="filters">
      <div class="fblock">
        <div class="fb-head"><span class="fb-title">${ICONS.flag}Mon statut</span><span class="fb-links"><button class="lnk" data-cst-all>tous</button> · <button class="lnk" data-cst-none>aucun</button></span></div>
        <div class="fchips">${C_ORDER.map(k => `<label class="fchip fc-${k} ${CF.statuts.includes(k) ? 'on' : ''}"><input type="checkbox" data-cst="${k}" ${CF.statuts.includes(k) ? 'checked' : ''}><span class="dot"></span>${CSTATUTS[k].label}<b>${counts.st[k] || 0}</b></label>`).join('')}</div>
      </div>
      <div class="fblock">
        <div class="fb-head"><span class="fb-title">${ICONS.calendar}Dépôts</span></div>
        <div class="fchips">${[['ouvert', 'Ouverts'], ['clos', 'Clos'], ['sansdate', 'Sans date']].map(([k, l]) => `<label class="fchip ${CF.periodes.includes(k) ? 'on' : ''}"><input type="checkbox" data-cper="${k}" ${CF.periodes.includes(k) ? 'checked' : ''}>${l}<b>${counts.per[k] || 0}</b></label>`).join('')}</div>
      </div>
      <div class="fblock">
        <div class="fb-head"><span class="fb-title">${ICONS.form}Critères</span></div>
        <div class="fchips">
          <label class="fchip ${CF.gratuit ? 'on' : ''}"><input type="checkbox" id="cfGratuit" ${CF.gratuit ? 'checked' : ''}>Gratuits uniquement</label>
          <label class="fchip ${CF.autoEd ? 'on' : ''}"><input type="checkbox" id="cfAutoEd" ${CF.autoEd ? 'checked' : ''}>Auto-édition acceptée</label>
        </div>
      </div>
    </div>
  </section>
  <section class="sortbar" role="group" aria-label="Trier">
    <span class="sort-lbl">Trier par</span>
    ${C_SORTS.map(s => `<button class="sort-btn ${CF.tri === s.k ? 'on' : ''}" data-ctri="${s.k}" title="${s.title}">${ICONS[s.icon]}<span>${s.label}</span></button>`).join('')}
  </section>
  <p class="count">${list.length} concours affiché${list.length > 1 ? 's' : ''}</p>
  <section class="list">
    <div class="row crow head">
      ${[['nom', 'Concours'], ['limite', 'Date limite'], ['resultats', 'Résultats'], ['frais', 'Frais']].map(([k, l]) => `<button class="th ${CF.tri === k ? 'on' : ''}" data-ctri="${k}">${l}${ICONS.sort}</button>`).join('')}<div>Dotation</div><div>Liens</div><div>Auteurs</div>
    </div>
    ${list.map(rowConcours).join('') || '<div class="empty-row">Aucun concours ne correspond aux filtres.</div>'}
  </section>`;

  $$('[data-ctri]').forEach(b => b.onclick = () => { CF.tri = b.dataset.ctri; saveCF(); render(); });
  $('#cq').addEventListener('input', e => { CF.q = e.target.value; saveCF(); const pos = e.target.selectionStart; renderConcours(); const n = $('#cq'); n.focus(); try { n.setSelectionRange(pos, pos); } catch {} });
  $$('input[data-cst]').forEach(i => i.onchange = () => { CF.statuts = $$('input[data-cst]:checked').map(x => x.dataset.cst); saveCF(); render(); });
  $$('input[data-cper]').forEach(i => i.onchange = () => { CF.periodes = $$('input[data-cper]:checked').map(x => x.dataset.cper); saveCF(); render(); });
  $('[data-cst-all]').onclick = () => { CF.statuts = C_ORDER.slice(); saveCF(); render(); };
  $('[data-cst-none]').onclick = () => { CF.statuts = []; saveCF(); render(); };
  $('#cfGratuit').onchange = e => { CF.gratuit = e.target.checked; saveCF(); render(); };
  $('#cfAutoEd').onchange = e => { CF.autoEd = e.target.checked; saveCF(); render(); };
  $('#cAdd').onclick = () => openConcours(null);
  $('#cExport').onclick = () => exportCsvConcours(list);
  $$('[data-cq]').forEach(b => b.onclick = () => {
    const k = b.dataset.cq;
    Object.assign(CF, { q: '', statuts: C_DEF_ST.slice(), periodes: C_ALL_PER.slice(), gratuit: false, autoEd: false, tri: 'limite' });
    if (k === 'encours') Object.assign(CF, { statuts: ['depose', 'selection'] });
    if (k === 'limite') Object.assign(CF, { statuts: ['a_etudier', 'preparation'], periodes: ['ouvert'] });
    if (k === 'ouverts') Object.assign(CF, { periodes: ['ouvert'] });
    if (k === 'all') Object.assign(CF, { statuts: C_ORDER.slice() });
    saveCF(); render();
  });
  $$('.row[data-cid]').forEach(r => r.addEventListener('click', e => { if (e.target.closest('a')) return; openConcours(r.dataset.cid); }));
}

function rowConcours(c) {
  const st = c._st, t = todayIso();
  const l = cLimite(c);
  let lim = '<span class="muted">—</span>';
  if (l) {
    const d = daysUntil(l.date);
    const cls = l.date < t ? 'lim past' : d <= 14 ? 'lim urgent' : d <= 30 ? 'lim soon' : 'lim';
    const tag = l.date < t ? (l.ancienne ? 'dernière connue' : 'clos') : d === 0 ? "aujourd'hui" : `J-${d}`;
    lim = `<span class="${cls}">${esc(fmtDate(l.date, false))}</span><div class="sub">${tag}${c.dateOuverture && c.dateOuverture > t ? ' · ouvre le ' + esc(fmtDate(c.dateOuverture, false)) : ''}</div>`;
  }
  const res = c.dateResultats ? `<span>${esc(fmtDate(c.dateResultats, false))}</span>` : '<span class="muted">—</span>';
  const pill = (href, cls, icon, label, title = '', ext = true) => `<a class="pill ${cls}" href="${esc(href)}" ${ext ? 'target="_blank" rel="noopener"' : ''} ${title ? `title="${esc(title)}"` : ''}>${icon}<span>${label}</span></a>`;
  const img = k => `<img src="${IMG[k]}" alt="" width="22" height="22">`;
  const links = [];
  if (c.reglement) links.push(pill(safeUrl(c.reglement), 'p-web', ICONS.form, 'Règlement'));
  if (c.site) links.push(pill(safeUrl(c.site), 'p-web', ICONS.globe, 'Site'));
  if (c.formulaire) links.push(pill(safeUrl(c.formulaire), 'p-web', ICONS.form, 'Dépôt'));
  if ((c.emails || []).length) links.push(pill('mailto:' + c.emails[0], 'p-mail', img('email'), 'Email', c.emails.join(', '), false));
  if (c.facebook) links.push(pill(safeUrl(c.facebook), 'p-fb', img('facebook'), 'Facebook'));
  if (c.instagram) links.push(pill(safeUrl(c.instagram), 'p-ig', img('instagram'), 'Insta'));
  const others = Object.entries(store.users).filter(([uid, u]) => uid !== me.uid && ['depose', 'selection', 'laureat'].includes(u.concours?.[c.id]?.statut))
    .map(([, u]) => { const s2 = u.concours[c.id].statut; return `<span class="mini-av c-${s2}" title="${esc(u.name)} — ${esc(CSTATUTS[s2].label)}">${esc(initials(u.name))}</span>`; });
  const sub = [c.organisateur, c.type].filter(Boolean).map(esc).join(' · ');
  const tags = [c.autoEdition === 'oui' ? '<span class="tag ok">auto-édition ✓</span>' : c.autoEdition === 'non' ? '<span class="tag no">éditeur requis</span>' : '', c.genres ? `<span class="tag">${esc(c.genres.length > 40 ? c.genres.slice(0, 38) + '…' : c.genres)}</span>` : ''].join('');
  return `<div class="row crow cst-${st}" data-cid="${esc(c.id)}" tabindex="0">
    <div class="c-name">
      <div class="name">${esc(c.nom || 'Sans nom')} ${myC(c.id).notes ? '<span class="note-dot" title="J\'ai des notes">✎</span>' : ''}</div>
      ${sub ? `<div class="salon-name nomarg">${sub}</div>` : ''}
      <div class="tags">${tags}<span class="badge cst-${st}">${CSTATUTS[st].short}</span></div>
    </div>
    <div class="c-lim"><span class="lbl">Date limite</span>${lim}</div>
    <div><span class="lbl">Résultats</span>${res}</div>
    <div class="frais ${fraisNum(c.frais) === 0 ? 'free' : ''}"><span class="lbl">Frais</span>${esc(fraisLabel(fraisNum(c.frais)))}</div>
    <div class="dot2"><span class="lbl">Dotation</span>${c.dotation ? esc(c.dotation) : '<span class="muted">—</span>'}</div>
    <div class="c-links">${links.join('') || '<span class="muted">—</span>'}</div>
    <div class="c-authors">${others.join('')}<button class="kebab" title="Ouvrir la fiche" aria-label="Ouvrir la fiche">${ICONS.dots}</button></div>
  </div>`;
}

function exportCsvConcours(list) {
  const cols = ['Concours', 'Organisateur', 'Type', 'Genres', 'Œuvres acceptées', 'Auto-édition', 'Zone', 'Frais (€)', 'Dotation', 'Ouverture', 'Date limite', 'Résultats', 'Mon statut', 'Œuvre proposée', 'Déposé le', 'Site', 'Règlement', 'Formulaire', 'Emails', 'Conditions', 'Modalités', 'Notes communes', 'Mes notes'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = list.map(c => { const m = myC(c.id); return [c.nom, c.organisateur, c.type, c.genres, c.formats, c.autoEdition, c.zone, fraisNum(c.frais), c.dotation, c.dateOuverture, c.dateLimite, c.dateResultats, CSTATUTS[c._st].label, m.oeuvre, m.dateDepot, c.site, c.reglement, c.formulaire, (c.emails || []).join(', '), c.conditions, c.modalites, c.notes, m.notes].map(q).join(';'); });
  download(`concours-${todayIso()}.csv`, '﻿' + [cols.map(q).join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
}

// ───────────── Fiche concours ─────────────
function openConcours(id) {
  let cid = id;
  const orig = id ? JSON.parse(JSON.stringify(allConcours()[id])) : {};
  const c = orig, m = id ? myC(id) : {};
  const st = m.statut || 'a_etudier';
  const others = id ? Object.entries(store.users).filter(([uid, u]) => uid !== me.uid && u.concours?.[id]?.statut && u.concours[id].statut !== 'a_etudier') : [];
  const histL = (c.historiqueLimites || []).filter(Boolean);
  openModal(`<div class="modal-inner salon-modal">
    <header class="m-head">
      <div>
        <h2 id="cTitle">${id ? esc(c.nom) + (c.organisateur ? ' <span class="m-sub">' + esc(c.organisateur) + '</span>' : '') : 'Nouveau concours'}</h2>
        <p class="muted">${id && c.majPar ? `Modifié par ${esc(c.majPar)} le ${esc(fmtDate((c.majLe || '').slice(0, 10), false))}` : id ? '' : 'Commence par le nom du concours : la fiche est créée et enregistrée automatiquement.'}</p>
      </div>
      <div class="m-right"><span class="save-state" id="cSave"></span>${id ? '<button type="button" class="btn btn-ia" id="cIaFiche" title="Chercher la prochaine édition avec ChatGPT">✨ IA</button>' : ''}<button type="button" class="x" data-close aria-label="Fermer">×</button></div>
    </header>

    <section class="mine" id="cMine">
      <h3>Mon suivi</h3>
      <div class="seg" id="cSeg">${C_ORDER.map(k => `<button type="button" data-st="${k}" class="cst-${k} ${k === st ? 'on' : ''}">${CSTATUTS[k].label}</button>`).join('')}</div>
      <div class="grid">
        <label>Œuvre proposée<input id="cOeuvre" value="${esc(m.oeuvre || '')}" placeholder="Titre du roman / manuscrit"></label>
        <label>Dossier déposé le<input id="cDepot" type="date" value="${esc(m.dateDepot || '')}"></label>
      </div>
      <label style="margin-top:.7rem"><span>Mes notes <span class="muted">(personnelles)</span></span>
        <textarea id="cNotes" rows="8" placeholder="Pièces à fournir, échanges, envoi postal, suivi…">${esc(m.notes || '')}</textarea></label>
      ${others.length ? `<div class="others"><h4>Les autres auteurs</h4>${others.map(([, u]) => `<span class="badge cst-${u.concours[id].statut}">${esc(u.name)} · ${CSTATUTS[u.concours[id].statut].short}</span>`).join(' ')}</div>` : ''}
    </section>

    <form id="cForm" class="salon-form" autocomplete="off">
      <h3>Le concours <span class="muted">(informations communes à tous)</span></h3>
      <div class="grid">
        <label class="span2">Nom du concours / prix<input name="nom" value="${esc(c.nom)}" required></label>
        <label>Organisateur<input name="organisateur" value="${esc(c.organisateur)}" placeholder="Association, éditeur, ville…"></label>
        <label>Type<input name="type" value="${esc(c.type)}" list="cTypes" placeholder="Prix littéraire, appel à manuscrits…"></label>
        <datalist id="cTypes">${C_TYPES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <label>Genres<input name="genres" value="${esc(c.genres)}" placeholder="Tous genres, imaginaire, polar…"></label>
        <label>Œuvres acceptées<input name="formats" value="${esc(c.formats)}" placeholder="Roman inédit, roman publié…"></label>
        <label>Auto-édition<select name="autoEdition"><option value="">Non précisé</option><option value="oui" ${c.autoEdition === 'oui' ? 'selected' : ''}>Acceptée</option><option value="non" ${c.autoEdition === 'non' ? 'selected' : ''}>Refusée (éditeur requis)</option></select></label>
        <label>Zone / public<input name="zone" value="${esc(c.zone)}" placeholder="France, francophonie, région…"></label>
        <label>Frais d'inscription (€)<input name="frais" type="number" min="0" step="0.5" value="${esc(fraisNum(c.frais) ?? '')}" placeholder="0 = gratuit"></label>
        <label>Dotation / récompense<input name="dotation" value="${esc(c.dotation)}" placeholder="1 500 € + publication…"></label>
      </div>
      <h3>Calendrier</h3>
      <div class="grid">
        <label>Ouverture des dépôts<input name="dateOuverture" type="date" value="${esc(c.dateOuverture)}"></label>
        <label>Date limite de dépôt<input name="dateLimite" type="date" value="${esc(c.dateLimite)}"></label>
        <label>Annonce des résultats<input name="dateResultats" type="date" value="${esc(c.dateResultats)}"></label>
        <label>Récurrence<input name="recurrence" value="${esc(c.recurrence)}" placeholder="Annuel, dépôts de janvier à mars…"></label>
        <div class="hist small muted span2">${histL.length ? 'Dates limites précédentes : ' + histL.map(d => esc(fmtDate(d, false))).join(', ') : ''}</div>
      </div>
      <h3>Conditions & dépôt</h3>
      <div class="grid">
        <label class="span2">Conditions de participation<textarea name="conditions" rows="3" placeholder="Âge, nombre de signes, premier roman, résidence…">${esc(c.conditions)}</textarea></label>
        <label class="span2">Modalités de dépôt<textarea name="modalites" rows="2" placeholder="En ligne, par email, envoi postal en X exemplaires…">${esc(c.modalites)}</textarea></label>
      </div>
      <h3>Liens & contacts</h3>
      <div class="grid">
        <label>Site<input name="site" value="${esc(c.site)}" placeholder="https://"></label>
        <label>Règlement<input name="reglement" value="${esc(c.reglement)}" placeholder="https://… (PDF du règlement)"></label>
        <label>Formulaire / plateforme de dépôt<input name="formulaire" value="${esc(c.formulaire)}" placeholder="https://"></label>
        <label><span>Email(s) <span class="muted">(séparés par des virgules)</span></span><input name="emails" value="${esc((c.emails || []).join(', '))}"></label>
        <label>Facebook<input name="facebook" value="${esc(c.facebook)}" placeholder="https://facebook.com/…"></label>
        <label>Instagram<input name="instagram" value="${esc(c.instagram)}" placeholder="https://instagram.com/…"></label>
      </div>
      <h3>Notes communes</h3>
      <textarea name="notes" rows="4" placeholder="Retours d'expérience, conseils, précisions… (visible par tous les auteurs)">${esc(c.notes)}</textarea>
      <div class="actions m-foot">
        <span class="muted small">Tout est enregistré automatiquement.</span>
        <div class="grow"></div>
        <button type="button" class="btn danger" id="cDel" ${id ? '' : 'hidden'}>Supprimer</button>
        <button type="button" class="btn primary" data-close>Terminé</button>
      </div>
    </form>
  </div>`);

  const form = $('#cForm'); form.onsubmit = e => e.preventDefault();
  const stateEl = $('#cSave');
  const v = n => form[n].value.trim();
  function collect() {
    const p = {
      nom: v('nom'), organisateur: v('organisateur'), type: v('type'), genres: v('genres'), formats: v('formats'), autoEdition: form.autoEdition.value,
      zone: v('zone'), frais: v('frais') === '' ? null : +v('frais'), dotation: v('dotation'),
      dateOuverture: v('dateOuverture'), dateLimite: v('dateLimite'), dateResultats: v('dateResultats'), recurrence: v('recurrence'),
      conditions: form.conditions.value.trim(), modalites: form.modalites.value.trim(),
      site: v('site'), reglement: v('reglement'), formulaire: v('formulaire'), emails: v('emails').split(/[,;]\s*/).map(x => x.trim()).filter(Boolean),
      facebook: v('facebook'), instagram: v('instagram'), notes: form.notes.value.trim(),
    };
    const hl = [...(orig.historiqueLimites || [])];
    if (orig.dateLimite && orig.dateLimite !== p.dateLimite && !hl.includes(orig.dateLimite)) hl.push(orig.dateLimite);
    p.historiqueLimites = hl.sort();
    return p;
  }
  let creating = null;
  function ensureId() {
    if (cid) return Promise.resolve(cid);
    if (creating) return creating;
    const p = collect();
    if (!p.nom) return Promise.resolve(null);
    creating = store.saveConcours(null, p).then(k => { cid = k; $('#cDel').hidden = false; return k; }).finally(() => { creating = null; });
    return creating;
  }
  const saveInfos = autosave(form, async () => {
    const p = collect();
    if (!p.nom) return false;
    if (!cid) await ensureId(); else await store.saveConcours(cid, p);
    $('#cTitle').innerHTML = esc(p.nom) + (p.organisateur ? ' <span class="m-sub">' + esc(p.organisateur) + '</span>' : '');
  }, stateEl);
  onModalClose(saveInfos);

  const mineEl = $('#cMine');
  const saveMine = autosave(mineEl, async () => {
    const k = await ensureId();
    if (!k) { stateEl.textContent = 'Indique d\'abord le nom du concours'; return false; }
    await store.setMineConcours(k, { oeuvre: $('#cOeuvre').value.trim(), dateDepot: $('#cDepot').value, notes: $('#cNotes').value });
  }, stateEl);
  onModalClose(saveMine);

  $$('#cSeg button').forEach(b => b.onclick = async () => {
    const k = await ensureId();
    if (!k) { toast('Indique d\'abord le nom du concours'); return; }
    $$('#cSeg button').forEach(x => x.classList.toggle('on', x === b));
    const patch = { statut: b.dataset.st };
    if (b.dataset.st === 'depose' && !$('#cDepot').value) { $('#cDepot').value = todayIso(); patch.dateDepot = todayIso(); }
    await store.setMineConcours(k, patch);
    stateEl.textContent = 'Statut : ' + CSTATUTS[b.dataset.st].label + ' ✓'; stateEl.className = 'save-state ok';
  });
  if ($('#cIaFiche')) $('#cIaFiche').onclick = async () => { await saveInfos(); await saveMine(); iaConcoursFiche(cid); };
  $('#cDel').onclick = async () => {
    if (!confirm(`Supprimer « ${v('nom')} » pour tous les auteurs ?`)) return;
    closeHooks = [];
    await store.deleteConcours(cid); modal.close(); toast('Concours supprimé');
  };
  if (!id) setTimeout(() => form.nom.focus(), 50);
}

// ───────────── Recherche IA — concours ─────────────
const C_GENRES = ['Tous genres', 'Imaginaire / fantasy / SF', 'Polar / thriller', 'Littérature générale', 'Romance', 'Jeunesse / young adult', 'Historique', 'Nouvelles'];
const C_FORMATS = { inedit: 'Manuscrit inédit', publie: 'Roman publié (maison d\'édition)', autoedite: 'Roman auto-édité' };
const C_ZONES = { france: 'France', francophonie: 'Francophonie (France, Belgique, Suisse, Québec…)', hdf: 'Hauts-de-France et régions voisines' };
const CIA_KEY = 'salons-du-livre-ia-concours';
let CIA = { mode: 'nouveaux', genres: ['Tous genres'], formats: ['inedit', 'publie', 'autoedite'], zone: 'france', gratuit: false, horizon: 12, exclHS: true, sansDate: true, sel: null, refs: {}, prompt: '', reponse: '', resultat: null, erreur: '' };
try { Object.assign(CIA, JSON.parse(localStorage.getItem(CIA_KEY)) || {}); } catch {}
const saveCIA = () => { try { const { resultat, ...rest } = CIA; localStorage.setItem(CIA_KEY, JSON.stringify(rest)); } catch {} };

function renderCIA() {
  if (store.concoursError) { $('#main').innerHTML = concoursRulesHelp(); return; }
  $('#main').innerHTML = `
  <section class="ia-switch">
    <button class="ia-tab ${CIA.mode === 'nouveaux' ? 'on' : ''}" data-cmode="nouveaux">${ICONS.search}<span><b>Trouver de nouveaux concours</b><small>Prix, concours et appels à manuscrits pas encore recensés</small></span></button>
    <button class="ia-tab ${CIA.mode === 'maj' ? 'on' : ''}" data-cmode="maj">${ICONS.calendar}<span><b>Mettre à jour les concours clos</b><small>Trouver la prochaine édition et les nouvelles dates</small></span></button>
  </section>
  <div id="iaBody"></div>`;
  $$('[data-cmode]').forEach(b => b.onclick = () => {
    if (CIA.mode === b.dataset.cmode) return;
    Object.assign(CIA, { mode: b.dataset.cmode, prompt: '', reponse: '', resultat: null, erreur: '' });
    saveCIA(); renderCIA();
  });
  CIA.mode === 'maj' ? renderCIAMaj() : renderCIANouveaux();
}

function renderCIANouveaux() {
  const chip = (attr, val, label, on) => `<label class="check chip ${on ? 'on' : ''}"><input type="checkbox" ${attr}="${esc(val)}" ${on ? 'checked' : ''}>${esc(label)}</label>`;
  $('#iaBody').innerHTML = `
  <section class="card ia-step">
    <div class="step-n">1</div>
    <div class="step-body">
      <h3>Que cherches-tu ?</h3>
      <p class="fb-title" style="margin:.6rem 0 .1rem">Genres</p>
      <div class="regions">${C_GENRES.map(g => chip('data-g', g, g, CIA.genres.includes(g))).join('')}</div>
      <p class="fb-title" style="margin:.8rem 0 .1rem">Œuvre à proposer</p>
      <div class="regions">${Object.entries(C_FORMATS).map(([k, l]) => chip('data-f', k, l, CIA.formats.includes(k))).join('')}</div>
      <p class="fb-title" style="margin:.8rem 0 .1rem">Zone</p>
      <div class="regions">${Object.entries(C_ZONES).map(([k, l]) => `<label class="check chip ${CIA.zone === k ? 'on' : ''}"><input type="radio" name="czone" value="${k}" ${CIA.zone === k ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>
      <div class="actions">
        <label class="check"><input type="checkbox" id="ciaGratuit" ${CIA.gratuit ? 'checked' : ''}> Concours gratuits uniquement</label>
        <span class="grow"></span>
        <label class="inline">Date limite dans les <select id="ciaHorizon">${[3, 6, 12, 18].map(n => `<option ${CIA.horizon === n ? 'selected' : ''}>${n}</option>`).join('')}</select> prochains mois</label>
      </div>
    </div>
  </section>
  ${iaStepsHtml(CIA)}`;
  $$('[data-g]').forEach(i => i.onchange = () => {
    if (i.checked) $$('[data-g]').forEach(x => { if (x !== i && (i.dataset.g === 'Tous genres' || x.dataset.g === 'Tous genres')) x.checked = false; });
    if (!$$('[data-g]:checked').length) $('[data-g="Tous genres"]').checked = true;
    CIA.genres = $$('[data-g]:checked').map(x => x.dataset.g); saveCIA();
    $$('[data-g]').forEach(x => x.parentElement.classList.toggle('on', x.checked));
  });
  $$('[data-f]').forEach(i => i.onchange = () => { CIA.formats = $$('[data-f]:checked').map(x => x.dataset.f); saveCIA(); i.parentElement.classList.toggle('on', i.checked); });
  $$('input[name=czone]').forEach(i => i.onchange = () => { CIA.zone = i.value; saveCIA(); $$('input[name=czone]').forEach(x => x.parentElement.classList.toggle('on', x.checked)); });
  $('#ciaGratuit').onchange = e => { CIA.gratuit = e.target.checked; saveCIA(); };
  $('#ciaHorizon').onchange = e => { CIA.horizon = +e.target.value; saveCIA(); };
  bindIASteps(buildPromptCNouveaux, parseCNouveaux, CIA, saveCIA, renderCIA);
  renderCResultNouveaux();
}

const C_JSON_FIELDS = `      "nom": "Nom du concours ou du prix",
      "organisateur": "association, éditeur, collectivité…",
      "type": "Prix littéraire | Concours d'écriture | Appel à manuscrits | Concours de nouvelles | Premier roman | Résidence / bourse",
      "genres": "genres acceptés",
      "formats": "œuvres acceptées (roman inédit, roman publié, auto-édité…)",
      "autoEdition": "oui | non | non précisé",
      "zone": "France, francophonie, région…",
      "frais": "montant en euros, 0 si gratuit, vide si inconnu",
      "dotation": "récompense (montant, publication, contrat…)",
      "dateOuverture": "AAAA-MM-JJ ou vide",
      "dateLimite": "AAAA-MM-JJ (date limite de dépôt)",
      "dateResultats": "AAAA-MM-JJ ou vide",
      "recurrence": "annuel, biennal…",
      "conditions": "conditions de participation essentielles (2 phrases max)",
      "modalites": "comment déposer (en ligne, email, papier en X exemplaires…)",
      "site": "URL",
      "reglement": "URL du règlement",
      "formulaire": "URL de la plateforme ou du formulaire de dépôt",
      "emails": ["..."],
      "source": "URL où l'information a été trouvée",
      "confiance": "haute | moyenne | faible"`;

function buildPromptCNouveaux() {
  if (!CIA.formats.length) { toast('Coche au moins un type d\'œuvre'); return ''; }
  const t = todayIso(), fin = addMonths(t, CIA.horizon);
  const connus = Object.values(allConcours()).map(c => `- ${c.nom}${c.organisateur ? ' — ' + c.organisateur : ''}`).sort();
  const genres = CIA.genres.length && !CIA.genres.includes('Tous genres') ? CIA.genres.join(', ') + ' (ou concours tous genres)' : 'tous genres';
  return `Tu es un assistant de veille pour des auteurs de romans (souvent auto-édités ou publiés par de petites maisons d'édition) qui cherchent des concours et prix littéraires auxquels candidater.

MISSION : utilise la recherche web pour trouver des CONCOURS D'ÉCRITURE, PRIX LITTÉRAIRES ouverts aux candidatures, APPELS À MANUSCRITS et prix du premier roman dont la DATE LIMITE DE DÉPÔT se situe entre le ${fmtDate(t, false)} et le ${fmtDate(fin, false)}.
ZONE : ${C_ZONES[CIA.zone]}.
GENRES : ${genres}.
ŒUVRES À PROPOSER : ${CIA.formats.map(k => C_FORMATS[k]).join(', ')}.${CIA.gratuit ? '\nFRAIS : uniquement les concours GRATUITS (sans frais d\'inscription).' : ''}

CRITÈRES :
- La candidature doit pouvoir être faite par l'auteur lui-même (exclure les prix où seuls les éditeurs proposent des livres, sauf si c'est explicitement ouvert aux auteurs).
- Indique clairement si les livres auto-édités sont acceptés.
- Privilégie les sources officielles : site de l'organisateur, règlement PDF, annuaires de prix littéraires, sites de maisons d'édition.
- N'invente rien : laisse un champ vide si l'information n'est pas trouvée. Donne la source (URL) de chaque concours.

CONCOURS DÉJÀ CONNUS (à NE PAS redonner) :
${connus.join('\n') || '(aucun)'}

FORMAT DE RÉPONSE : réponds UNIQUEMENT avec un bloc de code JSON valide, sans texte autour, exactement de cette forme :
\`\`\`json
{
  "concours": [
    {
${C_JSON_FIELDS}
    }
  ]
}
\`\`\`
Donne le plus de concours possible (vise 15 à 30), classés par date limite.`;
}

function findExistingConcours(n) {
  const STOP = new Set(['prix', 'concours', 'litteraire', 'litteraires', 'roman', 'romans', 'des', 'les', 'du', 'de', 'la', 'le', 'ecriture', 'edition', 'appel', 'manuscrits', 'manuscrit', 'premier']);
  const words = w => norm(w).replace(/[’']/g, ' ').split(/[^a-z0-9]+/).filter(x => x.length > 2 && !STOP.has(x) && !/^\d+$/.test(x));
  const wn = words(n.nom);
  return Object.entries(allConcours()).find(([, c]) => {
    if (norm(c.nom) === norm(n.nom)) return true;
    const wc = words(c.nom);
    const common = wn.filter(w => wc.includes(w)).length;
    return common >= 2 || (common >= 1 && wn.length <= 2 && wc.length <= 2) || (common >= 1 && n.organisateur && norm(c.organisateur) === norm(n.organisateur));
  });
}
function concoursFromJson(x) {
  const ae = norm(x.autoEdition);
  return {
    nom: str(x.nom), organisateur: str(x.organisateur), type: str(x.type), genres: str(x.genres), formats: str(x.formats),
    autoEdition: ae.startsWith('oui') ? 'oui' : ae.startsWith('non') && !ae.includes('precis') ? 'non' : '',
    zone: str(x.zone), frais: fraisNum(x.frais), dotation: str(x.dotation),
    dateOuverture: normDate(x.dateOuverture), dateLimite: normDate(x.dateLimite), dateResultats: normDate(x.dateResultats),
    recurrence: str(x.recurrence), conditions: str(x.conditions), modalites: str(x.modalites),
    site: str(x.site), reglement: str(x.reglement), formulaire: str(x.formulaire), emails: arr(x.emails || x.email),
    facebook: str(x.facebook), instagram: str(x.instagram),
  };
}
function parseCNouveaux(j) {
  const list = Array.isArray(j) ? j : (j.concours || j.resultats || []);
  if (!list.length) throw new Error('La réponse ne contient aucun concours.');
  return list.map((x, i) => {
    const n = { ...concoursFromJson(x), source: str(x.source), confiance: norm(x.confiance), _k: i };
    const dup = findExistingConcours(n);
    n._dup = dup ? { id: dup[0], nom: dup[1].nom } : null;
    n._on = !dup && !!n.nom && n.confiance !== 'faible' && !(n.dateLimite && n.dateLimite < todayIso());
    return n;
  }).filter(n => n.nom);
}

function renderCResultNouveaux() {
  const box = $('#iaResult'); const R = CIA.resultat;
  if (!R) { box.innerHTML = ''; return; }
  const nb = R.filter(n => n._on).length;
  box.innerHTML = `
  <section class="card ia-step">
    <div class="step-n">4</div>
    <div class="step-body">
      <h3>${R.length} concours proposé${R.length > 1 ? 's' : ''} — coche ceux à ajouter</h3>
      <p class="muted">Ceux qui ressemblent à un concours déjà recensé, ou dont la date limite est passée, sont décochés.</p>
      <div class="actions"><button class="btn small ghost" id="rAll">Tout cocher</button><button class="btn small ghost" id="rNone">Tout décocher</button></div>
      <div class="ia-list">
        ${R.map(n => `<label class="ia-item ${n._on ? 'on' : ''} ${n._dup ? 'dup' : ''}">
          <input type="checkbox" data-k="${n._k}" ${n._on ? 'checked' : ''}>
          <div class="ia-main">
            <div class="ia-title"><b>${esc(n.nom)}</b>${n.organisateur ? ' · ' + esc(n.organisateur) : ''} ${n.confiance ? `<span class="conf c-${esc(n.confiance)}">${CONF[n.confiance] || esc(n.confiance)}</span>` : ''}</div>
            <div class="ia-meta">${n.dateLimite ? ICONS.hourglass + ' limite ' + esc(fmtDate(n.dateLimite, false)) : '<span class="warn-text">date limite non trouvée</span>'}${n.dateResultats ? ' · résultats ' + esc(fmtDate(n.dateResultats, false)) : ''} · ${esc(fraisLabel(n.frais))}${n.autoEdition === 'oui' ? ' · auto-édition ✓' : n.autoEdition === 'non' ? ' · éditeur requis' : ''}</div>
            <div class="ia-meta">${[n.type, n.genres, n.formats, n.zone].filter(Boolean).map(esc).join(' · ')}</div>
            ${n.dotation ? `<div class="ia-desc">🏆 ${esc(n.dotation)}</div>` : ''}
            ${n.conditions ? `<div class="ia-desc">${esc(n.conditions)}</div>` : ''}
            <div class="ia-meta">${['site', 'reglement', 'formulaire'].filter(k => n[k]).map(k => `<a href="${esc(safeUrl(n[k]))}" target="_blank" rel="noopener">${k === 'reglement' ? 'règlement' : k}</a>`).join(' ')} ${n.source ? `<a href="${esc(safeUrl(n.source))}" target="_blank" rel="noopener">source</a>` : ''}</div>
            ${n._dup ? `<div class="dup-note">Ressemble à « ${esc(n._dup.nom)} » déjà recensé</div>` : ''}
          </div>
        </label>`).join('')}
      </div>
      <div class="actions ia-apply"><button class="btn primary" id="rApply" ${nb ? '' : 'disabled'}>${ICONS.plus}Ajouter <span id="rNb">${nb}</span> concours à la base</button><span class="muted small" id="rState"></span></div>
    </div>
  </section>`;
  const upd = () => { const k = R.filter(n => n._on).length; $('#rNb').textContent = k; $('#rApply').disabled = !k; };
  $$('.ia-item input', box).forEach(i => i.onchange = () => { R[R.findIndex(n => n._k === +i.dataset.k)]._on = i.checked; i.closest('.ia-item').classList.toggle('on', i.checked); upd(); });
  $('#rAll').onclick = () => { R.forEach(n => n._on = true); renderCResultNouveaux(); };
  $('#rNone').onclick = () => { R.forEach(n => n._on = false); renderCResultNouveaux(); };
  $('#rApply').onclick = async () => {
    const todo = R.filter(n => n._on);
    $('#rApply').disabled = true;
    let done = 0;
    for (const n of todo) {
      $('#rState').textContent = `Ajout ${done + 1}/${todo.length}…`;
      const { _k, _on, _dup, source, confiance, ...data } = n;
      data.historiqueLimites = [];
      data.notes = source ? `Trouvé par recherche IA le ${fmtDate(todayIso(), false)} — source : ${source}` : '';
      data.origine = 'Recherche IA';
      await store.saveConcours(null, data);
      done++;
    }
    CIA.resultat = null; CIA.reponse = ''; saveCIA();
    toast(`${done} concours ajouté${done > 1 ? 's' : ''}`);
    setView('c-liste');
  };
}

// Mise à jour des concours clos
function candidatsCMaj() {
  const t = todayIso();
  return Object.entries(allConcours()).map(([id, c]) => ({ id, ...c }))
    .filter(c => {
      if (CIA.exclHS && ['hors_sujet'].includes(myCSt(c.id))) return false;
      if (!c.dateLimite) return CIA.sansDate;
      return c.dateLimite < t;
    })
    .sort((a, b) => (a.dateLimite || '0').localeCompare(b.dateLimite || '0'));
}
function renderCIAMaj() {
  const cands = candidatsCMaj();
  if (!CIA.sel) CIA.sel = cands.slice(0, 20).map(c => c.id);
  const sel = new Set(CIA.sel.filter(id => cands.some(c => c.id === id)));
  $('#iaBody').innerHTML = `
  <section class="card ia-step">
    <div class="step-n">1</div>
    <div class="step-body">
      <h3>Concours à vérifier <span class="muted">(date limite passée${CIA.sansDate ? ' ou inconnue' : ''})</span></h3>
      <div class="actions">
        <label class="check"><input type="checkbox" id="ciaHS" ${CIA.exclHS ? 'checked' : ''}> Exclure mes « hors sujet »</label>
        <label class="check"><input type="checkbox" id="ciaND" ${CIA.sansDate ? 'checked' : ''}> Inclure les concours sans date limite</label>
      </div>
      <div class="actions"><button class="btn small ghost" id="sAll">Tout cocher</button><button class="btn small ghost" id="s20">Les 20 premiers</button><button class="btn small ghost" id="sNone">Tout décocher</button>
        <span class="muted small"><b id="selNb">${sel.size}</b> / ${cands.length} sélectionnés — ChatGPT est plus fiable par lots de 15 à 20.</span></div>
      <div class="cand-list">
        ${cands.map(c => `<label class="cand ${sel.has(c.id) ? 'on' : ''}"><input type="checkbox" value="${esc(c.id)}" ${sel.has(c.id) ? 'checked' : ''}>
          <span class="c-v"><b>${esc(c.nom)}</b></span>
          <span class="c-n">${esc(c.organisateur || '')}</span>
          <span class="c-d">${c.dateLimite ? 'limite : ' + esc(fmtDate(c.dateLimite, false)) : '<i>sans date</i>'}</span></label>`).join('') || '<p class="muted" style="padding:.8rem">Aucun concours à mettre à jour : toutes les dates limites sont à venir.</p>'}
      </div>
    </div>
  </section>
  ${iaStepsHtml(CIA)}`;
  const setSel = ids => { CIA.sel = ids; saveCIA(); renderCIA(); };
  $('#ciaHS').onchange = e => { CIA.exclHS = e.target.checked; CIA.sel = null; saveCIA(); renderCIA(); };
  $('#ciaND').onchange = e => { CIA.sansDate = e.target.checked; CIA.sel = null; saveCIA(); renderCIA(); };
  $('#sAll').onclick = () => setSel(cands.map(c => c.id));
  $('#s20').onclick = () => setSel(cands.slice(0, 20).map(c => c.id));
  $('#sNone').onclick = () => setSel([]);
  $$('.cand input').forEach(i => i.onchange = () => {
    i.parentElement.classList.toggle('on', i.checked);
    CIA.sel = $$('.cand input:checked').map(x => x.value); saveCIA();
    $('#selNb').textContent = CIA.sel.length;
  });
  bindIASteps(() => {
    const ids = (CIA.sel || []).filter(id => allConcours()[id]);
    if (!ids.length) { toast('Coche au moins un concours'); return ''; }
    const r = promptCMaj(ids); CIA.refs = r.refs; saveCIA(); return r.prompt;
  }, j => parseCMaj(j, CIA.refs), CIA, saveCIA, renderCIA);
  renderCResultMaj();
}
function promptCMaj(ids) {
  const refs = {};
  const lignes = ids.map((id, i) => {
    const ref = 'C' + (i + 1); refs[ref] = id;
    const c = allConcours()[id];
    const liens = [c.site, c.reglement].filter(Boolean).join(' ; ');
    return `${ref} | ${c.nom}${c.organisateur ? ' | organisé par ' + c.organisateur : ''} | dernière date limite connue : ${c.dateLimite ? fmtDate(c.dateLimite, false) : 'inconnue'}${liens ? ' | liens connus : ' + liens : ''}`;
  });
  return { refs, prompt: `Tu es un assistant de veille pour des auteurs de romans qui candidatent à des concours et prix littéraires.

MISSION : pour chacun des concours ci-dessous, utilise la recherche web pour trouver la PROCHAINE ÉDITION (date limite de dépôt postérieure au ${fmtDate(todayIso(), false)}) : dates d'ouverture, date limite, date des résultats, frais, dotation, conditions, règlement et contacts à jour.
Privilégie les sources officielles et récentes (site de l'organisateur, règlement PDF de l'année).
N'invente rien : si la prochaine édition n'est pas encore annoncée, mets "trouve": false et explique brièvement dans "commentaire" (ex. « édition 2027 non publiée, dépôts habituellement de janvier à mars »). Si le concours semble arrêté, indique-le.

CONCOURS (garde la référence Cx dans ta réponse) :
${lignes.join('\n')}

FORMAT DE RÉPONSE : réponds UNIQUEMENT avec un bloc de code JSON valide, sans texte autour, avec une entrée par concours :
\`\`\`json
{
  "resultats": [
    {
      "ref": "C1",
      "trouve": true,
      "dateOuverture": "AAAA-MM-JJ ou vide",
      "dateLimite": "AAAA-MM-JJ",
      "dateResultats": "AAAA-MM-JJ ou vide",
      "frais": "montant en euros, 0 si gratuit, vide si inconnu",
      "dotation": "récompense ou vide",
      "autoEdition": "oui | non | non précisé",
      "conditions": "conditions essentielles si elles ont changé, sinon vide",
      "modalites": "modalités de dépôt si elles ont changé, sinon vide",
      "site": "URL ou vide",
      "reglement": "URL du règlement de la nouvelle édition ou vide",
      "formulaire": "URL de dépôt ou vide",
      "emails": ["..."],
      "commentaire": "précisions utiles",
      "source": "URL où l'information a été trouvée",
      "confiance": "haute | moyenne | faible"
    }
  ]
}
\`\`\`` };
}
const C_MAJ_FIELDS = [
  ['dateOuverture', 'Ouverture des dépôts', 'date'], ['dateLimite', 'Date limite', 'date'], ['dateResultats', 'Résultats', 'date'],
  ['frais', 'Frais', 'num'], ['dotation', 'Dotation'], ['autoEdition', 'Auto-édition'],
  ['conditions', 'Conditions'], ['modalites', 'Modalités de dépôt'],
  ['site', 'Site'], ['reglement', 'Règlement'], ['formulaire', 'Formulaire de dépôt'], ['emails', 'Emails (ajout)', 'list'],
];
function parseCMaj(j, refs) {
  const list = Array.isArray(j) ? j : (j.resultats || j.concours || []);
  if (!list.length) throw new Error('La réponse ne contient aucun résultat.');
  const t = todayIso();
  return list.map((x, i) => {
    const id = refs[str(x.ref).toUpperCase()] || (Object.keys(refs).length === 1 ? Object.values(refs)[0] : null);
    const c = id && allConcours()[id];
    const r = { _k: i, ref: str(x.ref), id, trouve: x.trouve !== false && x.trouve !== 'false', commentaire: str(x.commentaire), source: str(x.source), confiance: norm(x.confiance), changes: [] };
    if (!c) return r;
    const val = concoursFromJson(x);
    for (const [k, label, type] of C_MAJ_FIELDS) {
      const nv = val[k];
      if (nv == null || nv === '' || (Array.isArray(nv) && !nv.length)) continue;
      if (type === 'list') {
        const cur = (c[k] || []).map(norm);
        const add = nv.filter(v => !cur.includes(norm(v)));
        if (add.length) r.changes.push({ k, label, type, old: (c[k] || []).join(', '), neu: add, on: true });
        continue;
      }
      const old = type === 'num' ? fraisNum(c[k]) : (c[k] || '');
      if (type === 'num' ? old === nv : norm(old) === norm(nv)) continue;
      let on = r.confiance !== 'faible', warn = '';
      if (type === 'date' && nv < t && k !== 'dateOuverture') { on = false; warn = 'date déjà passée'; }
      r.changes.push({ k, label, type, old: old ?? '', neu: nv, on, warn });
    }
    r.noteOn = !!(r.commentaire || r.source);
    return r;
  });
}
async function applyCMaj(r) {
  const on = r.changes.filter(c => c.on);
  if (!on.length && !r.noteOn) return false;
  const c = allConcours()[r.id]; if (!c) return false;
  const patch = {};
  for (const ch of on) patch[ch.k] = ch.type === 'list' ? [...(c[ch.k] || []), ...ch.neu] : ch.neu;
  if (patch.dateLimite && c.dateLimite && patch.dateLimite !== c.dateLimite) {
    const hl = [...(c.historiqueLimites || [])]; if (!hl.includes(c.dateLimite)) hl.push(c.dateLimite); patch.historiqueLimites = hl.sort();
  }
  if (r.noteOn && (r.commentaire || r.source)) patch.notes = [c.notes, noteText(r)].filter(Boolean).join('\n');
  await store.saveConcours(r.id, patch);
  return true;
}
const cHeading = r => { const c = allConcours()[r.id] || {}; return `<b>${esc(c.nom)}</b>${c.organisateur ? ' · ' + esc(c.organisateur) : ''}`; };
function renderCResultMaj() {
  const box = $('#iaResult'); const R = CIA.resultat;
  if (!R) { box.innerHTML = ''; return; }
  const found = R.filter(r => r.id && r.changes.length);
  const rest = R.filter(r => !(r.id && r.changes.length));
  box.innerHTML = `
  <section class="card ia-step">
    <div class="step-n">4</div>
    <div class="step-body">
      <h3>${found.length} concours avec des informations nouvelles — coche ce que tu veux conserver</h3>
      <div class="ia-list">${found.map(r => majCardHtml(r, true, cHeading(r))).join('') || '<p class="muted">Aucune information nouvelle à appliquer.</p>'}</div>
      ${rest.length ? `<details class="ia-rest"><summary>${rest.length} concours sans nouvelle information</summary><ul>
        ${rest.map(r => { const c = r.id && allConcours()[r.id]; return `<li><b>${c ? esc(c.nom) : esc(r.ref) + ' (référence inconnue)'}</b> — ${esc(r.commentaire || (r.trouve ? 'rien de nouveau' : 'prochaine édition non trouvée'))}${r.source ? ` <a href="${esc(safeUrl(r.source))}" target="_blank" rel="noopener">source</a>` : ''}</li>`; }).join('')}
      </ul></details>` : ''}
      <div class="actions ia-apply"><button class="btn primary" id="mApply">Appliquer les mises à jour cochées</button><span class="muted small" id="mState"></span></div>
    </div>
  </section>`;
  $$('.maj-card', box).forEach(card => bindMajCard(card, R.find(x => x._k === +card.dataset.k), renderCResultMaj));
  $('#mApply').onclick = async () => {
    $('#mApply').disabled = true;
    let n = 0;
    for (const r of found) { if (await applyCMaj(r)) n++; }
    CIA.resultat = null; CIA.reponse = ''; CIA.sel = null; saveCIA();
    toast(`${n} concours mis à jour`);
    renderCIA();
  };
}
function iaConcoursFiche(id) {
  const c = allConcours()[id]; if (!c) return;
  const { prompt, refs } = promptCMaj([id]);
  iaPopup({ subtitle: c.nom + (c.organisateur ? ' · ' + c.organisateur : ''), prompt, parse: j => parseCMaj(j, refs), apply: applyCMaj, back: () => openConcours(id), emptyMsg: 'Aucune nouvelle date ni information trouvée', heading: cHeading });
}

boot();
