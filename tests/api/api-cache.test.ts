import { apiCache, stopApiCacheCleanup } from '@/lib/api-cache';

describe('APICache on server runtime', () => {
  beforeEach(() => {
    apiCache.clear();
  });

  afterAll(() => {
    stopApiCacheCleanup();
  });

  it('stores and retrieves cached responses without throwing in Node runtime', () => {
    const data = { body: { ok: true }, status: 200 };

    expect(() =>
      apiCache.set('server-endpoint', data, { foo: 'bar' })
    ).not.toThrow();

    expect(apiCache.get('server-endpoint', { foo: 'bar' })).toEqual(data);
  });

  it('invalidates cached entries using decoded base64 keys', () => {
    const data = { body: { ok: true }, status: 200 };

    apiCache.set('/api/server-endpoint', data);
    expect(apiCache.get('/api/server-endpoint')).toEqual(data);

    expect(() => apiCache.invalidate('/api/server-endpoint')).not.toThrow();

    expect(apiCache.get('/api/server-endpoint')).toBeNull();
  });
});
