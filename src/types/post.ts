// Type definitions related to Posts, Comments, and Tags

// Import necessary base types (adjust paths if UserProfile/Product move)
import type { UserProfile } from './user'; // Assuming UserProfile moves to user.ts
import type { Product } from './product'; // Assuming Product stays in product.ts

export interface ProductTag {
  id: string;
  postId: string;
  productId: string;
  xPosition: number;
  yPosition: number;
  createdAt: string;
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
  imageUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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
