import { execSync } from 'child_process';

export default async function globalSetup() {
  execSync('node scripts/reset-test-users.js reset', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}
