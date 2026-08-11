// =========================================================
// MatchIQ - Firebase
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAo3hGXzAcscs3hgShblwdpsZnTJreFUmM",
    authDomain: "matchiq-9f263.firebaseapp.com",
    projectId: "matchiq-9f263",
    storageBucket: "matchiq-9f263.firebasestorage.app",
    messagingSenderId: "525622971619",
    appId: "1:525622971619:web:b48fb6ceecef26f286c9d6",
    measurementId: "G-KZLK2XXNQQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

console.log("🔥 MatchIQ Firebase connected successfully!");
console.log("Firebase project:", firebaseConfig.projectId);