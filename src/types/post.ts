// Type definitions related to Posts, Comments, and Tags

// Import necessary base types (adjust paths if UserProfile/Product move)
import type { UserProfile } from './user'; // Assuming UserProfile moves to user.ts
import type { Product } from './product'; // Assuming Product stays in product.ts

export interface ProductTag {
  id: string;
  postId: string | null; // Allow null
  productId: string | null; // Allow null
  xPosition: number;
  yPosition: number;
  createdAt: string | null; // Allow null
  product: Product | null;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  user: UserProfile | null;
}

export interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null; // Allow null based on schema/PostRow
  userId: string;
  createdAt: string;
  updatedAt: string | null; // Allow null based on schema/PostRow
  user: UserProfile | null;
  comments?: Comment[]; // Optional as not always fetched together
  tags: ProductTag[];
  _count: {
    likes: number;
    comments: number;
    saves: number;
  } | null;
  isLiked?: boolean; // Populated based on current user context
  isSaved?: boolean; // Populated based on current user context
}

// Specific type for the posts list API response
export interface PostsApiResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
    pages?: number;
  };
}

// Generic PaginatedResponse (assuming it's defined elsewhere or here)
// If PaginatedResponse is not defined globally, define it here or import it
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

export type PaginatedComments = PaginatedResponse<Comment>;
