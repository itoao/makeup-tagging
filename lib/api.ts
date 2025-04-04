import { toast } from 'sonner';
import {
  ApiRequestOptions,
  PaginatedUsers,
  UserProfile,
  // PaginatedPosts, // Removed generic type
  PostsApiResponse, // Import the specific type
  Post,
  // Like,
  PaginatedComments,
  Comment,
  PaginatedProducts,
  Product,
  PaginatedBrands,
  Brand,
  PaginatedCategories,
  Category,
} from '@/src/types/product'; // Adjust path if necessary

// APIリクエストの基本設定
const API_BASE_URL = '/api';

// APIレスポンスの型 (Keep this local or move to types file if preferred)
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * APIリクエストを実行する関数
 * @param endpoint APIエンドポイント
 * @param options リクエストオプション (Using imported ApiRequestOptions)
 * @returns APIレスポンス
 */
export async function apiRequest<T = unknown>( // Default generic to unknown
  endpoint: string,
  options: ApiRequestOptions = {} // Use imported ApiRequestOptions
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    // Note: ApiRequestOptions uses queryParams, not formData directly handled here
    // formData handling remains as is for now, but consider aligning with ApiRequestOptions
    body,
    headers = {},
    formData,
    showErrorToast = true,
  } = options;

  // URLを構築
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // リクエストオプションを構築
  const requestOptions: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      ...headers,
    },
  };

  // FormDataまたはJSONボディを設定
  if (formData) {
    requestOptions.body = formData;
  } else if (body) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'Content-Type': 'application/json',
    };
    requestOptions.body = JSON.stringify(body);
  }

  try {
    // リクエストを実行
    const response = await fetch(url, requestOptions);
    const status = response.status;

    // JSONレスポンスを取得（可能な場合）
    let data = null;
    let error = null;

    try {
      data = await response.json();
    } catch (e) {
      // JSONでないレスポンスの場合
      console.error('Failed to parse JSON response:', e);
    }

    // エラーレスポンスの場合
    if (!response.ok) {
      error = data?.error || `Request failed with status ${status}`;
      
      if (showErrorToast && error) {
        toast.error(error);
      }
      
      return { data: null, error, status };
    }

    return { data, error: null, status };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (showErrorToast) {
      toast.error(errorMessage);
    }
    
    return { data: null, error: errorMessage, status: 500 };
  }
}

// ユーザー関連のAPI関数
export const userApi = {
  // ユーザー一覧を取得
  getUsers: (params?: { username?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.username) queryParams.append('username', params.username);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Use PaginatedUsers type
    return apiRequest<PaginatedUsers>(`/users${query}`);
  },

  // ユーザープロフィールを取得 (identifier can be username or userId)
  getProfile: (identifier: string) => { 
    // Use UserProfile type
    return apiRequest<UserProfile>(`/users/${identifier}`); 
  },

  // ユーザープロフィールを更新
  updateProfile: (data: { name?: string; bio?: string }) => {
    // Use UserProfile type for the response (assuming API returns updated profile)
    return apiRequest<UserProfile>('/users', {
      method: 'PATCH',
      body: data as Record<string, unknown>, // Cast body to Record<string, unknown>
    });
  },
  
  // ユーザーをフォロー (identifier can be username or userId)
  followUser: (identifier: string) => { 
    // Assuming API returns simple success/error, use a basic type or void
    return apiRequest<{ success: boolean }>(`/users/${identifier}/follow`, { 
      method: 'POST',
    });
  },

  // ユーザーのフォローを解除 (identifier can be username or userId)
  unfollowUser: (identifier: string) => { 
    // Assuming API returns simple success/error, use a basic type or void
    return apiRequest<{ success: boolean }>(`/users/${identifier}/follow`, { 
      method: 'DELETE',
    });
  },
};

