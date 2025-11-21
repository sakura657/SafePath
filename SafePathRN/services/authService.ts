import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { firebaseAuth } from './firebase';

export type AuthStateCallback = (user: User | null) => void;

export function subscribeToAuthChanges(callback: AuthStateCallback) {
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function register(email: string, password: string) {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export async function logOut() {
  return signOut(firebaseAuth);
}

export { firebaseAuth };
