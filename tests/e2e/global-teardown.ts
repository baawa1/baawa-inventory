import { execSync } from 'child_process';

export default async function globalTeardown() {
  execSync('node scripts/reset-test-users.js cleanup', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}