// 投稿関連のAPI関数
export const postApi = {
  // 投稿一覧を取得
  getPosts: (params?: { userId?: string; page?: number; limit?: number; sort?: 'popular' | 'latest' | string }) => { // Add sort parameter
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.sort) queryParams.append('sort', params.sort); // Add sort to query params
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Use the specific PostsApiResponse type
    return apiRequest<PostsApiResponse>(`/posts${query}`);
  },

  // 投稿を取得
  getPost: (postId: string) => {
    // Use Post type
    return apiRequest<Post>(`/posts/${postId}`);
  },

  // 投稿を作成
  createPost: (formData: FormData) => {
    // Use Post type for the response (assuming API returns created post)
    return apiRequest<Post>('/posts', {
      method: 'POST',
      body: formData, // Pass FormData directly to body
    });
  },

  // 投稿を更新
  updatePost: (postId: string, formData: FormData) => {
    // Use Post type for the response (assuming API returns updated post)
    return apiRequest<Post>(`/posts/${postId}`, {
      method: 'PATCH',
      body: formData, // Pass FormData directly to body
    });
  },

  // 投稿を削除
  deletePost: (postId: string) => {
    // Assuming API returns simple success/error
    return apiRequest<{ success: boolean }>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  // 投稿にいいねする
  likePost: (postId: string) => {
    // Assuming API returns simple success/error, similar to unlikePost
    return apiRequest<{ success: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  // 投稿のいいねを解除
  unlikePost: (postId: string) => {
    // Assuming API returns simple success/error
    return apiRequest<{ success: boolean }>(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  },

  // 投稿を保存（ブックマーク）する
  savePost: (postId: string) => {
    return apiRequest<{ success: boolean; saveCount?: number }>(`/posts/${postId}/save`, {
      method: 'POST',
    });
  },

  // 投稿の保存（ブックマーク）を解除する
  unsavePost: (postId: string) => {
    return apiRequest<{ success: boolean; saveCount?: number }>(`/posts/${postId}/save`, {
      method: 'DELETE',
    });
  },

  // 投稿のコメント一覧を取得
  getComments: (postId: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Use PaginatedComments type
    return apiRequest<PaginatedComments>(`/posts/${postId}/comments${query}`);
  },

  // 投稿にコメントを追加
  addComment: (postId: string, content: string) => {
    // Use Comment type for the response (assuming API returns created comment)
    return apiRequest<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content }, // Body is already Record<string, unknown> compatible
    });
  },
};

// コメント関連のAPI関数
export const commentApi = {
  // コメントを更新
  updateComment: (commentId: string, content: string) => {
    // Use Comment type for the response (assuming API returns updated comment)
    return apiRequest<Comment>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: { content }, // Body is already Record<string, unknown> compatible
    });
  },

  // コメントを削除
  deleteComment: (commentId: string) => {
    // Assuming API returns simple success/error
    return apiRequest<{ success: boolean }>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// 製品関連のAPI関数
export const productApi = {
  // 製品一覧を取得
  getProducts: (params?: { name?: string; brandId?: string; categoryId?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append('name', params.name);
    if (params?.brandId) queryParams.append('brandId', params.brandId);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Use PaginatedProducts type
    return apiRequest<PaginatedProducts>(`/products${query}`);
  },

  // 製品を作成
  createProduct: (formData: FormData) => {
    // Use Product type for the response (assuming API returns created product)
    return apiRequest<Product>('/products', {
      method: 'POST',
      body: formData, // Pass FormData directly to body
    });
  },

  // ブランド一覧を取得
  getBrands: (params?: { name?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append('name', params.name);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Use PaginatedBrands type
    return apiRequest<PaginatedBrands>(`/brands${query}`);
  },

  // ブランドを作成
  createBrand: (formData: FormData) => {
    // Use Brand type for the response (assuming API returns created brand)
    return apiRequest<Brand>('/brands', {
      method: 'POST',
      body: formData, // Pass FormData directly to body
    });
  },

  // カテゴリー一覧を取得
  getCategories: (params?: { name?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append('name', params.name);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Use PaginatedCategories type
    return apiRequest<PaginatedCategories>(`/categories${query}`);
  },

  // カテゴリーを作成
  createCategory: (name: string) => {
    // Use Category type for the response (assuming API returns created category)
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: { name }, // Body is already Record<string, unknown> compatible
    });
  },
};
