import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

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
export const auth = getAuth(firebaseApp);

// Persistent cache: reads work offline and writes queue until the phone is back online.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
