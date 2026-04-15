/**
 * @jest-environment node
 */

describe('lib/supabase mock fallback client', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('supports chained order/limit queries', async () => {
    let supabase;
    jest.isolateModules(() => {
      ({ supabase } = require('@/lib/supabase'));
    });

    const result = await supabase
      .from('leaderboard_scores')
      .select('player_name, score')
      .eq('app_id', '2026/03/07/flappy-bird')
      .order('score', { ascending: false })
      .limit(10);

    expect(result).toEqual({ count: 0, data: [], error: null });
  });

  it('supports awaiting queries that end at eq()', async () => {
    let supabase;
    jest.isolateModules(() => {
      ({ supabase } = require('@/lib/supabase'));
    });

    const result = await supabase.from('votes').select('vote_type').eq('app_id', 'x');

    expect(result).toEqual({ count: 0, data: [], error: null });
  });
});
