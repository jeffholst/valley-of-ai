/**
 * @jest-environment node
 */

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ _isMock: true })),
}));

import { createClient } from '@supabase/supabase-js';

describe('lib/supabaseAdmin createServiceClient', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    createClient.mockClear();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns null when env vars are missing', () => {
    let createServiceClient;
    jest.isolateModules(() => {
      ({ createServiceClient } = require('@/lib/supabaseAdmin'));
    });
    expect(createServiceClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns null when only SUPABASE_URL is set', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    let createServiceClient;
    jest.isolateModules(() => {
      ({ createServiceClient } = require('@/lib/supabaseAdmin'));
    });
    expect(createServiceClient()).toBeNull();
  });

  it('returns null when only SUPABASE_SECRET_KEY is set', () => {
    process.env.SUPABASE_SECRET_KEY = 'service-role-key';
    let createServiceClient;
    jest.isolateModules(() => {
      ({ createServiceClient } = require('@/lib/supabaseAdmin'));
    });
    expect(createServiceClient()).toBeNull();
  });

  it('returns a Supabase client when both env vars are set', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'service-role-key';
    let createServiceClient;
    jest.isolateModules(() => {
      ({ createServiceClient } = require('@/lib/supabaseAdmin'));
    });
    const client = createServiceClient();
    expect(client).not.toBeNull();
    // createClient is called inside the isolated module registry — verify via result shape
    expect(client._isMock).toBe(true);
  });
});
