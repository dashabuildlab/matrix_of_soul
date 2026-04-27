/**
 * Firebase Auth — WEB implementation (firebase JS SDK).
 * Mirrors the API surface of `firebaseAuth.ts` (native) so callers don't care
 * which platform they run on.
 *
 * Metro auto-resolves this file on web (Platform.OS === 'web') due to `.web.ts`
 * extension. On native, `firebaseAuth.ts` is used instead.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
  type User as FirebaseWebUser,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCl5ODdkLWUdwLfoLqe1zH4np4zxzb3eWg',
  authDomain: 'matrix-of-destiny-and-tarot.firebaseapp.com',
  projectId: 'matrix-of-destiny-and-tarot',
  storageBucket: 'matrix-of-destiny-and-tarot.firebasestorage.app',
  messagingSenderId: '113578995852',
  appId: '1:113578995852:web:6cc1368ee5b89e58ef0ba9',
  measurementId: 'G-PYF31EFTRV',
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _persistenceSet = false;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return _app;
}

function auth(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp());
    // Survive page reload
    if (!_persistenceSet) {
      setPersistence(_auth, browserLocalPersistence).catch(() => {});
      _persistenceSet = true;
    }
  }
  return _auth;
}

// Shape a web User so native callers (which only touch .uid / .displayName /
// .email / .getIdToken) keep working.
function wrap(u: FirebaseWebUser) {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    getIdToken: (forceRefresh?: boolean) => u.getIdToken(forceRefresh),
  };
}

// ── Email / Password ──────────────────────────────────────────────────────────

export async function registerWithEmail(email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth(), email.trim().toLowerCase(), password);
  return wrap(user);
}

export async function loginWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth(), email.trim().toLowerCase(), password);
  return wrap(user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth(), email.trim().toLowerCase());
}

// ── Google Sign-In (popup) ────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await signInWithPopup(auth(), provider);
  return wrap(user);
}

// ── Apple Sign-In (popup) ─────────────────────────────────────────────────────
// Requires a Service ID + return URL configured in Apple Developer portal AND
// linked in Firebase Console → Authentication → Sign-in method → Apple.

export async function signInWithApple() {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const { user } = await signInWithPopup(auth(), provider);
  return wrap(user);
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  try {
    await fbSignOut(auth());
  } catch {}
}

export function getCurrentUser() {
  try {
    const u = auth().currentUser;
    return u ? wrap(u) : null;
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    const u = auth().currentUser;
    if (!u) return null;
    return await u.getIdToken();
  } catch {
    return null;
  }
}

export function onAuthStateChanged(
  callback: (user: ReturnType<typeof wrap> | null) => void,
): () => void {
  try {
    return fbOnAuthStateChanged(auth(), (u) => callback(u ? wrap(u) : null));
  } catch {
    return () => {};
  }
}

// ── Error helpers ─────────────────────────────────────────────────────────────

export { getAuthErrorMessage } from './firebaseAuthErrors';
