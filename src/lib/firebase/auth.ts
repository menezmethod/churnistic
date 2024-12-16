import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
  User,
  onAuthStateChanged,
  UserCredential,
  Auth,
  Unsubscribe,
  AuthError
} from 'firebase/auth';
import { auth } from './config';

interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

interface SignOutResponse {
  error: AuthError | null;
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
};

// Sign in with GitHub
export const signInWithGithub = async (): Promise<AuthResponse> => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
};

// Sign out
export const signOut = async (): Promise<SignOutResponse> => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
}; 