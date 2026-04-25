import { getClientIp } from '@/lib/utils/request-ip';

describe('getClientIp', () => {
  it('returns the first forwarded client IP when a proxy chain is present', () => {
    const ipAddress = getClientIp({
      headers: new Headers({
        'x-forwarded-for': '203.0.113.10, 10.0.0.5, 10.0.0.6',
      }),
    });

    expect(ipAddress).toBe('203.0.113.10');
  });

  it('prefers real-ip and cloudflare headers over forwarded chains', () => {
    const realIpAddress = getClientIp({
      headers: new Headers({
        'x-forwarded-for': '203.0.113.10, 10.0.0.5',
        'x-real-ip': '198.51.100.8',
      }),
    });

    const cloudflareIpAddress = getClientIp({
      headers: new Headers({
        'x-forwarded-for': '203.0.113.10, 10.0.0.5',
        'x-real-ip': '198.51.100.8',
        'cf-connecting-ip': '192.0.2.44',
      }),
    });

    expect(realIpAddress).toBe('198.51.100.8');
    expect(cloudflareIpAddress).toBe('192.0.2.44');
  });
});
