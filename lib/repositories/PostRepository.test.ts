import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findManyPosts, createPost } from './PostRepository';
import type { Post as PostType } from '@/src/types/post';
import type { Database } from '@/src/types/supabase';

// Define types for mock data based on generated types (adjust if needed)
type PostRow = Database['public']['Tables']['Post']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];
type LikeRow = Database['public']['Tables']['Like']['Row'];
type SaveRow = Database['public']['Tables']['Save']['Row'];
type TagRow = Database['public']['Tables']['Tag']['Row'];
type ProductRow = Database['public']['Tables']['Product']['Row'];
type BrandRow = Database['public']['Tables']['Brand']['Row'];

type PostWithRelations = PostRow & {
  user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null;
  likes: Pick<LikeRow, 'userId'>[];
  saves: Pick<SaveRow, 'userId'>[];
  tags: (Pick<TagRow, 'id' | 'postId' | 'productId' | 'created_at' | 'xPosition' | 'yPosition'> & {
    product: (Pick<ProductRow, 'id' | 'name' | 'imageUrl' | 'description'> & {
      brand: Pick<BrandRow, 'id' | 'name'> | null;
    }) | null;
  })[];
};


// Mock the Supabase client
vi.mock('@/lib/supabase', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return { default: mockSupabaseClient };
});

// Import the mocked supabase client *after* vi.mock
import supabase from '@/lib/supabase';
const mockSupabaseClient = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

