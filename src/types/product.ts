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
*/

// --- Product, Brand, Category Types ---

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
  price?: number | null;
  imageUrl: string | null;
  brandId?: string | null; // Allow null
  categoryId?: string | null; // Allow null
  brand: Brand | null;
  category: Category | null;
  created_at?: string | null; // Allow null
  updated_at?: string | null; // Allow null
}


// --- Utility and Paginated Types ---

// Generic type for paginated API responses
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


// Specific paginated types for entities remaining in this file
export type PaginatedProducts = PaginatedResponse<Product>;
export type PaginatedBrands = PaginatedResponse<Brand>;
export type PaginatedCategories = PaginatedResponse<Category>;

// Note: PaginatedUsers, PaginatedPosts, PaginatedComments, PaginatedTags
// should be defined in their respective type files (user.ts, post.ts) if needed.

// Type for API request function options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData; // Allow FormData for file uploads
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
  formData?: FormData; // Add formData for direct handling in apiRequest if needed
  showErrorToast?: boolean; // Add showErrorToast option
}
