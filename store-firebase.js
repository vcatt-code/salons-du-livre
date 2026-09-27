// Stockage partagé — Firebase Authentication + Cloud Firestore.
const V = '10.12.2';
const BASE = `https://www.gstatic.com/firebasejs/${V}`;

export async function createFirebaseStore(config) {
  const { initializeApp } = await import(`${BASE}/firebase-app.js`);
  const A = await import(`${BASE}/firebase-auth.js`);
  const F = await import(`${BASE}/firebase-firestore.js`);

  const app = initializeApp(config);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);

  const data = { salons: {}, users: {}, sources: {} };
  let unsubs = [];
  let current = null;
  let listeners;

  function subscribe(onData, onError) {
    unsubs.forEach(u => u()); unsubs = [];
    for (const name of ['salons', 'users', 'sources']) {
      unsubs.push(F.onSnapshot(F.collection(db, name), snap => {
        const obj = {};
        snap.forEach(d => { obj[d.id] = d.data(); });
        data[name] = obj;
        onData();
      }, err => onError(err)));
    }
  }

  const nowIso = () => new Date().toISOString();

  return {
    mode: 'firebase',
    start(l) {
      listeners = l;
      A.onAuthStateChanged(auth, async user => {
        if (!user) { current = null; unsubs.forEach(u => u()); unsubs = []; l.onAuth(null); return; }
        const needsVerify = user.providerData.some(p => p.providerId === 'password') && !user.emailVerified;
        if (needsVerify) { current = null; l.onAuth(null, { unverified: user.email }); return; }
        current = { uid: user.uid, name: user.displayName || user.email.split('@')[0], email: user.email };
        try {
          const ref = F.doc(db, 'users', user.uid);
          const snap = await F.getDoc(ref);
          if (!snap.exists()) await F.setDoc(ref, { name: current.name, email: user.email, salons: {} });
          else current.name = snap.data().name || current.name;
        } catch (e) { l.onError(e); return; }
        l.onAuth(current);
        subscribe(l.onData, l.onError);
      });
    },
    get salons() { return data.salons; },
    get users() { return data.users; },
    get sources() { return data.sources; },

    async loginGoogle() { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); },
    async loginEmail(email, pwd) { await A.signInWithEmailAndPassword(auth, email, pwd); },
    async signupEmail(email, pwd, name) {
      const cred = await A.createUserWithEmailAndPassword(auth, email, pwd);
      if (name) await A.updateProfile(cred.user, { displayName: name });
      await A.sendEmailVerification(cred.user);
    },
    async resendVerification() { if (auth.currentUser) await A.sendEmailVerification(auth.currentUser); },
    async reloadUser() { if (auth.currentUser) { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); location.reload(); } },
    async resetPassword(email) { await A.sendPasswordResetEmail(auth, email); },
    async logout() { await A.signOut(auth); },
    async setProfile(patch) {
      await F.setDoc(F.doc(db, 'users', current.uid), patch, { merge: true });
      Object.assign(current, patch); listeners.onAuth(current);
    },

    async saveSalon(id, payload) {
      const ref = id ? F.doc(db, 'salons', id) : F.doc(F.collection(db, 'salons'));
      const extra = { majLe: nowIso(), majPar: current.name };
      if (!id) extra.creePar = current.name;
      await F.setDoc(ref, { ...payload, ...extra }, { merge: true });
      return ref.id;
    },
    async deleteSalon(id) { await F.deleteDoc(F.doc(db, 'salons', id)); },
    async setMine(salonId, patch) {
      await F.setDoc(F.doc(db, 'users', current.uid), { salons: { [salonId]: { ...patch, maj: nowIso() } } }, { merge: true });
    },
    async saveSource(id, payload) {
      const ref = id ? F.doc(db, 'sources', id) : F.doc(F.collection(db, 'sources'));
      const extra = id ? {} : { ajoutePar: current.name, ajouteLe: nowIso() };
      await F.setDoc(ref, { ...payload, ...extra }, { merge: true });
    },
    async deleteSource(id) { await F.deleteDoc(F.doc(db, 'sources', id)); },
    async importSeed(seed, applyToMe) {
      const mine = {};
      const chunks = [];
      let batch = F.writeBatch(db), n = 0;
      for (const s of seed.salons) {
        const { id, _import, ...rest } = s;
        batch.set(F.doc(db, 'salons', id), { ...rest, historiqueLimites: [], historiqueEditions: [], creePar: 'Import initial', majLe: nowIso() });
        if (applyToMe && _import && (_import.statut !== 'a_etudier' || _import.notes)) mine[id] = { statut: _import.statut, notes: _import.notes || '', maj: nowIso() };
        if (++n % 400 === 0) { chunks.push(batch); batch = F.writeBatch(db); }
      }
      for (const src of seed.sources) batch.set(F.doc(F.collection(db, 'sources')), { ...src, ajoutePar: 'Import initial', ajouteLe: nowIso() });
      batch.set(F.doc(db, 'users', current.uid), { salons: mine }, { merge: true });
      chunks.push(batch);
      for (const b of chunks) await b.commit();
    },
  };
}
