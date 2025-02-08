import {
  Firestore,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Query,
  DocumentReference,
  collection,
  doc,
  getDocs,
} from 'firebase/firestore';

import { FirebaseError } from '@/types/firebase';

import { getFirebaseServices } from '../config';
import { MAX_BATCH_SIZE } from '../constants';

let firestore: Firestore;

/**
 * Gets the Firestore instance
 * @returns Promise with Firestore instance
 */
export async function getFirestore(): Promise<Firestore> {
  if (!firestore) {
    const services = await getFirebaseServices();
    firestore = services.firestore;
  }
  return firestore;
}

/**
 * Converts a Firestore document snapshot to a typed object
 * @param doc Document snapshot to convert
 * @returns Typed object with document data and id
 */
export function convertDoc<T extends DocumentData>(
  doc: DocumentSnapshot<DocumentData>
): T & { id: string } {
  if (!doc.exists()) {
    throw new Error('Document does not exist');
  }
  return { ...(doc.data() as T), id: doc.id };
}

/**
 * Converts a Firestore query snapshot to an array of typed objects
 * @param snapshot Query snapshot to convert
 * @returns Array of typed objects with document data and ids
 */
export function convertQuerySnapshot<T extends DocumentData>(
  snapshot: QuerySnapshot<DocumentData>
): (T & { id: string })[] {
  return snapshot.docs.map((doc) => convertDoc<T>(doc));
}

/**
 * Handles a Firestore error and returns a typed error object
 * @param error Error to handle
 * @returns Typed FirebaseError object
 */
export function handleFirestoreError(error: unknown): FirebaseError {
  if (error instanceof Error) {
    return {
      code: 'firestore/unknown',
      message: error.message,
      details: error,
    };
  }
  return {
    code: 'firestore/unknown',
    message: 'An unknown error occurred',
    details: error,
  };
}

/**
 * Checks if a query would exceed the maximum batch size
 * @param query Query to check
 * @returns Promise<boolean> indicating if the query would exceed batch size
 */
export async function wouldExceedBatchSize(query: Query<DocumentData>): Promise<boolean> {
  const snapshot = await getDocs(query);
  return snapshot.size > MAX_BATCH_SIZE;
}

/**
 * Gets a collection reference with type checking
 * @param collectionName Collection name
 * @returns Promise with typed collection reference
 */
export async function getCollection(collectionName: string) {
  const db = await getFirestore();
  return collection(db, collectionName);
}

/**
 * Gets a document reference with type checking
 * @param collectionName Collection name
 * @param docId Document ID
 * @returns Promise with typed document reference
 */
export async function getDocRef<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<DocumentReference<T>> {
  const db = await getFirestore();
  const docRef = doc(db, collectionName, docId);
  return docRef as DocumentReference<T>;
}
