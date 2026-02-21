import { execSync } from 'child_process';

export default async function globalSetup() {
  if (process.env.E2E_USE_TEST_AUTH === '1') {
    return;
  }
  execSync('node scripts/reset-test-users.js reset', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}