describe('PostRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.insert.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();
    mockSupabaseClient.range.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
    
    // Default for range with count (for pagination)
    mockSupabaseClient.range.mockResolvedValue({ data: [], error: null, count: 0 });
  });

  // --- findManyPosts ---
  describe('findManyPosts', () => {
    const mockPostId1 = 'post-id-1';
    const mockPostId2 = 'post-id-2';
    const mockUserId = 'user-id-abc';
    const mockAuthUserId = 'auth-user-xyz';

    const mockPostData: PostWithRelations[] = [
      {
        id: mockPostId1, title: 'Post 1', description: 'Desc 1', imageUrl: 'img1.jpg', userId: mockUserId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        user: { id: mockUserId, username: 'user_abc', name: 'User ABC', image: 'abc.jpg' },
        likes: [{ userId: mockAuthUserId }], // Liked by auth user
        saves: [],
        tags: [],
      },
      {
        id: mockPostId2, title: 'Post 2', description: 'Desc 2', imageUrl: 'img2.jpg', userId: 'other-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        user: { id: 'other-user', username: 'other', name: 'Other User', image: 'other.jpg' },
        likes: [],
        saves: [{ userId: mockAuthUserId }], // Saved by auth user
        tags: [],
      },
    ];

    it('should fetch posts with default pagination and map correctly', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({ data: mockPostData, error: null, count: 5 }); // Mock total count

      const { posts, total, error } = await findManyPosts({}, mockAuthUserId);

      expect(error).toBeNull();
      expect(total).toBe(5);
      expect(posts).toHaveLength(2);
      // Check mapping details for the first post
      expect(posts[0].id).toBe(mockPostId1);
      expect(posts[0].title).toBe('Post 1');
      expect(posts[0].user?.username).toBe('user_abc');
      expect(posts[0]._count?.likes).toBe(1);
      expect(posts[0]._count?.saves).toBe(0);
      expect(posts[0].isLiked).toBe(true); // Liked by auth user
      expect(posts[0].isSaved).toBe(false);
      // Check mapping details for the second post
      expect(posts[1].id).toBe(mockPostId2);
      expect(posts[1].isLiked).toBe(false);
      expect(posts[1].isSaved).toBe(true); // Saved by auth user

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Post');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.any(String), { count: 'exact' });
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9); // Default page=1, limit=10
    });

    it('should apply pagination options', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({ data: [], error: null, count: 15 });

      await findManyPosts({ page: 2, limit: 5 }, null);

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(5, 9); // page=2, limit=5 -> from=5, to=9
    });

    it('should apply userId filter', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({ data: [], error: null, count: 3 });
      
      // Reset mocks for this specific test to handle userId filter
      mockSupabaseClient.from.mockImplementation(() => {
        return {
          select: () => ({
            order: () => ({
              range: () => ({
                eq: () => Promise.resolve({ data: [], error: null, count: 3 })
              })
            })
          })
        };
      });

      await findManyPosts({ userIdParam: mockUserId }, null);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Post');
    });

    it('should return an error if Supabase fetch fails', async () => {
      const mockError = new Error('Fetch failed');
      
      // Specific mock for this test to simulate fetch failure
      mockSupabaseClient.from.mockImplementation(() => {
        return {
          select: () => ({
            order: () => ({
              range: () => Promise.resolve({ data: null, error: mockError, count: null })
            })
          })
        };
      });

      const { posts, total, error } = await findManyPosts({}, null);

      expect(error).toEqual(mockError);
      expect(posts).toEqual([]);
      expect(total).toBe(0);
    });
  });

  // --- createPost ---
  describe('createPost', () => {
    const mockUserId = 'user-creator';
    const mockPostInput = { title: 'New Post', description: 'New Desc', imageUrl: 'new.jpg' };
    const mockTagsInput = [{ productId: 'prod-1', xPosition: 10, yPosition: 20 }];
    const mockNewPostId = 'new-post-id';
    const mockCreatedPostData: PostWithRelations = { // Data fetched after creation
      id: mockNewPostId, title: 'New Post', description: 'New Desc', imageUrl: 'new.jpg', userId: mockUserId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      user: { id: mockUserId, username: 'creator', name: 'Creator', image: 'creator.jpg' },
      likes: [],
      saves: [],
      tags: [{ // Assume tags are fetched back correctly
        id: 'tag-new', postId: mockNewPostId, productId: 'prod-1', created_at: new Date().toISOString(), xPosition: 10, yPosition: 20,
        product: { id: 'prod-1', name: 'Prod 1', imageUrl: 'prod1.jpg', description: 'Prod Desc', brand: { id: 'brand-1', name: 'Brand 1' } }
      }],
    };

    it('should insert post and tags, then fetch and return the created post', async () => {
      // Reset mocks for this test
      mockSupabaseClient.from.mockImplementation((table) => {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: mockNewPostId }, error: null })
            })
          }),
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockCreatedPostData, error: null })
            })
          }),
        };
      });

      const { post, error } = await createPost(mockPostInput, mockTagsInput, mockUserId);

      expect(error).toBeNull();
      expect(post).toBeDefined();
      expect(post?.id).toBe(mockNewPostId);
      expect(post?.title).toBe(mockPostInput.title);
      expect(post?.user?.id).toBe(mockUserId);
      expect(post?.tags).toHaveLength(1);
      expect(post?.tags[0].productId).toBe('prod-1');
      expect(post?.isLiked).toBe(false);
      expect(post?.isSaved).toBe(false);
    });

    it('should create post without tags if tagsData is empty', async () => {
      const mockCreatedPostDataNoTags = { ...mockCreatedPostData, tags: [] };
      
      // Reset mocks for this test
      mockSupabaseClient.from.mockImplementation((table) => {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: mockNewPostId }, error: null })
            })
          }),
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockCreatedPostDataNoTags, error: null })
            })
          }),
        };
      });

      const { post, error } = await createPost(mockPostInput, [], mockUserId); // Empty tags array

      expect(error).toBeNull();
      expect(post).toBeDefined();
      expect(post?.id).toBe(mockNewPostId);
      expect(post?.tags).toHaveLength(0);
    });

    it('should return error if post insert fails', async () => {
      const mockInsertError = new Error('Post insert failed');
      
      // Reset mocks for this test - simulate post insert error
      mockSupabaseClient.from.mockImplementation(() => {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: mockInsertError })
            })
          })
        };
      });

      const { post, error } = await createPost(mockPostInput, mockTagsInput, mockUserId);

      expect(error).toEqual(mockInsertError);
      expect(post).toBeNull();
    });

    it('should return error if tag insert fails (and warn about inconsistency)', async () => {
      const mockTagError = new Error('Tag insert failed');
      let tableRequested = '';
      
      // Reset mocks to simulate successful post insert but failed tag insert
      mockSupabaseClient.from.mockImplementation((table) => {
        tableRequested = table;
        
        if (table === 'Post') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: mockNewPostId }, error: null })
              })
            }),
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockCreatedPostData, error: null })
              })
            }),
          };
        } else if (table === 'Tag') {
          return {
            insert: () => ({ error: mockTagError })
          };
        }
        
        return mockSupabaseClient;
      });

      const { post, error } = await createPost(mockPostInput, mockTagsInput, mockUserId);

      expect(error).toEqual(mockTagError);
      expect(post).toBeNull();
    });

    it('should return error if final fetch fails', async () => {
      const mockFetchError = new Error('Final fetch failed');
      
      // Handle the different stages of createPost
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table) => {
        callCount++;
        
        if (callCount === 1) { // First call - Post insert
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: mockNewPostId }, error: null })
              })
            })
          };
        } else if (callCount === 2) { // Second call - Tag insert
          return {
            insert: () => ({ error: null })
          };
        } else { // Third call - Final fetch
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: mockFetchError })
              })
            })
          };
        }
      });

      const { post, error } = await createPost(mockPostInput, mockTagsInput, mockUserId);

      expect(error).toEqual(mockFetchError);
      expect(post).toBeNull();
    });
  });
});
