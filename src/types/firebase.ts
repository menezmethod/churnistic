import { FirebaseApp } from 'firebase/app';
import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';
import { FirebaseStorage } from 'firebase/storage';

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

export type FirebaseEnvironment = 'local' | 'preview' | 'development' | 'production';

export type EmulatorConfig = {
  host: string;
  ports: {
    auth: number;
    firestore: number;
    storage: number;
    functions: number;
  };
};

export type FirebaseUser = User;

export type FirebaseError = {
  code: string;
  message: string;
  details?: unknown;
};
