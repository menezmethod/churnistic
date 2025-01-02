import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from './config';

let app;
let auth;

if (process.env.NODE_ENV === 'test') {
  app = initializeApp({
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain.firebaseapp.com',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id',
  });
  auth = getAuth(app);
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { app, auth };
