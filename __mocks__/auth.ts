// Mock for auth.ts at root level - placed in __mocks__ for automatic mocking
export const auth = jest.fn();
export const signIn = jest.fn();
export const signOut = jest.fn();
export const handlers = {
  GET: jest.fn(),
  POST: jest.fn(),
};

// Default implementations
auth.mockResolvedValue(null);
signIn.mockResolvedValue({ error: null });
signOut.mockResolvedValue(undefined);