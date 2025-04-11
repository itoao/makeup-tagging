import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findUserByIdentifier, followUser, unfollowUser } from './UserRepository';
import type { UserProfile } from '@/src/types/user';

// Mock the module and define the mock object *inside* the factory
vi.mock('@/lib/supabase', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  return { default: mockSupabaseClient };
});

// Import the mocked supabase client *after* vi.mock
// We need a way to access the mock object for setup in beforeEach/tests
// One way is to re-import the mocked module
import supabase from '@/lib/supabase';
// Cast to access the mock functions directly if needed for setup/assertions
const mockSupabaseClient = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};


describe('UserRepository', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset mock implementations using the re-imported mock object
    mockSupabaseClient.from.mockReturnThis(); // Ensure chaining is reset
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.insert.mockReturnThis();
    mockSupabaseClient.delete.mockReturnThis(); // Ensure delete returns this for chaining .eq
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.in.mockReturnThis();
    mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null, error: null }); // Default reset
    mockSupabaseClient.insert.mockResolvedValue({ error: null }); // Default reset
    mockSupabaseClient.delete.mockResolvedValue({ error: null }); // Default reset
    mockSupabaseClient.in.mockResolvedValue({ data: [], error: null }); // Default reset for 'in' check
  });

  // --- findUserByIdentifier ---
  // Removed duplicate describe block
  describe('findUserByIdentifier', () => {
    const mockUserId = 'user-id-123';
    const mockUsername = 'testuser';
    const mockUserData = {
      id: mockUserId,
      username: mockUsername,
      name: 'Test User',
      image: 'test.jpg',
      created_at: new Date().toISOString(),
      followers: [{ followerId: 'follower-1' }],
      following: [{ followingId: 'following-1' }, { followingId: 'following-2' }],
    };
    const expectedProfile: UserProfile = {
      id: mockUserId,
      username: mockUsername,
      name: 'Test User',
      image: 'test.jpg',
      _count: {
        followers: 1,
        following: 2,
      }
    };

    it('should find a user by ID and return profile with follow status', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: mockUserData, error: null });
      const currentUserId = 'follower-1'; // This user follows the target user

      const { profile, isFollowing, error } = await findUserByIdentifier(mockUserId, currentUserId);

      expect(error).toBeNull();
      expect(profile).toEqual(expectedProfile);
      expect(isFollowing).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('User');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.any(String));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockUserId);
      expect(mockSupabaseClient.maybeSingle).toHaveBeenCalled();
    });

    it('should find a user by username and return profile without follow status (not logged in)', async () => {
      // Mock ID fetch to return null, then mock username fetch
      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // ID fetch fails
        .mockResolvedValueOnce({ data: mockUserData, error: null }); // Username fetch succeeds

      const { profile, isFollowing, error } = await findUserByIdentifier(mockUsername, null); // No current user

      expect(error).toBeNull();
      expect(profile).toEqual(expectedProfile);
      expect(isFollowing).toBe(false);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); // Called for ID and username
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockUsername); // First attempt (fails)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('username', mockUsername); // Second attempt
      expect(mockSupabaseClient.maybeSingle).toHaveBeenCalledTimes(2);
    });

     it('should return false for isFollowing if current user does not follow target', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: mockUserData, error: null });
      const currentUserId = 'other-user-id'; // This user does NOT follow the target user

      const { profile, isFollowing, error } = await findUserByIdentifier(mockUserId, currentUserId);

      expect(error).toBeNull();
      expect(profile).toEqual(expectedProfile);
      expect(isFollowing).toBe(false);
    });

    it('should return null profile if user is not found', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null, error: null }); // Both ID and username fail

      const { profile, isFollowing, error } = await findUserByIdentifier('nonexistent', null);

      expect(error).toBeNull();
      expect(profile).toBeNull();
      expect(isFollowing).toBe(false);
      expect(mockSupabaseClient.maybeSingle).toHaveBeenCalledTimes(2); // Tried ID and username
    });

    it('should return an error if Supabase fetch fails', async () => {
      const mockError = new Error('Supabase fetch failed');
      mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null, error: mockError });

      const { profile, isFollowing, error } = await findUserByIdentifier(mockUserId, null);

      expect(error).toEqual(mockError);
      expect(profile).toBeNull();
      expect(isFollowing).toBe(false);
    });
  });

  // --- followUser ---
  describe('followUser', () => {
    const followerId = 'user-follower';
    const followingId = 'user-following';
    const mockExistingUsers = [{ id: followerId }, { id: followingId }];

    it('should insert a follow relationship if users exist and not self-following', async () => {
       mockSupabaseClient.in.mockResolvedValueOnce({ data: mockExistingUsers, error: null }); // Both users exist
       mockSupabaseClient.insert.mockResolvedValueOnce({ error: null }); // Insert succeeds

       const { error } = await followUser(followerId, followingId);

       expect(error).toBeNull();
       expect(mockSupabaseClient.from).toHaveBeenCalledWith('User');
       expect(mockSupabaseClient.select).toHaveBeenCalledWith('id');
       expect(mockSupabaseClient.in).toHaveBeenCalledWith('id', [followerId, followingId]);
       expect(mockSupabaseClient.from).toHaveBeenCalledWith('Follow');
       expect(mockSupabaseClient.insert).toHaveBeenCalledWith({ followerId, followingId });
    });

    it('should return an error if trying to self-follow', async () => {
      const { error } = await followUser(followerId, followerId);
      expect(error).toEqual(new Error("自分自身をフォローすることはできません。"));
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return an error if follower does not exist', async () => {
       mockSupabaseClient.in.mockResolvedValueOnce({ data: [{ id: followingId }], error: null }); // Only following exists

       const { error } = await followUser(followerId, followingId);

       expect(error).toEqual(new Error(`操作元のユーザー (ID: ${followerId}) が見つかりません。`));
       expect(mockSupabaseClient.from).toHaveBeenCalledWith('User');
       expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

     it('should return an error if following user does not exist', async () => {
       mockSupabaseClient.in.mockResolvedValueOnce({ data: [{ id: followerId }], error: null }); // Only follower exists

       const { error } = await followUser(followerId, followingId);

       expect(error).toEqual(new Error(`フォロー対象のユーザー (ID: ${followingId}) が見つかりません。`));
       expect(mockSupabaseClient.from).toHaveBeenCalledWith('User');
       expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it('should return null error if already following (unique constraint violation)', async () => {
       mockSupabaseClient.in.mockResolvedValueOnce({ data: mockExistingUsers, error: null });
       const mockFollowError = { code: '23505', message: 'unique constraint violation' };
       mockSupabaseClient.insert.mockResolvedValueOnce({ error: mockFollowError });

       const { error } = await followUser(followerId, followingId);

       expect(error).toBeNull(); // Handled gracefully
       expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should return an error if Supabase insert fails for other reasons', async () => {
       mockSupabaseClient.in.mockResolvedValueOnce({ data: mockExistingUsers, error: null });
       const mockInsertError = new Error('Insert failed');
       mockSupabaseClient.insert.mockResolvedValueOnce({ error: mockInsertError });

       const { error } = await followUser(followerId, followingId);

       expect(error).toEqual(mockInsertError);
       expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

     it('should return an error if user existence check fails', async () => {
       const mockCheckError = new Error('DB connection error');
       mockSupabaseClient.in.mockResolvedValueOnce({ data: null, error: mockCheckError });

       const { error } = await followUser(followerId, followingId);

       expect(error).toEqual(new Error('ユーザー存在確認中にエラーが発生しました。'));
       expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
  });

  // --- unfollowUser ---
  describe('unfollowUser', () => {
     const followerId = 'user-follower';
     const followingId = 'user-following';

    it('should delete the follow relationship', async () => {
      // delete()が正しくチェーン可能なことを確認
      mockSupabaseClient.delete.mockImplementation(() => {
        return {
          eq: mockSupabaseClient.eq
        };
      });
      mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'followingId') {
          return { error: null };
        }
        return { eq: mockSupabaseClient.eq };
      });

      const { error } = await unfollowUser(followerId, followingId);

      expect(error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Follow');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('followerId', followerId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('followingId', followingId);
    });

    it('should return an error if Supabase delete fails', async () => {
      const mockDeleteError = new Error('Delete failed');
      // delete()が正しくチェーン可能なことを確認
      mockSupabaseClient.delete.mockImplementation(() => {
        return {
          eq: mockSupabaseClient.eq
        };
      });
      mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'followingId') {
          return { error: mockDeleteError };
        }
        return { eq: mockSupabaseClient.eq };
      });

      const { error } = await unfollowUser(followerId, followingId);

      expect(error).toEqual(mockDeleteError);
    });
  });
});
