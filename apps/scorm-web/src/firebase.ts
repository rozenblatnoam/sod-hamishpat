import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const app = initializeApp({
  apiKey: 'AIzaSyCBzKKBKRNYF2i4jsyC6L99rDL5BFf_b7U',
  authDomain: 'sodhamishpat-16b04.firebaseapp.com',
  projectId: 'sodhamishpat-16b04',
  storageBucket: 'sodhamishpat-16b04.firebasestorage.app',
  messagingSenderId: '587260131501',
  appId: '1:587260131501:web:0bcbdb31a68b245c2eee24',
});

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
}

export function firebaseSignOut() {
  return signOut(auth);
}
