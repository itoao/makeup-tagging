/**
 * 型定義のバリデーション関数
 * 実行時に型の整合性を検証するためのユーティリティ
 */
import type { Product, Brand, Category, PaginatedResponse } from './product';
import type { Post, Comment, ProductTag, PostsApiResponse } from './post';
import type { UserProfile } from './user';

/**
 * Product型のバリデーション
 */
export function isValidProduct(obj: any): obj is Product {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    (obj.price === undefined || obj.price === null || typeof obj.price === 'number') &&
    (obj.imageUrl === null || typeof obj.imageUrl === 'string') &&
    (obj.brandId === undefined || obj.brandId === null || typeof obj.brandId === 'string') &&
    (obj.categoryId === undefined || obj.categoryId === null || typeof obj.categoryId === 'string')
  );
}

/**
 * Brand型のバリデーション
 */
export function isValidBrand(obj: any): obj is Brand {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}

/**
 * Category型のバリデーション
 */
export function isValidCategory(obj: any): obj is Category {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}

/**
 * UserProfile型のバリデーション
 */
export function isValidUserProfile(obj: any): obj is UserProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    (obj.username === null || typeof obj.username === 'string') &&
    (obj.name === null || typeof obj.name === 'string') &&
    (obj.image === null || typeof obj.image === 'string')
  );
}

/**
 * Comment型のバリデーション
 */
export function isValidComment(obj: any): obj is Comment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.postId === 'string' &&
    (obj.createdAt === null || typeof obj.createdAt === 'string')
  );
}

/**
 * ProductTag型のバリデーション
 */
export function isValidProductTag(obj: any): obj is ProductTag {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    (obj.postId === null || typeof obj.postId === 'string') &&
    (obj.productId === null || typeof obj.productId === 'string') &&
    typeof obj.xPosition === 'number' &&
    typeof obj.yPosition === 'number' &&
    (obj.createdAt === null || typeof obj.createdAt === 'string')
  );
}

/**
 * Post型のバリデーション
 */
export function isValidPost(obj: any): obj is Post {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    (obj.imageUrl === null || typeof obj.imageUrl === 'string') &&
    typeof obj.userId === 'string' &&
    typeof obj.createdAt === 'string' &&
    (obj.updatedAt === null || typeof obj.updatedAt === 'string') &&
    Array.isArray(obj.tags)
  );
}

/**
 * PaginatedResponse型のバリデーション
 */
export function isValidPaginatedResponse<T>(
  obj: any,
  itemValidator: (item: any) => item is T
): obj is PaginatedResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray(obj.data) &&
    obj.data.every(itemValidator) &&
    typeof obj.pagination === 'object' &&
    obj.pagination !== null &&
    typeof obj.pagination.page === 'number' &&
    typeof obj.pagination.limit === 'number' &&
    typeof obj.pagination.total === 'number' &&
    typeof obj.pagination.hasNextPage === 'boolean'
  );
}

/**
 * PostsApiResponse型のバリデーション
 */
export function isValidPostsApiResponse(obj: any): obj is PostsApiResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray(obj.posts) &&
    obj.posts.every(isValidPost) &&
    typeof obj.pagination === 'object' &&
    obj.pagination !== null &&
    typeof obj.pagination.page === 'number' &&
    typeof obj.pagination.limit === 'number' &&
    typeof obj.pagination.total === 'number' &&
    typeof obj.pagination.hasNextPage === 'boolean'
  );
}