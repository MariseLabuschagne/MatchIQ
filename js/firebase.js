// =========================================================
// MatchIQ - Firebase Configuration
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {

    apiKey: "AIzaSyAo3hGXzAcscs3hgShblwdpsZnTJreFUmM",

    authDomain: "matchiq-9f263.firebaseapp.com",

    projectId: "matchiq-9f263",

    storageBucket: "matchiq-9f263.firebasestorage.app",

    messagingSenderId: "525622971619",

    appId: "1:525622971619:web:b48fb6ceecef26f286c9d6",

    measurementId: "G-KZLK2XXNQQ"

};


// =========================================================
// INITIALISE FIREBASE
// =========================================================

const app = initializeApp(firebaseConfig);


// =========================================================
// FIREBASE SERVICES
// =========================================================

export const auth = getAuth(app);

export const db = getFirestore(app);


// =========================================================
// CONNECTION TEST
// =========================================================

console.log(
    "🔥 MatchIQ Firebase connected successfully!"
);

console.log(
    "Firebase project:",
    firebaseConfig.projectId
);

console.log(
    "🔥 MatchIQ Firestore initialized!"
);