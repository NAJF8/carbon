import { fetchStaticCatalog, normalizeCatalog, COLLECTIONS, CONFIG_KEYS } from '../contract.js';

/**
 * Firebase adapter (Auth + Firestore + Storage). Activated when VITE_FIREBASE_* variables are present.
 * SDK is loaded lazily so it never weighs down builds that don't use it.
 *
 * Security model (enforced by firestore.rules / storage.rules, NOT by this client code):
 *  - everyone can read catalog data
 *  - only users with a document in `admins/{uid}` AND a verified email can write
 *  - a user can never grant themselves admin (admins/* is not client-writable)
 *
 * NOTE: written against the modular Firebase v12+/v13 API; verify against a live project
 * (see README → "Backend setup"). It has not been exercised against a real Firebase project yet.
 */
const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
};
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let sdkPromise;
function sdk() {
  sdkPromise ||= (async () => {
    const [{ initializeApp }, A, F, S] = await Promise.all([
      import('firebase/app'), import('firebase/auth'), import('firebase/firestore'), import('firebase/storage'),
    ]);
    const app = initializeApp(firebaseConfig);
    return { A, F, S, auth: A.getAuth(app), db: F.getFirestore(app), storage: S.getStorage(app) };
  })();
  return sdkPromise;
}

async function resolveUser(fb, u) {
  if (!u) return null;
  let isAdmin = false;
  try {
    // 1. Check custom claims from Firebase Auth ID token
    const tokenResult = await u.getIdTokenResult();
    if (tokenResult?.claims?.admin === true) {
      isAdmin = true;
    } else {
      // 2. Check server-side document in /admins/{uid} with email verification
      const snap = await fb.F.getDoc(fb.F.doc(fb.db, 'admins', u.uid));
      isAdmin = snap.exists() && u.emailVerified;
    }
  } catch { isAdmin = false; }
  return { uid: u.uid, email: u.email, emailVerified: u.emailVerified, isAdmin };
}

export const firebaseAdapter = {
  kind: 'firebase',
  writable: true,
  async load() {
    const fb = await sdk();
    const base = await fetchStaticCatalog(); // defaults for config docs that don't exist yet
    const out = { ...base };
    await Promise.all([
      ...COLLECTIONS.map(async (c) => {
        const snap = await fb.F.getDocs(fb.F.collection(fb.db, c));
        if (!snap.empty) out[c] = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        else if (c === 'products' || c === 'offers' || c === 'coupons' || c === 'banners' || c === 'brands') out[c] = [];
      }),
      ...CONFIG_KEYS.map(async (k) => {
        const snap = await fb.F.getDoc(fb.F.doc(fb.db, 'config', k));
        if (snap.exists()) out[k] = snap.data();
      }),
    ]);
    return normalizeCatalog(out);
  },
  async upsert(col, item) {
    const fb = await sdk();
    await fb.F.setDoc(fb.F.doc(fb.db, col, item.id), item);
  },
  async remove(col, id) {
    const fb = await sdk();
    await fb.F.deleteDoc(fb.F.doc(fb.db, col, id));
  },
  async setConfig(key, value) {
    const fb = await sdk();
    await fb.F.setDoc(fb.F.doc(fb.db, 'config', key), value);
  },
  async uploadImage(file, folder = 'products') {
    const fb = await sdk();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const r = fb.S.ref(fb.storage, `uploads/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    await fb.S.uploadBytes(r, file, { contentType: file.type });
    return fb.S.getDownloadURL(r);
  },
  auth: {
    kind: 'firebase',
    available: true,
    subscribe(cb) {
      let off = () => {};
      sdk().then((fb) => { off = fb.A.onAuthStateChanged(fb.auth, async (u) => cb(await resolveUser(fb, u))); });
      return () => off();
    },
    async signIn({ email, password, google } = {}) {
      const fb = await sdk();
      if (google) return fb.A.signInWithPopup(fb.auth, new fb.A.GoogleAuthProvider());
      return fb.A.signInWithEmailAndPassword(fb.auth, email, password);
    },
    async signOut() { const fb = await sdk(); await fb.A.signOut(fb.auth); },
    async resetPassword(email) { const fb = await sdk(); await fb.A.sendPasswordResetEmail(fb.auth, email); },
  },
};
