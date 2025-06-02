/**
 * Next.js ミドルウェアのユニットテスト
 * Clerk認証ミドルウェアの設定テスト
 */
import { describe, it, expect, vi } from 'vitest';

// Clerkミドルウェアをモック
vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn(() => 'mocked-clerk-middleware'),
}));

describe('middleware', () => {
  it('should export clerk middleware as default', async () => {
    const middleware = await import('./middleware');
    
    expect(middleware.default).toBe('mocked-clerk-middleware');
  });

  it('should have correct config matcher patterns', async () => {
    const middleware = await import('./middleware');
    
    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toEqual([
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
    ]);
  });

  it('should exclude static files from middleware processing', async () => {
    const middleware = await import('./middleware');
    const patterns = middleware.config.matcher;
    
    // The first pattern should exclude common static file extensions
    const staticFilePattern = patterns[0];
    expect(staticFilePattern).toMatch(/css/);
    expect(staticFilePattern).toMatch(/js/);
    expect(staticFilePattern).toMatch(/png/);
    expect(staticFilePattern).toMatch(/jpe\?g/); // jpg pattern in regex
    expect(staticFilePattern).toMatch(/svg/);
  });

  it('should include API routes in middleware processing', async () => {
    const middleware = await import('./middleware');
    const patterns = middleware.config.matcher;
    
    // The second pattern should include API routes
    const apiPattern = patterns[1];
    expect(apiPattern).toBe('/(api|trpc)(.*)');
  });

  it('should exclude Next.js internals from middleware processing', async () => {
    const middleware = await import('./middleware');
    const patterns = middleware.config.matcher;
    
    // The first pattern should exclude _next
    const staticFilePattern = patterns[0];
    expect(staticFilePattern).toMatch(/_next/);
  });
});