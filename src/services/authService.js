import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  onAuthStateChanged, signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile } from './userService';

// Calls back with the Firebase user (or null). Returns the unsubscribe function.
export const listenAuth = (callback) => onAuthStateChanged(auth, callback);

export const signOut = () => firebaseSignOut(auth);

export const signIn = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

export async function signUp({ name, email, password, role }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await createUserProfile(cred.user.uid, { name: name.trim(), email: email.trim(), role });
  } catch (e) {
    // no profile = unusable account, so remove it and let the user try again
    await cred.user.delete().catch(() => {});
    throw e;
  }
}

// Friendly Portuguese messages for the most common Firebase errors
export function authErrorMessage(error) {
  console.log('[auth error]', error?.code, error?.message);
  if (/PERMISSION_DENIED/i.test(`${error?.code} ${error?.message}`)) {
    return 'O banco recusou a gravação. Publique as regras do database.rules.json no Firebase.';
  }
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use pelo menos 8 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Login por e-mail/senha não está ativado no Firebase (Authentication → Método de login).';
    case 'auth/invalid-api-key':
      return 'Chave do Firebase inválida. Confira o arquivo .env.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Algo deu errado. Tente novamente.';
  }
}
