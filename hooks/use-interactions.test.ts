/**
 * インタラクションフックのユニットテスト
 * いいね、保存、フォロー機能のテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLikePost, useSavePost, useFollowUser } from './use-interactions';
import { postApi, userApi } from '@/lib/api';
import { toast } from 'sonner';

// モック設定
vi.mock('@/lib/api');
vi.mock('sonner');
vi.mock('immer', () => ({
  produce: vi.fn((state, updateFn) => {
    const draft = JSON.parse(JSON.stringify(state));
    updateFn(draft);
    return draft;
  }),
}));

// React Query のテスト用ラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use-interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLikePost', () => {
    it('should like a post successfully', async () => {
      const mockLikePost = vi.mocked(postApi.likePost);
      mockLikePost.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLikePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isLiked: false });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockLikePost).toHaveBeenCalledWith('post-1');
    });

    it('should unlike a post successfully', async () => {
      const mockUnlikePost = vi.mocked(postApi.unlikePost);
      mockUnlikePost.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLikePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isLiked: true });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUnlikePost).toHaveBeenCalledWith('post-1');
    });

    it('should handle like error and show toast', async () => {
      const mockLikePost = vi.mocked(postApi.likePost);
      const mockToastError = vi.mocked(toast.error);
      mockLikePost.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLikePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isLiked: false });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('いいねの追加に失敗しました');
    });

    it('should handle unlike error and show toast', async () => {
      const mockUnlikePost = vi.mocked(postApi.unlikePost);
      const mockToastError = vi.mocked(toast.error);
      mockUnlikePost.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLikePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isLiked: true });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('いいねの解除に失敗しました');
    });

    it('should return correct state after successful like', async () => {
      const mockLikePost = vi.mocked(postApi.likePost);
      mockLikePost.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLikePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isLiked: false });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ postId: 'post-1', isLiked: true });
    });
  });

  describe('useSavePost', () => {
    it('should save a post successfully', async () => {
      const mockSavePost = vi.mocked(postApi.savePost);
      mockSavePost.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSavePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isSaved: false });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSavePost).toHaveBeenCalledWith('post-1');
    });

    it('should unsave a post successfully', async () => {
      const mockUnsavePost = vi.mocked(postApi.unsavePost);
      mockUnsavePost.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSavePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isSaved: true });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUnsavePost).toHaveBeenCalledWith('post-1');
    });

    it('should handle save error and show toast', async () => {
      const mockSavePost = vi.mocked(postApi.savePost);
      const mockToastError = vi.mocked(toast.error);
      mockSavePost.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSavePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isSaved: false });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('投稿の保存に失敗しました');
    });

    it('should handle unsave error and show toast', async () => {
      const mockUnsavePost = vi.mocked(postApi.unsavePost);
      const mockToastError = vi.mocked(toast.error);
      mockUnsavePost.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSavePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isSaved: true });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('投稿の保存解除に失敗しました');
    });

    it('should return correct state after successful save', async () => {
      const mockSavePost = vi.mocked(postApi.savePost);
      mockSavePost.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSavePost(), { wrapper });

      result.current.mutate({ postId: 'post-1', isSaved: false });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ postId: 'post-1', isSaved: true });
    });
  });

  describe('useFollowUser', () => {
    it('should follow a user successfully', async () => {
      const mockFollowUser = vi.mocked(userApi.followUser);
      mockFollowUser.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useFollowUser(), { wrapper });

      result.current.mutate({ userId: 'user-1', isFollowing: false });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFollowUser).toHaveBeenCalledWith('user-1');
    });

    it('should unfollow a user successfully', async () => {
      const mockUnfollowUser = vi.mocked(userApi.unfollowUser);
      mockUnfollowUser.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useFollowUser(), { wrapper });

      result.current.mutate({ userId: 'user-1', isFollowing: true });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUnfollowUser).toHaveBeenCalledWith('user-1');
    });

    it('should handle follow error and show toast', async () => {
      const mockFollowUser = vi.mocked(userApi.followUser);
      const mockToastError = vi.mocked(toast.error);
      mockFollowUser.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useFollowUser(), { wrapper });

      result.current.mutate({ userId: 'user-1', isFollowing: false });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('フォローに失敗しました');
    });

    it('should handle unfollow error and show toast', async () => {
      const mockUnfollowUser = vi.mocked(userApi.unfollowUser);
      const mockToastError = vi.mocked(toast.error);
      mockUnfollowUser.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useFollowUser(), { wrapper });

      result.current.mutate({ userId: 'user-1', isFollowing: true });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith('フォロー解除に失敗しました');
    });

    it('should return correct state after successful follow', async () => {
      const mockFollowUser = vi.mocked(userApi.followUser);
      mockFollowUser.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useFollowUser(), { wrapper });

      result.current.mutate({ userId: 'user-1', isFollowing: false });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ userId: 'user-1', isFollowing: true });
    });
  });
});