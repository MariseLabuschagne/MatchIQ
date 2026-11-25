import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { clearActive, takeIdleNotice } from "./idle";
import { BuiltBy } from "../ui/components";

function friendly(code: string): string {
  switch (code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/email-already-in-use": return "An account with this email already exists. Log in instead.";
    case "auth/weak-password": return "Use a password of at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Email or password is incorrect.";
    case "auth/too-many-requests": return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed": return "No connection. Check your signal and try again.";
    default: return "Something went wrong. Please try again.";
  }
}

type Mode = "login" | "register" | "forgot";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(() =>
    takeIdleNotice() ? { text: "You were logged out after 12 hours without use. Log in again to carry on.", ok: true } : null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    clearActive(false); // a fresh sign-in starts the 12-hour clock again
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ text: friendly((e as { code?: string }).code ?? "") });
    } finally {
      setBusy(false);
    }
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (mode === "login") {
      if (!email || !password) return setMsg({ text: "Enter your email and password." });
      run(async () => { await signInWithEmailAndPassword(auth, email.trim(), password); });
    } else if (mode === "register") {
      if (!name.trim() || !email || !password) return setMsg({ text: "Please complete all fields." });
      if (password !== confirm) return setMsg({ text: "The passwords do not match." });
      run(async () => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, "users", cred.user.uid), {
          name: name.trim(), email: cred.user.email, role: "parent", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        await sendEmailVerification(cred.user);
      });
    } else {
      if (!email) return setMsg({ text: "Enter your email address." });
      run(async () => {
        await sendPasswordResetEmail(auth, email.trim());
        setMsg({ text: "Check your email for a link to reset your password.", ok: true });
      });
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <img className="auth-logo" src="./matchiq-logo.jpeg" alt="MatchIQ" />
        <h2>{mode === "login" ? "Log in" : mode === "register" ? "Create account" : "Reset password"}</h2>
        {mode === "register" && (
          <label className="field">Your name<input id="reg-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
        )}
        <label className="field">Email<input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== "forgot" && (
          <label className="field">Password<input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        )}
        {mode === "register" && (
          <label className="field">Confirm password<input id="reg-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        )}
        {msg && <p className={`message${msg.ok ? " ok" : ""}`}>{msg.text}</p>}
        <button className="btn primary block" disabled={busy} type="submit">
          {mode === "login" ? "Log in" : mode === "register" ? "Create account" : "Send reset link"}
        </button>
        <div className="spread">
          {mode !== "login" ? (
            <button type="button" className="link" onClick={() => setMode("login")}>Back to log in</button>
          ) : (
            <button type="button" className="link" onClick={() => setMode("register")}>Create an account</button>
          )}
          {mode === "login" && <button type="button" className="link" onClick={() => setMode("forgot")}>Forgot password?</button>}
        </div>
        <BuiltBy onLight />
      </form>
    </div>
  );
}

export function VerifyScreen() {
  const { user, refresh, logout } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <img className="auth-logo" src="./matchiq-logo.jpeg" alt="MatchIQ" />
        <h2>Check your email</h2>
        <p className="muted">We sent a verification link to {user?.email}. Open it, then come back and tap the button below.</p>
        {msg && <p className="message">{msg}</p>}
        <button className="btn primary block" onClick={async () => { await refresh(); if (!auth.currentUser?.emailVerified) setMsg("Not verified yet. Open the link in the email first."); }}>I've verified my email</button>
        <button className="btn block" onClick={async () => { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); setMsg("Verification email sent again."); } }}>Send the email again</button>
        <button className="link" onClick={() => logout()}>Use a different account</button>
        <BuiltBy onLight />
      </div>
    </div>
  );
}
