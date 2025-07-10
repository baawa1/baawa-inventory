// Mock Next.js Request and Response before any imports
global.Request = class MockRequest {
  constructor() {}
};
global.Response = class MockResponse {
  constructor() {}
};
