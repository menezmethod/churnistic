import { vi } from 'vitest';

export const mockFirestore = {
  collection: vi.fn().mockReturnThis(),
  doc: vi.fn().mockReturnThis(),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  count: vi.fn().mockReturnThis(),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  })),
};