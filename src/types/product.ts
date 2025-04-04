// TODO: Define types based on Supabase schema or use generated types (e.g., from src/types/supabase.ts).
// The Prisma-based types below are no longer valid after the migration.

// Example structure based on Supabase (assuming snake_case and nested relations):
/*
export interface Brand {
  id: string;
  name: string;
  // other brand fields...
}

export interface Category {
  id: string;
  name: string;
  // other category fields...
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Foreign key IDs might still be useful depending on usage
  brand_id: string; 
  category_id: string;
  // Nested relations as returned by Supabase select
  brands: Brand | null; // Supabase returns relation name as key
  categories: Category | null; // Supabase returns relation name as key
}
*/

export interface Brand {
  id: string;
  name: string;
}
export interface Category {
  id: string;
  name: string;
}
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null; // Matches DB schema
  brandId: string; // Matches DB schema (camelCase FK)
  categoryId: string; // Matches DB schema (camelCase FK)
  // Use singular relation names matching user data structure
  brand: Brand | null;
  category: Category | null;
  // Add timestamps matching DB schema (snake_case)
  created_at: string;
  updated_at: string;
}

// --- User, Post, Comment, Tag Types (Aligned with User Data) ---

export interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  image: string | null; // Changed from imageUrl
  // bio: string | null; // Keep if needed
  // isFollowing?: boolean; // Keep if needed
  // isCurrentUser?: boolean; // Keep if needed
  // Add count object based on usage in page.tsx
  // Add counts if needed based on user profile page usage
  // _count?: {
  //   posts?: number;
  //   followers?: number;
  //   following?: number;
  // } | null;
}

export interface ProductTag {
  id: string;
  postId: string;
  productId: string;
  xPosition: number; // Changed from x_position to match log data
  yPosition: number; // Changed from y_position to match log data
  createdAt: string;
  // Use singular relation name matching user data structure
  product: Product | null;
}

export interface Comment {
  id: string;
  content: string;
  userId: string; // Changed from user_id
  postId: string; // Changed from post_id
  createdAt: string; // Changed from created_at
  // Use singular relation name matching user data structure
  user: UserProfile | null;
}

// Like type might not be directly used in Post if only count is needed
// export interface Like {
//     id: string;
//     userId: string; // Changed from user_id
//     postId: string; // Changed from post_id
//     createdAt: string; // Changed from created_at
// }

export interface Post {
  id: string;
  title: string; // Added title
  description: string | null; // Added description
  imageUrl: string; // Changed from image_url
  userId: string; // Changed from user_id
  createdAt: string; // Changed from created_at
  updatedAt: string; // Changed from updated_at
  // Relations matching user data structure
  user: UserProfile | null; // Changed from users
  comments: Comment[]; // Kept as array
  tags: ProductTag[]; // Kept as array
  // Add _count based on user data structure
  _count: {
    likes: number;
    comments: number;
  } | null;
  // Add properties populated by API based on current user (if applicable)
  isLiked?: boolean;
  isSaved?: boolean;
}

// --- Utility and Paginated Types ---

// Generic type for paginated API responses (Keep as is if used)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
    // Add other pagination fields if needed
  };
}

// Specific paginated types
// Define a specific type for the posts list API response
export interface PostsApiResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean; // Calculate this on the server if possible
    pages?: number; // Optional: Keep if calculated on server
  };
}
// Keep others generic for now, assuming they might use the 'data' key
export type PaginatedUsers = PaginatedResponse<UserProfile>;
// export type PaginatedPosts = PaginatedResponse<Post>; // Remove this generic type
export type PaginatedComments = PaginatedResponse<Comment>;
export type PaginatedProducts = PaginatedResponse<Product>;
// Use renamed ProductTag type
export type PaginatedTags = PaginatedResponse<ProductTag>;
export type PaginatedBrands = PaginatedResponse<Brand>;
export type PaginatedCategories = PaginatedResponse<Category>;

// Type for API request function options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData; // Allow FormData for file uploads
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
  formData?: FormData; // Add formData for direct handling in apiRequest if needed
  showErrorToast?: boolean; // Add showErrorToast option
}
