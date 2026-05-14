/**
 * Firebase Auth — NATIVE implementation using the Firebase JS SDK.
 *
 * Uses the same JS SDK as firebaseAuth.web.ts to avoid native module
 * dependencies (RNFBAppModule / @react-native-firebase/auth) that require
 * a full native rebuild.  The JS SDK works on iOS/Android without any
 * additional native linking.
 *
 * Metro resolves this file on iOS/Android; firebaseAuth.web.ts is used on web.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  type User as FirebaseUser,
  type Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence removed from firebase/auth v12 — dynamic require for v9/v10 compat
const getReactNativePersistence: ((storage: any) => any) | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('firebase/auth').getReactNativePersistence ?? null;
  } catch {
    return null;
  }
})();
import * as AppleAuthentication from 'expo-apple-authentication';

// ── Firebase config (same project as web) ────────────────────────────────────
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

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return _app;
}

function getAuthInstance(): Auth {
  if (!_auth) {
    const app = getApp();
    try {
      // React Native needs AsyncStorage persistence — without it
      // onAuthStateChanged never fires and the app freezes on splash.
      const persistenceOption = getReactNativePersistence
        ? { persistence: getReactNativePersistence(AsyncStorage) }
        : {};
      _auth = initializeAuth(app, persistenceOption);
    } catch {
      // initializeAuth throws if auth was already initialised (e.g. HMR).
      // Fall back to the existing auth instance.
      _auth = getAuth(app);
    }
  }
  return _auth;
}

function wrap(u: FirebaseUser) {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    getIdToken: (forceRefresh?: boolean) => u.getIdToken(forceRefresh),
  };
}

// ── Email / Password ──────────────────────────────────────────────────────────

export async function registerWithEmail(email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(
    getAuthInstance(),
    email.trim().toLowerCase(),
    password,
  );
  return wrap(user);
}

export async function loginWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(
    getAuthInstance(),
    email.trim().toLowerCase(),
    password,
  );
  return wrap(user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthInstance(), email.trim().toLowerCase());
}

// ── Google Sign-In ────────────────────────────────────────────────────────────
// Lazy-requires GoogleSignin so the module loads even if the native module
// is absent in dev builds.

export async function signInWithGoogle() {
  let GoogleSignin: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch {
    throw new Error('Google Sign-In not available. Please use a native build.');
  }

  // configure() must be called before any other GoogleSignin method.
  // webClientId = OAuth 2.0 Web client from google-services.json (client_type: 3)
  GoogleSignin.configure({
    webClientId: '113578995852-q3q4pvclfgctr8sgeof3olblm7tchhve.apps.googleusercontent.com',
    offlineAccess: false,
  });

  await GoogleSignin.hasPlayServices();
  // v16+: returns { type: 'success', data } | { type: 'cancelled' }
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success') return null; // user cancelled

  const idToken = result.data.idToken;
  if (!idToken) throw new Error('Google idToken is missing');

  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(getAuthInstance(), credential);
  return wrap(user);
}

// ── Apple Sign-In (iOS only) ──────────────────────────────────────────────────

export async function signInWithApple() {
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!appleCredential.identityToken) throw new Error('Apple identityToken is missing');

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: appleCredential.identityToken });
  const { user } = await signInWithCredential(getAuthInstance(), credential);
  return wrap(user);
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  try {
    await fbSignOut(getAuthInstance());
  } catch {}
}

export function getCurrentUser() {
  try {
    const u = getAuthInstance().currentUser;
    return u ? wrap(u) : null;
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    const u = getAuthInstance().currentUser;
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
    return fbOnAuthStateChanged(getAuthInstance(), (u) =>
      callback(u ? wrap(u) : null),
    );
  } catch {
    // Fire callback immediately so the app never stays stuck on splash.
    callback(null);
    return () => {};
  }
}

// ── Error helpers ─────────────────────────────────────────────────────────────

export { getAuthErrorMessage } from './firebaseAuthErrors';
