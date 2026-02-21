import { execSync } from 'child_process';

export default async function globalTeardown() {
  if (process.env.E2E_USE_TEST_AUTH === '1') {
    return;
  }
  execSync('node scripts/reset-test-users.js cleanup', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}
