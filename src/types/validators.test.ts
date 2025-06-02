/**
 * 型バリデーション関数のユニットテスト
 * 型定義の整合性を検証するテスト
 */
import { describe, it, expect } from 'vitest';
import {
  isValidProduct,
  isValidBrand,
  isValidCategory,
  isValidUserProfile,
  isValidComment,
  isValidProductTag,
  isValidPost,
  isValidPaginatedResponse,
  isValidPostsApiResponse,
} from './validators';

describe('Type Validators', () => {
  describe('isValidProduct', () => {
    it('should validate a complete product object', () => {
      const validProduct = {
        id: 'product-1',
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        imageUrl: 'https://example.com/image.jpg',
        brandId: 'brand-1',
        categoryId: 'category-1',
        brand: { id: 'brand-1', name: 'Test Brand' },
        category: { id: 'category-1', name: 'Test Category' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(isValidProduct(validProduct)).toBe(true);
    });

    it('should validate a minimal product object with null values', () => {
      const minimalProduct = {
        id: 'product-1',
        name: 'Test Product',
        description: null,
        imageUrl: null,
        brand: null,
        category: null,
      };

      expect(isValidProduct(minimalProduct)).toBe(true);
    });

    it('should reject invalid product objects', () => {
      expect(isValidProduct(null)).toBe(false);
      expect(isValidProduct({})).toBe(false);
      expect(isValidProduct({ id: 123 })).toBe(false);
      expect(isValidProduct({ id: 'product-1' })).toBe(false);
    });
  });

  describe('isValidBrand', () => {
    it('should validate a valid brand object', () => {
      const validBrand = {
        id: 'brand-1',
        name: 'Test Brand',
      };

      expect(isValidBrand(validBrand)).toBe(true);
    });

    it('should reject invalid brand objects', () => {
      expect(isValidBrand(null)).toBe(false);
      expect(isValidBrand({})).toBe(false);
      expect(isValidBrand({ id: 'brand-1' })).toBe(false);
      expect(isValidBrand({ name: 'Test Brand' })).toBe(false);
    });
  });

  describe('isValidCategory', () => {
    it('should validate a valid category object', () => {
      const validCategory = {
        id: 'category-1',
        name: 'Test Category',
      };

      expect(isValidCategory(validCategory)).toBe(true);
    });

    it('should reject invalid category objects', () => {
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory({})).toBe(false);
      expect(isValidCategory({ id: 'category-1' })).toBe(false);
      expect(isValidCategory({ name: 'Test Category' })).toBe(false);
    });
  });

  describe('isValidUserProfile', () => {
    it('should validate a complete user profile', () => {
      const validUser = {
        id: 'user-1',
        username: 'testuser',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      };

      expect(isValidUserProfile(validUser)).toBe(true);
    });

    it('should validate a user profile with null values', () => {
      const minimalUser = {
        id: 'user-1',
        username: null,
        name: null,
        image: null,
      };

      expect(isValidUserProfile(minimalUser)).toBe(true);
    });

    it('should reject invalid user profile objects', () => {
      expect(isValidUserProfile(null)).toBe(false);
      expect(isValidUserProfile({})).toBe(false);
      expect(isValidUserProfile({ username: 'test' })).toBe(false);
    });
  });

  describe('isValidComment', () => {
    it('should validate a valid comment object', () => {
      const validComment = {
        id: 'comment-1',
        content: 'Test comment',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: '2023-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'testuser',
          name: 'Test User',
          image: null,
        },
      };

      expect(isValidComment(validComment)).toBe(true);
    });

    it('should validate a comment with null createdAt', () => {
      const commentWithNullDate = {
        id: 'comment-1',
        content: 'Test comment',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: null,
        user: null,
      };

      expect(isValidComment(commentWithNullDate)).toBe(true);
    });

    it('should reject invalid comment objects', () => {
      expect(isValidComment(null)).toBe(false);
      expect(isValidComment({})).toBe(false);
      expect(isValidComment({ id: 'comment-1' })).toBe(false);
    });
  });

  describe('isValidProductTag', () => {
    it('should validate a valid product tag object', () => {
      const validTag = {
        id: 'tag-1',
        postId: 'post-1',
        productId: 'product-1',
        xPosition: 50.5,
        yPosition: 75.2,
        createdAt: '2023-01-01T00:00:00Z',
        product: {
          id: 'product-1',
          name: 'Test Product',
          description: null,
          imageUrl: null,
          brand: null,
          category: null,
        },
      };

      expect(isValidProductTag(validTag)).toBe(true);
    });

    it('should validate a product tag with null values', () => {
      const tagWithNulls = {
        id: 'tag-1',
        postId: null,
        productId: null,
        xPosition: 0,
        yPosition: 0,
        createdAt: null,
        product: null,
      };

      expect(isValidProductTag(tagWithNulls)).toBe(true);
    });

    it('should reject invalid product tag objects', () => {
      expect(isValidProductTag(null)).toBe(false);
      expect(isValidProductTag({})).toBe(false);
      expect(isValidProductTag({ id: 'tag-1', xPosition: 'invalid' })).toBe(false);
    });
  });

  describe('isValidPost', () => {
    it('should validate a complete post object', () => {
      const validPost = {
        id: 'post-1',
        title: 'Test Post',
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
        userId: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'testuser',
          name: 'Test User',
          image: null,
        },
        comments: [],
        tags: [],
        _count: {
          likes: 5,
          comments: 2,
          saves: 1,
        },
        isLiked: true,
        isSaved: false,
      };

      expect(isValidPost(validPost)).toBe(true);
    });

    it('should validate a minimal post object', () => {
      const minimalPost = {
        id: 'post-1',
        title: 'Test Post',
        description: null,
        imageUrl: null,
        userId: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: null,
        user: null,
        tags: [],
        _count: null,
      };

      expect(isValidPost(minimalPost)).toBe(true);
    });

    it('should reject invalid post objects', () => {
      expect(isValidPost(null)).toBe(false);
      expect(isValidPost({})).toBe(false);
      expect(isValidPost({ id: 'post-1', tags: 'not-array' })).toBe(false);
    });
  });

  describe('isValidPaginatedResponse', () => {
    it('should validate a paginated response with valid items', () => {
      const validResponse = {
        data: [
          { id: 'brand-1', name: 'Test Brand' },
          { id: 'brand-2', name: 'Another Brand' },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          hasNextPage: false,
        },
      };

      expect(isValidPaginatedResponse(validResponse, isValidBrand)).toBe(true);
    });

    it('should reject paginated response with invalid items', () => {
      const invalidResponse = {
        data: [
          { id: 'brand-1', name: 'Test Brand' },
          { id: 123 }, // Invalid brand
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          hasNextPage: false,
        },
      };

      expect(isValidPaginatedResponse(invalidResponse, isValidBrand)).toBe(false);
    });

    it('should reject invalid pagination structure', () => {
      const invalidPagination = {
        data: [],
        pagination: {
          page: 'invalid',
          limit: 10,
          total: 0,
          hasNextPage: false,
        },
      };

      expect(isValidPaginatedResponse(invalidPagination, isValidBrand)).toBe(false);
    });
  });

  describe('isValidPostsApiResponse', () => {
    it('should validate a valid posts API response', () => {
      const validResponse = {
        posts: [
          {
            id: 'post-1',
            title: 'Test Post',
            description: null,
            imageUrl: null,
            userId: 'user-1',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: null,
            user: null,
            tags: [],
            _count: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          hasNextPage: false,
          pages: 1,
        },
      };

      expect(isValidPostsApiResponse(validResponse)).toBe(true);
    });

    it('should reject invalid posts API response', () => {
      const invalidResponse = {
        posts: 'not-array',
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          hasNextPage: false,
        },
      };

      expect(isValidPostsApiResponse(invalidResponse)).toBe(false);
    });
  });
});