/// <reference types="cypress" />

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

const fbConfig = {
  apiKey: Cypress.env('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: Cypress.env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: Cypress.env('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: Cypress.env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: Cypress.env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: Cypress.env('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: Cypress.env('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

const app = initializeApp(fbConfig);
const auth = getAuth(app);

Cypress.Commands.add(
  'login',
  (
    email = Cypress.env('TEST_USER_EMAIL'),
    password = Cypress.env('TEST_USER_PASSWORD')
  ) => {
    cy.wrap(
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => userCredential.user.getIdToken())
        .then((token) => {
          window.localStorage.setItem('authToken', token);
        }),
      { log: false }
    );
  }
);

Cypress.Commands.add('logout', () => {
  cy.wrap(
    signOut(auth).then(() => {
      window.localStorage.removeItem('authToken');
    }),
    { log: false }
  );
});
