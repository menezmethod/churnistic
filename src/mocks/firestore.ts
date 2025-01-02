import { jest } from '@jest/globals';
import {
  type DocumentData,
  type DocumentReference,
  type CollectionReference,
} from 'firebase-admin/firestore';

const mockDocMethods = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as DocumentReference<DocumentData> & {
  get: jest.Mock;
  set: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const mockCollectionMethods = {
  doc: jest.fn(() => mockDocMethods) as unknown as jest.Mock<
    () => DocumentReference<DocumentData>
  >,
  get: jest.fn(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
} as unknown as CollectionReference<DocumentData> & {
  doc: jest.Mock;
  get: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  count: jest.Mock;
};

export const mockFirestore = {
  collection: jest.fn(() => mockCollectionMethods),
} as unknown as { collection: (path: string) => CollectionReference<DocumentData> };
