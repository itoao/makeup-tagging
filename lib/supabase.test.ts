import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key) => ({
    url,
    key,
    from: vi.fn(),
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
  })),
}));

describe('supabase', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    global.window = originalWindow;
  });

  describe('environment variable validation', () => {
    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_KEY = 'test-key';

      await expect(async () => {
        await import('./supabase');
      }).rejects.toThrow('Missing env.NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should throw error if SUPABASE_KEY is missing on server-side', async () => {
      // Ensure we're in server-side context
      // @ts-ignore
      delete global.window;
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_KEY;

      await expect(async () => {
        await import('./supabase');
      }).rejects.toThrow('Missing env.SUPABASE_KEY for server-side usage.');
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing on client-side', async () => {
      // Mock client-side context
      // @ts-ignore
      global.window = {};
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await expect(async () => {
        await import('./supabase');
      }).rejects.toThrow('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY for client-side usage.');
    });
  });

  describe('supabase client initialization', () => {
    it('should initialize with service_role key on server-side', async () => {
      // Ensure we're in server-side context
      // @ts-ignore
      delete global.window;
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-service-role-key';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseModule = await import('./supabase');
      const supabase = supabaseModule.default;

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key'
      );
      expect(supabase.url).toBe('https://test.supabase.co');
      expect(supabase.key).toBe('test-service-role-key');
    });

    it('should initialize with anon key on client-side', async () => {
      // Mock client-side context
      // @ts-ignore
      global.window = {};
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-service-role-key';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseModule = await import('./supabase');
      const supabase = supabaseModule.default;

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
      expect(supabase.url).toBe('https://test.supabase.co');
      expect(supabase.key).toBe('test-anon-key');
    });

    it('should export a supabase client instance', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-key';

      const supabaseModule = await import('./supabase');
      const supabase = supabaseModule.default;

      expect(supabase).toBeDefined();
      expect(supabase.from).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.auth.signIn).toBeDefined();
      expect(supabase.auth.signOut).toBeDefined();
    });
  });
});