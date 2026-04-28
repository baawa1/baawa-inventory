'use client';

import { useEffect, useState } from 'react';

type SyncStatus = 'idle' | 'waiting' | 'synced' | 'cleared' | 'error';

const NON_APPROVED_DEFAULT_ROLE = 'STAFF';
const INACTIVE_STATUSES = new Set(['REJECTED', 'SUSPENDED']);

function getResolvedRole(status: string, role: string) {
  if (role) return role;
  return status && status !== 'APPROVED' ? NON_APPROVED_DEFAULT_ROLE : '';
}

function getSyncPayload() {
  const email = window.localStorage.getItem('test-user-email')?.trim() ?? '';
  const status = window.localStorage.getItem('test-user-status')?.trim() ?? '';
  const role = window.localStorage.getItem('test-user-role')?.trim() ?? '';
  const expired =
    window.localStorage.getItem('test-session-expired') === 'true';

  return {
    email,
    status,
    role,
    expired,
  };
}

export function TestDataPageClient() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState('Waiting for test session data');

  useEffect(() => {
    let cancelled = false;
    let lastFingerprint = '';

    const syncSession = async () => {
      const payload = getSyncPayload();
      const resolvedRole = getResolvedRole(payload.status, payload.role);
      const fingerprint = JSON.stringify({ ...payload, resolvedRole });

      if (fingerprint === lastFingerprint) {
        return;
      }

      if (payload.expired) {
        lastFingerprint = fingerprint;

        const response = await fetch('/api/test-auth', {
          method: 'DELETE',
          credentials: 'same-origin',
          keepalive: true,
        });

        if (cancelled) return;

        setStatus(response.ok ? 'cleared' : 'error');
        setMessage(
          response.ok
            ? 'Cleared test session'
            : 'Failed to clear expired test session'
        );
        return;
      }

      if (!payload.email || !payload.status || !resolvedRole) {
        lastFingerprint = fingerprint;

        await fetch('/api/test-auth', {
          method: 'DELETE',
          credentials: 'same-origin',
          keepalive: true,
        });

        if (cancelled) return;

        setStatus('waiting');
        setMessage('Waiting for complete test session data');
        return;
      }

      lastFingerprint = fingerprint;

      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({
          id: payload.email,
          email: payload.email,
          role: resolvedRole,
          status: payload.status,
          isEmailVerified: payload.status !== 'PENDING',
          firstName: 'Test',
          lastName: 'User',
          isActive: !INACTIVE_STATUSES.has(payload.status),
        }),
      });

      if (cancelled) return;

      if (response.ok) {
        setStatus('synced');
        setMessage(
          `Synced test session for ${payload.email} (${resolvedRole}/${payload.status})`
        );
        return;
      }

      setStatus('error');
      setMessage(`Failed to sync test session (${response.status})`);
    };

    const scheduleSync = () => {
      queueMicrotask(() => {
        void syncSession();
      });
    };

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (this === window.localStorage) {
        scheduleSync();
      }
    };

    Storage.prototype.removeItem = function (key) {
      originalRemoveItem.call(this, key);
      if (this === window.localStorage) {
        scheduleSync();
      }
    };

    scheduleSync();

    return () => {
      cancelled = true;
      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Development Only
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Test Data Harness</h1>
        <p className="text-muted-foreground">
          This page syncs local test session markers into the development-only
          auth cookie used by E2E workflows.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm font-medium">Status</p>
        <p className="mt-2 text-lg capitalize">{status}</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
