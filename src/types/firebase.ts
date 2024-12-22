export interface FirebaseError extends Error {
  code: string;
  customData?: Record<string, unknown>;
  name: string;
}
