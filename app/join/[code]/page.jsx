'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidSessionCode, normalizeSessionCode } from '@/lib/multiplayer/sessionCodes';
import { storagePrefix } from '@/lib/siteConfig';

// Reusable multiplayer join page. Any app that exposes session metadata
// via the Next.js session API routes backed by Supabase, with
// { appPath, appName, status }, can use this route — the page reads those
// fields and redirects the player into the app.

const STATUS_MESSAGES = {
  ended: 'This game has already finished. Ask the host to start a new one.',
  playing:
    'This game is already in progress. You can still join — the host will fold you in on the next round.',
};

function playerStorageKey(code) {
  return `${storagePrefix}:join:${code}`;
}

function generatePlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers (should not normally hit this in modern Firefox/Chrome/Safari).
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildRedirectUrl(appPath, code, playerId) {
  const params = new URLSearchParams({ code, pid: playerId, role: 'player' });
  return `/apps/${appPath}/index.html#${params.toString()}`;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params?.code) ? params.code[0] : params?.code;
  const code = useMemo(() => normalizeSessionCode(rawCode || ''), [rawCode]);

  const [status, setStatus] = useState('loading'); // loading | ready | not-found | unconfigured | error
  const [session, setSession] = useState(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchSession = useCallback(async () => {
    const response = await fetch(`/api/multiplayer/sessions/${code}`, { cache: 'no-store' });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('session-fetch-failed');
    }
    const payload = await response.json();
    return payload?.session || null;
  }, [code]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const statusRes = await fetch('/api/multiplayer/status', { cache: 'no-store' });
        if (!statusRes.ok) {
          setStatus('unconfigured');
          return;
        }
        const statusPayload = await statusRes.json();
        if (!statusPayload?.configured) {
          setStatus('unconfigured');
          return;
        }
        if (!isValidSessionCode(code)) {
          setStatus('not-found');
          return;
        }
        const data = await fetchSession();
        if (cancelled) {
          return;
        }
        if (!data) {
          setStatus('not-found');
          return;
        }
        if (!data.appPath) {
          setStatus('not-found');
          return;
        }
        setSession(data);
        setStatus('ready');

        // Auto-restore: if this browser already has a player record for this
        // session, skip the form and send them straight into the app.
        try {
          const saved = window.localStorage.getItem(playerStorageKey(code));
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.playerId && data.players?.[parsed.playerId]) {
              router.replace(buildRedirectUrl(data.appPath, code, parsed.playerId));
            }
          }
        } catch {
          // localStorage unavailable (private mode, etc.) — just show the form.
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load session', err);
        setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [code, fetchSession, router]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmed = name.trim();
      if (trimmed.length < 1 || trimmed.length > 30) {
        setErrorMessage('Name must be 1–30 characters.');
        return;
      }
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const response = await fetch(`/api/multiplayer/sessions/${code}/players`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`join-failed: ${response.status} ${body}`);
        }
        const payload = await response.json();
        const playerId = payload?.playerId || generatePlayerId();
        const appPath = payload?.appPath || session.appPath;
        try {
          window.localStorage.setItem(
            playerStorageKey(code),
            JSON.stringify({ playerId, name: trimmed })
          );
        } catch {
          // ignore — non-fatal
        }
        router.replace(buildRedirectUrl(appPath, code, playerId));
      } catch (err) {
        console.error('Failed to register player', err);
        setErrorMessage('Could not join the game. Try again in a moment.');
        setSubmitting(false);
      }
    },
    [name, code, session, router]
  );

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Join a game
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {status === 'ready' ? session.appName || 'Game' : 'Game Room'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Code: <span className="font-mono font-semibold">{code || '—'}</span>
          </p>
        </header>

        {status === 'loading' && (
          <p className="text-gray-600 dark:text-gray-300">Looking up the game…</p>
        )}

        {status === 'unconfigured' && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <p>Multiplayer isn’t configured on this site.</p>
            <p className="text-gray-500 dark:text-gray-400">
              The site owner needs to configure Supabase environment variables before join links
              work.
            </p>
            <Link href="/" className="text-orange-600 hover:underline dark:text-orange-400">
              Back to the gallery
            </Link>
          </div>
        )}

        {status === 'not-found' && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <p>
              We couldn’t find a game with that code. Double-check the link your host pasted in
              chat.
            </p>
            <Link href="/" className="text-orange-600 hover:underline dark:text-orange-400">
              Back to the gallery
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <p>Something went wrong connecting to the game. Refresh and try again.</p>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {session.status && STATUS_MESSAGES[session.status] && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
                {STATUS_MESSAGES[session.status]}
              </p>
            )}
            <div>
              <label
                htmlFor="playerName"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Your name
              </label>
              <input
                id="playerName"
                type="text"
                required
                maxLength={30}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                placeholder="What should we call you?"
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? 'Joining…' : 'Join game'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
