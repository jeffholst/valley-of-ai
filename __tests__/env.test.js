/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'dotenv';

describe('Environment template', () => {
  let envExample;

  beforeAll(() => {
    const envPath = path.join(process.cwd(), '.env.example');
    const raw = fs.readFileSync(envPath, 'utf8');
    envExample = parse(raw);
  });

  it('includes Supabase URL (server-only)', () => {
    expect(envExample.SUPABASE_URL).toBeDefined();
  });

  it('includes Supabase secret key', () => {
    expect(envExample.SUPABASE_SECRET_KEY).toBeDefined();
  });

  it('does not include NEXT_PUBLIC Supabase vars', () => {
    expect(envExample.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(envExample.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
  });

  it('includes GA measurement ID', () => {
    expect(envExample.NEXT_PUBLIC_GA_MEASUREMENT_ID).toBeDefined();
  });

  it('includes site name', () => {
    expect(envExample.NEXT_PUBLIC_SITE_NAME).toBeDefined();
  });

  it('uses a valid placeholder format for Supabase URL', () => {
    expect(envExample.SUPABASE_URL).toMatch(/^https?:\/\//);
  });

  it('uses a valid placeholder format for GA measurement ID', () => {
    expect(envExample.NEXT_PUBLIC_GA_MEASUREMENT_ID).toMatch(/^G-/);
  });
});
