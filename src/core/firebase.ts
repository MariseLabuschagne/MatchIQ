import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Firebase web config. These values identify the project and are safe to ship in the
// client; access is controlled by Firestore security rules (see firestore.rules).
const firebaseConfig = {
  apiKey: "AIzaSyAo3hGXzAcscs3hgShblwdpsZnTJreFUmM",
  authDomain: "matchiq-9f263.firebaseapp.com",
  projectId: "matchiq-9f263",
  storageBucket: "matchiq-9f263.firebasestorage.app",
  messagingSenderId: "525622971619",
  appId: "1:525622971619:web:b48fb6ceecef26f286c9d6",
  measurementId: "G-KZLK2XXNQQ"
};

export const firebaseApp = initializeApp(firebaseConfig);

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

// App Check: proves requests come from this website, not a copied config (same set-up as Court Order).
// Off until a reCAPTCHA Enterprise site key is registered for the MatchIQ domains; paste it here.
// Only on the published site, never on localhost or the emulators. The site key is public, like the config.
const APP_CHECK_SITE_KEY = "";
if (APP_CHECK_SITE_KEY && import.meta.env.PROD && !useEmulators) {
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(firebaseApp);

// Persistent cache: reads work offline and writes queue until the phone is back online.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
