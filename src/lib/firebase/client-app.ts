import { FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Functions, getFunctions } from 'firebase/functions';
import { FirebaseStorage, getStorage } from 'firebase/storage';

import { initializeFirebaseApp } from './config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

export const getFirebaseApp = async (): Promise<FirebaseApp> => {
  if (!app) {
    app = await initializeFirebaseApp();
  }
  return app;
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  if (!auth) {
    const app = await getFirebaseApp();
    auth = getAuth(app);
  }
  return auth;
};

export const getFirebaseFirestore = async (): Promise<Firestore> => {
  if (!firestore) {
    const app = await getFirebaseApp();
    firestore = getFirestore(app);
  }
  return firestore;
};

export const getFirebaseStorage = async (): Promise<FirebaseStorage> => {
  if (!storage) {
    const app = await getFirebaseApp();
    storage = getStorage(app);
  }
  return storage;
};

export const getFirebaseFunctions = async (): Promise<Functions> => {
  if (!functions) {
    const app = await getFirebaseApp();
    functions = getFunctions(app);
  }
  return functions;
};
