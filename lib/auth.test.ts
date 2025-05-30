import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserId, getCurrentUser, getCurrentDbUser, hasAccessToResource, requireAuth } from './auth';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock supabase
vi.mock('./supabase', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Import mocked modules
import { auth, currentUser } from '@clerk/nextjs/server';
import supabase from './supabase';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123', sessionId: 'session-123' } as any);

      const userId = await getUserId();
      expect(userId).toBe('user-123');
      expect(auth).toHaveBeenCalledOnce();
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const userId = await getUserId();
      expect(userId).toBeNull();
      expect(auth).toHaveBeenCalledOnce();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      vi.mocked(currentUser).mockResolvedValue(mockUser as any);

      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(currentUser).toHaveBeenCalledOnce();
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(currentUser).mockResolvedValue(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
      expect(currentUser).toHaveBeenCalledOnce();
    });
  });

  describe('getCurrentDbUser', () => {
    it('should return database user when authenticated and user exists', async () => {
      const mockDbUser = {
        id: 'user-123',
        username: 'johndoe',
        name: 'John Doe',
        image: 'avatar.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      
      const singleMock = vi.fn().mockResolvedValue({ data: mockDbUser, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      const fromMock = vi.fn(() => ({ select: selectMock }));
      
      vi.mocked(supabase.from).mockImplementation(fromMock);

      const dbUser = await getCurrentDbUser();
      
      expect(dbUser).toEqual(mockDbUser);
      expect(auth).toHaveBeenCalledOnce();
      expect(supabase.from).toHaveBeenCalledWith('User');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
      expect(singleMock).toHaveBeenCalledOnce();
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const dbUser = await getCurrentDbUser();
      
      expect(dbUser).toBeNull();
      expect(auth).toHaveBeenCalledOnce();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return null and log error when database query fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = { message: 'Database error', code: 'DB001' };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      const fromMock = vi.fn(() => ({ select: selectMock }));
      
      vi.mocked(supabase.from).mockImplementation(fromMock);

      const dbUser = await getCurrentDbUser();
      
      expect(dbUser).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching DB user:', mockError);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('hasAccessToResource', () => {
    it('should return true when user ID matches resource user ID', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const hasAccess = await hasAccessToResource('user-123');
      expect(hasAccess).toBe(true);
      expect(auth).toHaveBeenCalledOnce();
    });

    it('should return false when user ID does not match resource user ID', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const hasAccess = await hasAccessToResource('user-456');
      expect(hasAccess).toBe(false);
      expect(auth).toHaveBeenCalledOnce();
    });

    it('should return false when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const hasAccess = await hasAccessToResource('user-123');
      expect(hasAccess).toBe(false);
      expect(auth).toHaveBeenCalledOnce();
    });
  });

  describe('requireAuth', () => {
    it('should return user ID when authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const userId = await requireAuth();
      expect(userId).toBe('user-123');
      expect(auth).toHaveBeenCalledOnce();
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      await expect(requireAuth()).rejects.toThrow('認証が必要です');
      expect(auth).toHaveBeenCalledOnce();
    });
  });
});