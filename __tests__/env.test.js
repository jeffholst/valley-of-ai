/**
 * Environment Variable Tests
 *
 * Validates that critical environment variables are properly loaded
 */

describe('Environment Variables', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original env vars
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  it('should have Supabase URL defined', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  });

  it('should have Supabase anon key defined', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('should have GA measurement ID defined', () => {
    expect(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID).toBeDefined();
  });

  it('should have site name defined', () => {
    expect(process.env.NEXT_PUBLIC_SITE_NAME).toBeDefined();
  });

  it('Supabase URL should be a valid URL', () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(url).toMatch(/^https?:\/\//);
  });

  it('GA measurement ID should be in correct format', () => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    expect(gaId).toMatch(/^G-/);
  });
});
