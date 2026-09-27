// Stockage local (navigateur) — utilisé tant que Firebase n'est pas configuré.
const KEY = 'salons-du-livre-v1';

async function hash(str) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381; for (const c of str) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
  }
}

export function createLocalStore() {
  let db = load();
  let listeners = { onAuth: () => {}, onData: () => {} };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || blank(); } catch { return blank(); }
  }
  function blank() { return { salons: {}, users: {}, sources: {}, currentUid: null }; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
    listeners.onData();
  }
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const me = () => (db.currentUid && db.users[db.currentUid]) ? { uid: db.currentUid, name: db.users[db.currentUid].name } : null;

  return {
    mode: 'local',
    start(l) { listeners = l; l.onAuth(me()); l.onData(); },
    get salons() { return db.salons; },
    get users() { return db.users; },
    get sources() { return db.sources; },
    // profils locaux
    listProfiles() { return Object.entries(db.users).map(([id, u]) => ({ uid: id, name: u.name, hasPwd: !!u.pwd })); },
    async selectProfile(id, pwd) {
      const u = db.users[id];
      if (u.pwd && u.pwd !== await hash(id + ':' + pwd)) return false;
      db.currentUid = id; persist(); listeners.onAuth(me()); return true;
    },
    async createProfile(name, pwd) {
      const id = uid(); db.users[id] = { name, salons: {}, pwd: pwd ? await hash(id + ':' + pwd) : '' };
      db.currentUid = id; persist(); listeners.onAuth(me());
    },
    async logout() { db.currentUid = null; persist(); listeners.onAuth(null); },
    async setProfile(patch) { Object.assign(db.users[db.currentUid], patch); persist(); listeners.onAuth(me()); },

    async saveSalon(id, data) {
      id = id || uid();
      db.salons[id] = { ...(db.salons[id] || {}), ...data, majLe: new Date().toISOString(), majPar: me()?.name || '' };
      persist(); return id;
    },
    async deleteSalon(id) { delete db.salons[id]; persist(); },
    async setMine(salonId, patch) {
      const u = db.users[db.currentUid]; u.salons = u.salons || {};
      u.salons[salonId] = { ...(u.salons[salonId] || {}), ...patch, maj: new Date().toISOString() };
      persist();
    },
    async saveSource(id, data) {
      id = id || uid();
      db.sources[id] = { ...(db.sources[id] || {}), ...data, ajoutePar: db.sources[id]?.ajoutePar || me()?.name || '', ajouteLe: db.sources[id]?.ajouteLe || new Date().toISOString() };
      persist();
    },
    async deleteSource(id) { delete db.sources[id]; persist(); },
    async importSeed(seed, applyToMe) {
      const u = db.users[db.currentUid]; u.salons = u.salons || {};
      for (const s of seed.salons) {
        const { id, _import, ...rest } = s;
        db.salons[id] = { ...rest, historiqueLimites: [], historiqueEditions: [], creePar: 'Import initial', majLe: new Date().toISOString() };
        if (applyToMe && _import && (_import.statut !== 'a_etudier' || _import.notes)) u.salons[id] = { statut: _import.statut, notes: _import.notes || '' };
      }
      for (const src of seed.sources) db.sources[uid()] = { ...src, ajoutePar: 'Import initial', ajouteLe: new Date().toISOString() };
      persist();
    },
  };
}
