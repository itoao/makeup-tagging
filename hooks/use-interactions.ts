import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi, userApi } from '@/lib/api';
import { Post, UserProfile } from '@/src/types/product'; // Import necessary types
import { PostsApiResponse } from '@/src/types/product'; // Import PostsApiResponse
import { produce } from 'immer'; // Use immer for easier state updates
import { toast } from 'sonner';

// --- Optimistic Update Helpers ---

// Helper to update post data in query cache (for lists and single post)
const updatePostInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  updateFn: (post: Post | undefined) => Post | undefined | void
) => {
  // Update single post query cache
  queryClient.setQueryData<Post>(['post', postId], (oldData) => {
    if (!oldData) return undefined;
    return produce(oldData, updateFn);
  });

   // Update paginated posts query cache
   queryClient.setQueryData<PostsApiResponse>(['posts'], (oldData) => {
      if (!oldData) return undefined;
      return produce(oldData, (draft) => {
        // Explicitly type 'p' as Post
        const postIndex = draft.posts.findIndex((p: Post) => p.id === postId); 
        if (postIndex !== -1) {
          const updatedPost = updateFn(draft.posts[postIndex]);
          if (updatedPost) {
            draft.posts[postIndex] = updatedPost;
         }
       }
     });
  });
  // TODO: Update other relevant post list queries (e.g., user-specific posts) if necessary
};

// Helper to update user profile data in query cache
const updateUserInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  updateFn: (user: UserProfile | undefined) => UserProfile | undefined | void
) => {
  queryClient.setQueryData<UserProfile>(['userProfile', userId], (oldData) => {
    if (!oldData) return undefined;
    return produce(oldData, updateFn);
  });
  // TODO: Update other relevant user list queries if necessary
};


// --- Mutation Hooks ---

/**
 * Hook for liking/unliking a post
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await postApi.unlikePost(postId);
      } else {
        await postApi.likePost(postId);
      }
      return { postId, isLiked: !isLiked }; // Return the new state
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      await queryClient.cancelQueries({ queryKey: ['posts'] }); // Cancel list queries too

      // Snapshot the previous value
      const previousPost = queryClient.getQueryData<Post>(['post', postId]);
      const previousPosts = queryClient.getQueryData<PostsApiResponse>(['posts']);

      // Optimistically update to the new value
      updatePostInCache(queryClient, postId, (post) => {
        if (post) {
          post.isLiked = !isLiked;
          if (post._count) {
            post._count.likes = isLiked
              ? Math.max(0, (post._count.likes ?? 0) - 1)
              : (post._count.likes ?? 0) + 1;
          }
        }
      });

      // Return a context object with the snapshotted value
      return { previousPost, previousPosts };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      toast.error(`いいねの${variables.isLiked ? '解除' : '追加'}に失敗しました`);
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.postId], context.previousPost);
      }
       if (context?.previousPosts) {
         queryClient.setQueryData(['posts'], context.previousPosts);
       }
    },
    // Always refetch after error or success:
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // TODO: Invalidate other relevant post list queries
    },
  });
};

/**
 * Hook for saving/unsaving a post
 */
export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (isSaved) {
        await postApi.unsavePost(postId);
      } else {
        await postApi.savePost(postId);
      }
       return { postId, isSaved: !isSaved };
    },
    onMutate: async ({ postId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousPost = queryClient.getQueryData<Post>(['post', postId]);
      const previousPosts = queryClient.getQueryData<PostsApiResponse>(['posts']);

      updatePostInCache(queryClient, postId, (post) => {
        if (post) {
          post.isSaved = !isSaved;
          // Optionally update save count if API returns it and it's stored
          // if (post._count) {
          //   post._count.saves = isSaved
          //     ? Math.max(0, (post._count.saves ?? 0) - 1)
          //     : (post._count.saves ?? 0) + 1;
          // }
        }
      });

      return { previousPost, previousPosts };
    },
    onError: (err, variables, context) => {
      toast.error(`投稿の${variables.isSaved ? '保存解除' : '保存'}に失敗しました`);
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.postId], context.previousPost);
      }
       if (context?.previousPosts) {
         queryClient.setQueryData(['posts'], context.previousPosts);
       }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // TODO: Invalidate saved posts query if it exists
    },
  });
};

/**
 * Hook for following/unfollowing a user
 */
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  // Define the expected shape of the data returned by userApi.getProfile used in cache
  interface UserProfileApiResponse extends UserProfile {
    isFollowing: boolean;
    isCurrentUser: boolean;
  }

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        await userApi.unfollowUser(userId);
      } else {
        await userApi.followUser(userId);
      }
      return { userId, isFollowing: !isFollowing };
    },
    onMutate: async ({ userId, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ['userProfile', userId] });

      // Snapshot the previous value - Use the extended type here
      const previousUserProfile = queryClient.getQueryData<UserProfileApiResponse>(['userProfile', userId]);

      // Optimistically update the user profile cache
      queryClient.setQueryData<UserProfileApiResponse>(['userProfile', userId], (oldData) => {
         if (!oldData) return undefined;
         return produce(oldData, (draft) => {
           draft.isFollowing = !isFollowing;
           if (draft._count) {
             draft._count.followers = isFollowing
               ? Math.max(0, (draft._count.followers ?? 0) - 1)
               : (draft._count.followers ?? 0) + 1;
           }
         });
      });


      return { previousUserProfile };
    },
    onError: (err, variables, context) => {
      toast.error(`${variables.isFollowing ? 'フォロー解除' : 'フォロー'}に失敗しました`);
      if (context?.previousUserProfile) {
        queryClient.setQueryData(['userProfile', variables.userId], context.previousUserProfile);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.userId] });
      // TODO: Invalidate follower/following lists if they exist
    },
  });
};
