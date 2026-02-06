import { describe, it, expect } from '@jest/globals';

describe('Auth.js v5 Simple Tests', () => {
  describe('File Structure', () => {
    it('should have auth.ts file with correct structure', () => {
      // This test verifies that the auth.ts file exists and has the right structure
      // We'll check the file content directly
      const fs = require('fs');
      const path = require('path');

      const authFilePath = path.join(__dirname, '..', 'auth.ts');
      expect(fs.existsSync(authFilePath)).toBe(true);

      const authContent = fs.readFileSync(authFilePath, 'utf8');

      // Check for required imports (using single quotes)
      expect(authContent).toContain("import NextAuth from 'next-auth'");
      expect(authContent).toContain(
        "import CredentialsProvider from 'next-auth/providers/credentials'"
      );

      // Check for auth.config import (new split architecture)
      expect(authContent).toContain("import { authConfig } from './auth.config'");

      // Check for required exports (NextAuth returns auth and handlers)
      expect(authContent).toContain('export const { auth, handlers');

      // Check for provider configuration
      expect(authContent).toContain('CredentialsProvider({');
      expect(authContent).toContain("name: 'credentials'");

      // Check for callbacks (extends from authConfig)
      expect(authContent).toContain('callbacks: {');
      expect(authContent).toContain('...authConfig.callbacks');
      expect(authContent).toContain('async jwt({ token, user, trigger })');
    });

    it('should have API route with handlers', () => {
      const fs = require('fs');
      const path = require('path');

      const apiRoutePath = path.join(
        __dirname,
        '..',
        'src',
        'app',
        'api',
        'auth',
        '[...nextauth]',
        'route.ts'
      );
      expect(fs.existsSync(apiRoutePath)).toBe(true);

      const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');

      // Check for handlers import and export
      expect(apiRouteContent).toContain('import { handlers }');
      expect(apiRouteContent).toContain(
        'export const { GET, POST } = handlers'
      );
    });

    it('should have middleware using auth function', () => {
      const fs = require('fs');
      const path = require('path');

      const middlewarePath = path.join(__dirname, '..', 'src', 'middleware.ts');
      expect(fs.existsSync(middlewarePath)).toBe(true);

      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

      // Check for Edge-compatible auth setup (new split architecture)
      // Middleware imports from auth.config.ts for Edge compatibility
      expect(middlewareContent).toContain("import NextAuth from 'next-auth'");
      expect(middlewareContent).toContain("import { authConfig } from '#root/auth.config'");
      expect(middlewareContent).toContain('const { auth } = NextAuth(authConfig)');
      expect(middlewareContent).toContain('export default auth(');
    });
  });

  describe('Auth.js v5 Integration', () => {
    it('should use Auth.js v5 auth function in api-middleware', () => {
      const fs = require('fs');
      const path = require('path');

      const middlewareFile = path.join(
        __dirname,
        '..',
        'src',
        'lib',
        'api-middleware.ts'
      );

      if (fs.existsSync(middlewareFile)) {
        const content = fs.readFileSync(middlewareFile, 'utf8');

        // Should import and use Auth.js v5 auth function from root auth.ts
        expect(content).toContain('import { auth }');
        expect(content).toContain('const session = await auth()');

        // Should not contain deprecated patterns
        expect(content).not.toContain('getServerSession');
        expect(content).not.toContain('withValidatedAuth(');
        expect(content).not.toContain('withAuthAndRoleCheck(');
      }
    });

    it('should have edge-compatible auth.config.ts', () => {
      const fs = require('fs');
      const path = require('path');

      const authConfigPath = path.join(__dirname, '..', 'auth.config.ts');
      expect(fs.existsSync(authConfigPath)).toBe(true);

      const authConfigContent = fs.readFileSync(authConfigPath, 'utf8');

      // Should NOT contain heavy dependencies (Edge compatibility)
      expect(authConfigContent).not.toContain("from './src/lib/db'");
      expect(authConfigContent).not.toContain("from 'bcryptjs'");
      expect(authConfigContent).not.toContain('prisma');

      // Should export authConfig
      expect(authConfigContent).toContain('export const authConfig');
      expect(authConfigContent).toContain('providers: []');
    });
  });

  describe('Configuration Validation', () => {
    it('should have correct NextAuth configuration', () => {
      const fs = require('fs');
      const path = require('path');

      // Check auth.ts for providers and events
      const authFilePath = path.join(__dirname, '..', 'auth.ts');
      const authContent = fs.readFileSync(authFilePath, 'utf8');

      expect(authContent).toContain('providers: [');
      expect(authContent).toContain('callbacks: {');
      expect(authContent).toContain('events: {');

      // Check auth.config.ts for base configuration
      const authConfigPath = path.join(__dirname, '..', 'auth.config.ts');
      const authConfigContent = fs.readFileSync(authConfigPath, 'utf8');

      expect(authConfigContent).toContain('session: {');
      expect(authConfigContent).toContain('pages: {');
      expect(authConfigContent).toContain('secret: process.env.NEXTAUTH_SECRET');
    });

    it('should have proper error handling in authorize function', () => {
      const fs = require('fs');
      const path = require('path');

      const authFilePath = path.join(__dirname, '..', 'auth.ts');
      const authContent = fs.readFileSync(authFilePath, 'utf8');

      // Check for error handling in authorize function
      expect(authContent).toContain('async authorize(credentials, req)');
      expect(authContent).toContain('try {');
      expect(authContent).toContain('} catch (error) {');
      expect(authContent).toContain(
        "console.error('Authentication error:', error)"
      );
    });
  });

  describe('Security Features', () => {
    it('should have account lockout functionality', () => {
      const fs = require('fs');
      const path = require('path');

      const authFilePath = path.join(__dirname, '..', 'auth.ts');
      const authContent = fs.readFileSync(authFilePath, 'utf8');

      // Check for account lockout imports and usage (using single quotes)
      expect(authContent).toContain(
        "import { AccountLockout } from './src/lib/utils/account-lockout'"
      );
      expect(authContent).toContain('AccountLockout.checkLockoutStatus');
      expect(authContent).toContain('AccountLockout.resetFailedAttempts');
    });

    it('should have audit logging functionality', () => {
      const fs = require('fs');
      const path = require('path');

      const authFilePath = path.join(__dirname, '..', 'auth.ts');
      const authContent = fs.readFileSync(authFilePath, 'utf8');

      // Check for audit logging imports and usage (using single quotes)
      expect(authContent).toContain(
        "import { AuditLogger } from './src/lib/utils/audit-logger'"
      );
      expect(authContent).toContain('AuditLogger.logLoginFailed');
      expect(authContent).toContain('AuditLogger.logLoginSuccess');
      expect(authContent).toContain('AuditLogger.logLogout');
    });

    it('should have password hashing', () => {
      const fs = require('fs');
      const path = require('path');

      const authFilePath = path.join(__dirname, '..', 'auth.ts');
      const authContent = fs.readFileSync(authFilePath, 'utf8');

      // Check for bcrypt usage (using single quotes)
      expect(authContent).toContain("import * as bcrypt from 'bcryptjs'");
      expect(authContent).toContain('bcrypt.compare');
    });
  });
});
