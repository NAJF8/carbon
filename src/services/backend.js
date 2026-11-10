import { staticAdapter } from './adapters/static.js';

const env = import.meta.env;
const isFirebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);

/**
 * Adapter selection:
 *   1. Firebase configured via VITE_FIREBASE_*  → real backend (production-capable)
 *   2. `vite dev`                                → local preview sandbox (not secure, never shipped)
 *   3. otherwise                                 → static read-only site, admin unavailable
 */
let adapterPromise;
export function getAdapter() {
  adapterPromise ||= (async () => {
    if (isFirebaseConfigured) return (await import('./adapters/firebase.js')).firebaseAdapter;
    if (import.meta.env.DEV) return (await import('./adapters/localPreview.js')).localPreviewAdapter;
    return staticAdapter;
  })();
  return adapterPromise;
}
