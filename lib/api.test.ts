import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, userApi, postApi, commentApi, productApi } from './api';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('apiRequest', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiRequest('/test');

      expect(result).toEqual({
        data: mockResponse,
        error: null,
        status: 200,
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        credentials: 'include',
        headers: {},
      });
    });

    it('should handle endpoint without leading slash', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest('test');
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
    });

    it('should make a POST request with JSON body', async () => {
      const mockResponse = { success: true };
      const body = { name: 'New Item' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await apiRequest('/items', {
        method: 'POST',
        body,
      });

      expect(result).toEqual({
        data: mockResponse,
        error: null,
        status: 201,
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    });

    it('should make a POST request with FormData', async () => {
      const mockResponse = { id: 'new-id' };
      const formData = new FormData();
      formData.append('file', 'test');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiRequest('/upload', {
        method: 'POST',
        formData,
      });

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {},
        body: formData,
      });
    });

    it('should handle error response', async () => {
      const errorResponse = { error: 'Unauthorized' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      const result = await apiRequest('/protected');

      expect(result).toEqual({
        data: null,
        error: 'Unauthorized',
        status: 401,
      });
      expect(toast.error).toHaveBeenCalledWith('Unauthorized');
    });

    it('should handle error response without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const result = await apiRequest('/error');

      expect(result).toEqual({
        data: null,
        error: 'Request failed with status 500',
        status: 500,
      });
      expect(toast.error).toHaveBeenCalledWith('Request failed with status 500');
    });

    it('should handle non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await apiRequest('/text');

      expect(result).toEqual({
        data: null,
        error: null,
        status: 200,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse JSON response:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await apiRequest('/fail');

      expect(result).toEqual({
        data: null,
        error: 'Network error',
        status: 500,
      });
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });

    it('should handle unknown error', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      const result = await apiRequest('/fail');

      expect(result).toEqual({
        data: null,
        error: 'Unknown error occurred',
        status: 500,
      });
    });

    it('should not show error toast when disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await apiRequest('/notfound', { showErrorToast: false });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should pass custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiRequest('/test', {
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom': 'value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom': 'value',
        },
      });
    });
  });

  describe('userApi', () => {
    it('should get users with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [], total: 0 }),
      });

      await userApi.getUsers({ username: 'john', page: 2, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users?username=john&page=2&limit=10',
        expect.any(Object)
      );
    });

    it('should get users without filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [], total: 0 }),
      });

      await userApi.getUsers();
      expect(mockFetch).toHaveBeenCalledWith('/api/users', expect.any(Object));
    });

    it('should get user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user-123', username: 'john' }),
      });

      await userApi.getProfile('john');
      expect(mockFetch).toHaveBeenCalledWith('/api/users/john', expect.any(Object));
    });

    it('should update profile', async () => {
      const updateData = { name: 'John Doe', bio: 'Developer' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user-123', ...updateData }),
      });

      await userApi.updateProfile(updateData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
    });

    it('should follow user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await userApi.followUser('user-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/users/user-123/follow', {
        method: 'POST',
        credentials: 'include',
        headers: {},
      });
    });

    it('should unfollow user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await userApi.unfollowUser('user-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/users/user-123/follow', {
        method: 'DELETE',
        credentials: 'include',
        headers: {},
      });
    });
  });

  describe('postApi', () => {
    it('should get posts with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ posts: [], total: 0 }),
      });

      await postApi.getPosts({ userId: 'user-123', page: 1, limit: 20, sort: 'popular' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/posts?userId=user-123&page=1&sort=popular&limit=20',
        expect.any(Object)
      );
    });

    it('should get single post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'post-123', title: 'Test Post' }),
      });

      await postApi.getPost('post-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123', expect.any(Object));
    });

    it('should create post', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'new-post', title: 'New Post' }),
      });

      await postApi.createPost(formData);
      expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {},
        body: formData,
      });
    });

    it('should update post', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'post-123', title: 'Updated Post' }),
      });

      await postApi.updatePost('post-123', formData);
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123', {
        method: 'PATCH',
        credentials: 'include',
        headers: {},
        body: formData,
      });
    });

    it('should delete post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await postApi.deletePost('post-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123', {
        method: 'DELETE',
        credentials: 'include',
        headers: {},
      });
    });

    it('should like post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await postApi.likePost('post-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123/like', {
        method: 'POST',
        credentials: 'include',
        headers: {},
      });
    });

    it('should unlike post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await postApi.unlikePost('post-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123/like', {
        method: 'DELETE',
        credentials: 'include',
        headers: {},
      });
    });

    it('should save post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, saveCount: 5 }),
      });

      await postApi.savePost('post-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123/save', {
        method: 'POST',
        credentials: 'include',
        headers: {},
      });
    });

    it('should unsave post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, saveCount: 4 }),
      });

      await postApi.unsavePost('post-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123/save', {
        method: 'DELETE',
        credentials: 'include',
        headers: {},
      });
    });

    it('should get comments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ comments: [], total: 0 }),
      });

      await postApi.getComments('post-123', { page: 2, limit: 5 });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/posts/post-123/comments?page=2&limit=5',
        expect.any(Object)
      );
    });

    it('should add comment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'comment-123', content: 'Nice post!' }),
      });

      await postApi.addComment('post-123', 'Nice post!');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Nice post!' }),
      });
    });
  });

  describe('commentApi', () => {
    it('should update comment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'comment-123', content: 'Updated comment' }),
      });

      await commentApi.updateComment('comment-123', 'Updated comment');
      expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-123', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated comment' }),
      });
    });

    it('should delete comment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await commentApi.deleteComment('comment-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-123', {
        method: 'DELETE',
        credentials: 'include',
        headers: {},
      });
    });
  });

  describe('productApi', () => {
    it('should get products with all filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ products: [], total: 0 }),
      });

      await productApi.getProducts({
        name: 'lipstick',
        brandId: 'brand-123',
        categoryId: 'cat-456',
        page: 2,
        limit: 30,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products?name=lipstick&brandId=brand-123&categoryId=cat-456&page=2&limit=30',
        expect.any(Object)
      );
    });

    it('should create product', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'product-123', name: 'New Lipstick' }),
      });

      await productApi.createProduct(formData);
      expect(mockFetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        credentials: 'include',
        headers: {},
        body: formData,
      });
    });

    it('should get brands', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ brands: [], total: 0 }),
      });

      await productApi.getBrands({ name: 'Chanel', page: 1, limit: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/brands?name=Chanel&page=1&limit=10',
        expect.any(Object)
      );
    });

    it('should create brand', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'brand-123', name: 'New Brand' }),
      });

      await productApi.createBrand(formData);
      expect(mockFetch).toHaveBeenCalledWith('/api/brands', {
        method: 'POST',
        credentials: 'include',
        headers: {},
        body: formData,
      });
    });

    it('should get categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: [], total: 0 }),
      });

      await productApi.getCategories({ name: 'Lipstick', page: 1, limit: 20 });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/categories?name=Lipstick&page=1&limit=20',
        expect.any(Object)
      );
    });

    it('should create category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'cat-123', name: 'New Category' }),
      });

      await productApi.createCategory('New Category');
      expect(mockFetch).toHaveBeenCalledWith('/api/categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Category' }),
      });
    });
  });
});