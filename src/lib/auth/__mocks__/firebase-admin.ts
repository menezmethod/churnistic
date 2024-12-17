const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn(),
  createCustomToken: jest.fn(),
};

export const getAuth = jest.fn(() => mockAuth);

export const DecodedIdToken = {};

export const auth = {
  getAuth,
};
