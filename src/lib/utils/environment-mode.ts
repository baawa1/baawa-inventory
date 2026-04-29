export const LIVE_HOSTNAMES = ['pos.baawa.ng', 'www.pos.baawa.ng'] as const;

export type EnvironmentModeLabel = 'DEV MODE' | 'TEST MODE';

export interface EnvironmentModeInput {
  hostname?: string | null;
  nodeEnv?: string | null;
  appUrl?: string | null;
}

export interface EnvironmentModeIndicator {
  hostname: string | null;
  isLive: boolean;
  label: EnvironmentModeLabel | null;
  showIndicator: boolean;
}

function normalizeHostname(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  try {
    const url = normalized.includes('://')
      ? new URL(normalized)
      : new URL(`https://${normalized}`);

    return url.hostname.toLowerCase();
  } catch {
    return normalized.split('/')[0]?.split(':')[0] || null;
  }
}

function isLiveHostname(hostname: string | null): boolean {
  return hostname
    ? LIVE_HOSTNAMES.includes(hostname as (typeof LIVE_HOSTNAMES)[number])
    : false;
}

function getNonLiveLabel(nodeEnv?: string | null): EnvironmentModeLabel {
  return nodeEnv === 'test' ? 'TEST MODE' : 'DEV MODE';
}

export function getEnvironmentModeIndicator(
  input: EnvironmentModeInput = {}
): EnvironmentModeIndicator {
  const hostname = normalizeHostname(input.hostname);
  const appHostname = normalizeHostname(input.appUrl);

  if (isLiveHostname(hostname)) {
    return {
      hostname,
      isLive: true,
      label: null,
      showIndicator: false,
    };
  }

  if (hostname) {
    return {
      hostname,
      isLive: false,
      label: getNonLiveLabel(input.nodeEnv),
      showIndicator: true,
    };
  }

  if (isLiveHostname(appHostname)) {
    return {
      hostname: appHostname,
      isLive: true,
      label: null,
      showIndicator: false,
    };
  }

  if (appHostname) {
    return {
      hostname: appHostname,
      isLive: false,
      label: getNonLiveLabel(input.nodeEnv),
      showIndicator: true,
    };
  }

  if (input.nodeEnv && input.nodeEnv !== 'production') {
    return {
      hostname: null,
      isLive: false,
      label: getNonLiveLabel(input.nodeEnv),
      showIndicator: true,
    };
  }

  return {
    hostname: null,
    isLive: false,
    label: null,
    showIndicator: false,
  };
}
