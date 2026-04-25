export interface RequestHeadersLike {
  headers?: Headers | null;
}

function normalizeHeaderValue(value?: string | null): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue || undefined;
}

function getForwardedClientIp(forwarded?: string | null): string | undefined {
  if (!forwarded) {
    return undefined;
  }

  const firstHop = forwarded
    .split(',')
    .map(value => value.trim())
    .find(Boolean);

  return normalizeHeaderValue(firstHop);
}

export function getClientIp(request?: RequestHeadersLike): string {
  const headers = request?.headers;

  return (
    normalizeHeaderValue(headers?.get('cf-connecting-ip')) ||
    normalizeHeaderValue(headers?.get('x-real-ip')) ||
    getForwardedClientIp(headers?.get('x-forwarded-for')) ||
    normalizeHeaderValue(headers?.get('x-remote-addr')) ||
    'unknown'
  );
}
