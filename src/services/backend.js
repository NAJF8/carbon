import { localPreviewAdapter } from './adapters/localPreview.js';

const env = import.meta.env;
const isFirebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);

/**
 * Adapter selection:
 * In this frontend-only phase, we default to the Frontend Demo / Local Management UI adapter (`localPreviewAdapter`).
 * If Firebase credentials are intentionally provided in .env, it can load the Firebase adapter.
 * Otherwise, the entire store and Admin demo run in high-quality local frontend mode with localStorage persistence.
 */
let adapterPromise;
export function getAdapter() {
  adapterPromise ||= (async () => {
    if (isFirebaseConfigured) {
      try {
        return (await import('./adapters/firebase.js')).firebaseAdapter;
      } catch (err) {
        console.warn('Firebase failed to load, falling back to local demo adapter:', err);
      }
    }
    return localPreviewAdapter;
  })();
  return adapterPromise;
}
