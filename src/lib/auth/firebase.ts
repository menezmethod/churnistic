import { getFirebaseServices } from '@/lib/firebase/config';

export async function getFirebaseAuth() {
  const { auth } = await getFirebaseServices();
  return auth;
}

export async function getFirebaseDb() {
  const { firestore } = await getFirebaseServices();
  return firestore;
}

export async function getFirebaseStorage() {
  const { storage } = await getFirebaseServices();
  return storage;
}

export default getFirebaseAuth;
