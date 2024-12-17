/// <reference types="cypress" />

import { attachCustomCommands } from 'cypress-firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';

// Extend Cypress namespace without duplicating commands
declare global {
  namespace Cypress {
    // Empty interface to avoid duplicate declarations
    // cypress-firebase will add its own declarations
    interface Chainable {
      // Intentionally empty
    }
  }
}

const fbConfig = {
  apiKey: Cypress.env('FIREBASE_API_KEY'),
  authDomain: Cypress.env('FIREBASE_AUTH_DOMAIN'),
  projectId: Cypress.env('FIREBASE_PROJECT_ID'),
  storageBucket: Cypress.env('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: Cypress.env('FIREBASE_MESSAGING_SENDER_ID'),
  appId: Cypress.env('FIREBASE_APP_ID'),
};

const app = initializeApp(fbConfig);
const auth = getAuth(app);

// Attach the custom commands from cypress-firebase
attachCustomCommands({ Cypress, cy, firebase: { auth } });

// Extend the existing commands from cypress-firebase
Cypress.Commands.overwrite(
  'login',
  (
    originalFn,
    email = Cypress.env('TEST_USER_EMAIL'),
    password = Cypress.env('TEST_USER_PASSWORD')
  ) => {
    cy.session([email, password], () => {
      return signInWithEmailAndPassword(auth, email, password)
        .then((response: UserCredential) => {
          return response.user.getIdToken();
        })
        .then((token: string) => {
          window.localStorage.setItem('authToken', token);
        });
    });
  }
);

Cypress.Commands.overwrite('logout', () => {
  cy.session([], () => {
    return signOut(auth).then(() => {
      window.localStorage.removeItem('authToken');
    });
  });
});
