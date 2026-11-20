// =========================================================
// MatchIQ - Firebase Authentication
// =========================================================

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    reload
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth, db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// =========================================================
// MATCHIQ ROLES
// =========================================================

const MATCHIQ_ROLES = {
    ADMINISTRATOR: "administrator",
    COACH: "coach",
    PARENT: "parent",
    SCORER: "scorer"
};

// =========================================================
// ELEMENTS
// =========================================================

function get(id) {
    return document.getElementById(id);
}


// =========================================================
// SCREEN CONTROL
// =========================================================

function showAuthScreen() {

    get("authScreen").style.display = "flex";
    get("homeScreen").style.display = "none";

}


function showHomeScreen() {

    get("authScreen").style.display = "none";
    get("homeScreen").style.display = "";

}


function showMessage(message) {

    get("authMessage").textContent = message;

}


function clearMessage() {

    get("authMessage").textContent = "";

}


// =========================================================
// LOGIN FORM
// =========================================================

function showLogin() {

    clearMessage();

    get("authTitle").textContent = "Welcome to MatchIQ";

    get("loginForm").style.display = "block";
    get("registerForm").style.display = "none";
    get("verificationForm").style.display = "none";

}


// =========================================================
// REGISTER FORM
// =========================================================

function showRegister() {

    clearMessage();

    get("authTitle").textContent = "Create MatchIQ Account";

    get("loginForm").style.display = "none";
    get("registerForm").style.display = "block";
    get("verificationForm").style.display = "none";

}


// =========================================================
// REGISTER
// =========================================================

async function register() {

    clearMessage();

    const name =
    get("registerName").value.trim();

    const email =
        get("registerEmail").value.trim();

    const password =
        get("registerPassword").value;

    const confirmPassword =
        get("registerPasswordConfirm").value;


    if (!name || !email || !password || !confirmPassword) {

        showMessage("Please complete all fields.");
        return;

    }


    if (password !== confirmPassword) {

        showMessage("The passwords do not match.");
        return;

    }


    if (password.length < 6) {

        showMessage("Password must be at least 6 characters.");
        return;

    }


    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // ---------------------------------------------------------
        // Create MatchIQ user profile
        // ---------------------------------------------------------

        await setDoc(
            doc(db, "users", user.uid),
            {
                name: name,
                email: user.email,
                role: MATCHIQ_ROLES.PARENT,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );


        // ---------------------------------------------------------
        // Send verification email
        // ---------------------------------------------------------

        await sendEmailVerification(user);

        console.log(
            "MatchIQ account created:",
            user.uid
        );

        showVerificationScreen(user);

    } catch (error) {

        console.error("Registration error:", error);

        showMessage(getFirebaseErrorMessage(error));

    }

}


// =========================================================
// VERIFICATION SCREEN
// =========================================================

function showVerificationScreen(user) {

    get("authTitle").textContent =
        "Verify your email";

    get("verificationEmail").textContent =
        user.email;

    get("loginForm").style.display = "none";
    get("registerForm").style.display = "none";
    get("verificationForm").style.display = "block";

    showMessage(
        "We've sent you a verification email."
    );

}


// =========================================================
// LOGIN
// =========================================================

async function login() {

    clearMessage();

    const email =
        get("loginEmail").value.trim();

    const password =
        get("loginPassword").value;


    if (!email || !password) {

        showMessage("Please enter your email and password.");
        return;

    }


    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // Refresh Firebase user information
        await reload(user);


        if (!auth.currentUser.emailVerified) {

            showVerificationScreen(auth.currentUser);

            return;

        }


        console.log(
            "MatchIQ login successful:",
            auth.currentUser.uid
        );

        showHomeScreen();

    } catch (error) {

        console.error("Login error:", error);

        showMessage(getFirebaseErrorMessage(error));

    }

}


// =========================================================
// CHECK EMAIL VERIFICATION
// =========================================================

async function checkVerification() {

    clearMessage();

    if (!auth.currentUser) {

        showLogin();
        return;

    }


    try {

        await reload(auth.currentUser);

        if (auth.currentUser.emailVerified) {

            showMessage(
                "Email verified successfully!"
            );

            setTimeout(() => {

                showHomeScreen();

            }, 800);

        } else {

            showMessage(
                "Your email has not been verified yet. Please click the link in your email."
            );

        }

    } catch (error) {

        console.error(
            "Verification check error:",
            error
        );

        showMessage(
            "Unable to check verification status."
        );

    }

}


