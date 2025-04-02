import { toast } from 'sonner';

// APIリクエストの基本設定
const API_BASE_URL = '/api';

// APIリクエストのオプション
interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  formData?: FormData;
  showErrorToast?: boolean;
}

// APIレスポンスの型
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * APIリクエストを実行する関数
 * @param endpoint APIエンドポイント
 * @param options リクエストオプション
 * @returns APIレスポンス
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
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
    return apiRequest<{ users: any[]; pagination: any }>(`/users${query}`);
  },
  
  // ユーザープロフィールを取得
  getProfile: (username: string) => {
    return apiRequest<any>(`/users/${username}`);
  },
  
  // ユーザープロフィールを更新
  updateProfile: (data: { name?: string; bio?: string }) => {
    return apiRequest<any>('/users', {
      method: 'PATCH',
      body: data,
    });
  },
  
  // ユーザーをフォロー
  followUser: (username: string) => {
    return apiRequest<any>(`/users/${username}/follow`, {
      method: 'POST',
    });
  },
  
  // ユーザーのフォローを解除
  unfollowUser: (username: string) => {
    return apiRequest<any>(`/users/${username}/follow`, {
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
    return apiRequest<{ posts: any[]; pagination: any }>(`/posts${query}`);
  },
  
  // 投稿を取得
  getPost: (postId: string) => {
    return apiRequest<any>(`/posts/${postId}`);
  },
  
  // 投稿を作成
  createPost: (formData: FormData) => {
    return apiRequest<any>('/posts', {
      method: 'POST',
      formData,
    });
  },
  
  // 投稿を更新
  updatePost: (postId: string, formData: FormData) => {
    return apiRequest<any>(`/posts/${postId}`, {
      method: 'PATCH',
      formData,
    });
  },
  
  // 投稿を削除
  deletePost: (postId: string) => {
    return apiRequest<any>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },
  
  // 投稿にいいねする
  likePost: (postId: string) => {
    return apiRequest<any>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },
  
  // 投稿のいいねを解除
  unlikePost: (postId: string) => {
    return apiRequest<any>(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  },
  
  // 投稿のコメント一覧を取得
  getComments: (postId: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<{ comments: any[]; pagination: any }>(`/posts/${postId}/comments${query}`);
  },
  
  // 投稿にコメントを追加
  addComment: (postId: string, content: string) => {
    return apiRequest<any>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content },
    });
  },
};

// コメント関連のAPI関数
export const commentApi = {
  // コメントを更新
  updateComment: (commentId: string, content: string) => {
    return apiRequest<any>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: { content },
    });
  },
  
  // コメントを削除
  deleteComment: (commentId: string) => {
    return apiRequest<any>(`/comments/${commentId}`, {
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
    return apiRequest<{ products: any[]; pagination: any }>(`/products${query}`);
  },
  
  // 製品を作成
  createProduct: (formData: FormData) => {
    return apiRequest<any>('/products', {
      method: 'POST',
      formData,
    });
  },
  
  // ブランド一覧を取得
  getBrands: (params?: { name?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append('name', params.name);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<{ brands: any[]; pagination: any }>(`/brands${query}`);
  },
  
  // ブランドを作成
  createBrand: (formData: FormData) => {
    return apiRequest<any>('/brands', {
      method: 'POST',
      formData,
    });
  },
  
  // カテゴリー一覧を取得
  getCategories: (params?: { name?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append('name', params.name);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<{ categories: any[]; pagination: any }>(`/categories${query}`);
  },
  
  // カテゴリーを作成
  createCategory: (name: string) => {
    return apiRequest<any>('/categories', {
      method: 'POST',
      body: { name },
    });
  },
};
