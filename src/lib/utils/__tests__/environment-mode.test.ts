import {
  getEnvironmentModeIndicator,
  LIVE_HOSTNAMES,
} from '@/lib/utils/environment-mode';

describe('Environment mode indicator', () => {
  it('hides the indicator on the live hostname', () => {
    const result = getEnvironmentModeIndicator({
      hostname: LIVE_HOSTNAMES[0],
      nodeEnv: 'production',
    });

    expect(result).toEqual({
      hostname: LIVE_HOSTNAMES[0],
      isLive: true,
      label: null,
      showIndicator: false,
    });
  });

  it('hides the indicator when the configured app URL is the live domain', () => {
    const result = getEnvironmentModeIndicator({
      appUrl: 'https://pos.baawa.ng',
      nodeEnv: 'production',
    });

    expect(result).toEqual({
      hostname: 'pos.baawa.ng',
      isLive: true,
      label: null,
      showIndicator: false,
    });
  });

  it('shows DEV MODE for localhost development', () => {
    const result = getEnvironmentModeIndicator({
      hostname: 'localhost:3000',
      nodeEnv: 'development',
    });

    expect(result).toEqual({
      hostname: 'localhost',
      isLive: false,
      label: 'DEV MODE',
      showIndicator: true,
    });
  });

  it('shows DEV MODE for non-live preview hosts even in production builds', () => {
    const result = getEnvironmentModeIndicator({
      hostname: 'preview-baawa.vercel.app',
      nodeEnv: 'production',
    });

    expect(result).toEqual({
      hostname: 'preview-baawa.vercel.app',
      isLive: false,
      label: 'DEV MODE',
      showIndicator: true,
    });
  });

  it('shows TEST MODE when running in test mode', () => {
    const result = getEnvironmentModeIndicator({
      hostname: 'localhost',
      nodeEnv: 'test',
    });

    expect(result).toEqual({
      hostname: 'localhost',
      isLive: false,
      label: 'TEST MODE',
      showIndicator: true,
    });
  });

  it('stays hidden when production context cannot be classified as non-live', () => {
    const result = getEnvironmentModeIndicator({
      nodeEnv: 'production',
    });

    expect(result).toEqual({
      hostname: null,
      isLive: false,
      label: null,
      showIndicator: false,
    });
  });
});