// =========================================================
// RESEND VERIFICATION
// =========================================================

async function resendVerification() {

    clearMessage();

    if (!auth.currentUser) {

        showLogin();
        return;

    }


    try {

        await sendEmailVerification(
            auth.currentUser
        );

        showMessage(
            "A new verification email has been sent."
        );

    } catch (error) {

        console.error(
            "Resend verification error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );

    }

}


// =========================================================
// FORGOT PASSWORD
// =========================================================

async function forgotPassword() {

    clearMessage();

    const email =
        get("loginEmail").value.trim();


    if (!email) {

        showMessage(
            "Please enter your email address first."
        );

        return;

    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        showMessage(
            "Password reset email sent. Please check your inbox."
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );

    }

}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    try {

        await signOut(auth);

        window.MatchIQUser = null;

        showAuthScreen();

        showLogin();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            "Unable to log out. Please try again."
        );

    }

}
// =========================================================
// LOAD MATCHIQ USER PROFILE
// =========================================================

async function loadUserProfile(user) {

    try {

        const profileRef = doc(
            db,
            "users",
            user.uid
        );

        const profileSnapshot =
            await getDoc(profileRef);


        if (!profileSnapshot.exists()) {

            console.error(
                "MatchIQ user profile does not exist."
            );

            return null;
        }


        const profile =
            profileSnapshot.data();


        console.log(
            "MatchIQ user profile loaded:",
            profile
        );


        // Store for use throughout MatchIQ
        window.MatchIQUser = {

            uid: user.uid,

            email: user.email,

            emailVerified: user.emailVerified,

            name: profile.name,

            role: profile.role

        };


        return window.MatchIQUser;


    } catch (error) {

        console.error(
            "Unable to load MatchIQ user profile:",
            error
        );

        return null;

    }

}

// =========================================================
// ROLE CHECK
// =========================================================

function hasRole(role) {

    return (
        window.MatchIQUser &&
        window.MatchIQUser.role === role
    );
}

// =========================================================
// DISPLAY USER PROFILE
// =========================================================

function displayUserProfile(profile) {

    const welcome =
        get("userWelcome");

    const role =
        get("userRole");


    if (!welcome || !role) {
        return;
    }


    welcome.textContent =
        `Welcome, ${profile.name}`;


    const roleNames = {

        administrator: "Administrator",

        coach: "Coach",

        parent: "Parent",

        scorer: "Scorer"

    };


    role.textContent =
        roleNames[profile.role] || profile.role;
}

// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.MatchIQUser = null;

        showAuthScreen();

        showLogin();

        return;
    }


    try {

        // Refresh Firebase user information
        await reload(user);


        // User exists but has not verified email
        if (!auth.currentUser.emailVerified) {

            showAuthScreen();

            showVerificationScreen(
                auth.currentUser
            );

            return;
        }


        // Load MatchIQ Firestore profile
        const profile =
            await loadUserProfile(
                auth.currentUser
            );


        if (!profile) {

            showAuthScreen();

            showMessage(
                "Unable to load your MatchIQ profile."
            );

            return;
        }


        // Everything is good
        displayUserProfile(profile);

        showHomeScreen();

        console.log(
            "Welcome to MatchIQ,",
            profile.name
        );

        console.log(
            "MatchIQ role:",
            profile.role
        );


    } catch (error) {

        console.error(
            "Authentication state error:",
            error
        );

        showAuthScreen();

        showMessage(
            "Unable to load your MatchIQ account."
        );

    }

});

// =========================================================
// FIREBASE ERROR TRANSLATION
// =========================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "An account with this email already exists.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "The password is too weak.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "No MatchIQ account was found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        default:
            return "Something went wrong. Please try again.";

    }

}


// =========================================================
// MAKE AVAILABLE TO MATCHIQ HTML
// =========================================================

window.MatchIQAuth = {

    login,
    register,
    showLogin,
    showRegister,
    checkVerification,
    resendVerification,
    forgotPassword,
    logout

};