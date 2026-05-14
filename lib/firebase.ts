/**
 * lib/firebase.ts
 *
 * Firebase Auth wrapper with Expo Go stub.
 * @react-native-firebase/* is a native module — it crashes Expo Go when
 * imported at the top level, so we lazy-require it inside an IIFE.
 * In a real (native/EAS) build the real Firebase module is returned;
 * in Expo Go the stub is used and UI still renders correctly.
 */

// ── Lazy require ─────────────────────────────────────────────────────────────
const _authMod = (() => {
  try {
    return require('@react-native-firebase/auth');
  } catch {
    return null;
  }
})();

// ── Stub for Expo Go ──────────────────────────────────────────────────────────
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

type Unsubscribe = () => void;

interface AuthInstance {
  signInWithEmailAndPassword(email: string, password: string): Promise<{ user: FirebaseUser }>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: FirebaseUser }>;
  signInWithCredential(credential: any): Promise<{ user: FirebaseUser }>;
  signOut(): Promise<void>;
  onAuthStateChanged(cb: (user: FirebaseUser | null) => void): Unsubscribe;
  readonly currentUser: FirebaseUser | null;
}

const _stub: AuthInstance = {
  signInWithEmailAndPassword: async () => {
    throw new Error('Firebase requires a native build (not available in Expo Go)');
  },
  createUserWithEmailAndPassword: async () => {
    throw new Error('Firebase requires a native build (not available in Expo Go)');
  },
  signInWithCredential: async () => {
    throw new Error('Firebase requires a native build (not available in Expo Go)');
  },
  signOut: async () => {},
  onAuthStateChanged: (cb) => {
    // Immediately signal "no user" so the app routes to login
    cb(null);
    return () => {};
  },
  get currentUser() {
    return null;
  },
};

/** Returns the active Firebase Auth instance (real or stub). */
export function getAuth(): AuthInstance {
  if (_authMod?.default) {
    return _authMod.default() as AuthInstance;
  }
  return _stub;
}

// ── Provider credential helpers ───────────────────────────────────────────────
export const GoogleAuthProvider = {
  credential(idToken: string, accessToken?: string): any {
    if (_authMod?.GoogleAuthProvider) {
      return _authMod.GoogleAuthProvider.credential(idToken, accessToken);
    }
    return { providerId: 'google.com', idToken, accessToken };
  },
};

export const AppleAuthProvider = {
  credential(identityToken: string, rawNonce?: string): any {
    if (_authMod?.AppleAuthProvider) {
      return _authMod.AppleAuthProvider.credential(identityToken, rawNonce);
    }
    return { providerId: 'apple.com', identityToken, rawNonce };
  },
};
