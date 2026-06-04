import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const commitSha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);
const deployVersion = commitSha ? `${pkg.version}+${commitSha}` : pkg.version;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_DEPLOY_VERSION: deployVersion,
  },
  serverExternalPackages: ['bad-words', 'badwords-list'],
};

export default nextConfig;
