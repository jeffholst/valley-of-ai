// Firebase client for Next.js pages (join page, etc.).
// Apps themselves load Firebase from CDN inside their own <script type="module">
// block — this module is for the Next.js gallery side only.

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

/** Returns the Firebase config from env, or null if any required value is missing. */
export function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !databaseURL || !projectId) {
    return null;
  }
  return { apiKey, authDomain, databaseURL, projectId };
}

/** Lazily initialize (and cache) the Firebase app. Returns null if unconfigured. */
export function getFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config) {
    return null;
  }
  const existing = getApps();
  return existing.length > 0 ? existing[0] : initializeApp(config);
}

/** Get a handle to the Realtime Database, or null if Firebase is unconfigured. */
export function getFirebaseDb() {
  const app = getFirebaseApp();
  return app ? getDatabase(app) : null;
}
