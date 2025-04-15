import supabase from '@/lib/supabase';
import type { Database } from '@/src/types/supabase';
import type { Comment } from '@/src/types/post'; // Assuming Comment type is in post.ts
import type { UserProfile } from '@/src/types/user';

// Define types using generated Database types
type CommentRow = Database['public']['Tables']['Comment']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];

// Type for the select query result including user data
type CommentWithUser = CommentRow & {
  user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null;
};

// Helper function to map Supabase row to our Comment type
const mapSupabaseRowToCommentType = (c: CommentWithUser): Comment => {
  return {
    id: c.id,
    content: c.content,
    userId: c.userId,
    postId: c.postId,
    createdAt: c.created_at, // Map snake_case to camelCase
    user: c.user ? { // Map nested user data
      id: c.user.id,
      username: c.user.username,
      name: c.user.name,
      image: c.user.image,
    } : null,
  };
};

/**
 * Finds comments for a specific post with pagination.
 * @param postId - The ID of the post.
 * @param options - Pagination options.
 * @returns Paginated comments and total count.
 */
export const findCommentsByPostId = async (
  postId: string,
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{ comments: Comment[]; total: number; error: Error | null }> => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  const from = skip;
  const to = skip + limit - 1;

  const selectStatement = `
    id,
    content,
    userId,
    postId,
    created_at,
    user:User ( id, username, name, image )
  `;

  const { data, error, count } = await supabase
    .from('Comment')
    .select<string, CommentWithUser>(selectStatement, { count: 'exact' })
    .eq('postId', postId)
    .order('created_at', { ascending: true }) // Order comments chronologically
    .range(from, to);

  if (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return { comments: [], total: 0, error: new Error(error.message) };
  }

  const comments: Comment[] = data?.map(mapSupabaseRowToCommentType) || [];
  const totalCount = count ?? 0;

  return { comments, total: totalCount, error: null };
};

/**
 * Creates a new comment for a post.
 * @param postId - The ID of the post to comment on.
 * @param userId - The ID of the user creating the comment.
 * @param content - The content of the comment.
 * @returns The newly created comment data with user info, or null if failed.
 */
export const createComment = async (
  postId: string,
  userId: string,
  content: string
): Promise<{ comment: Comment | null; error: Error | null }> => {

  // TODO: Add checks for post existence and user existence if necessary

  const insertData: Database['public']['Tables']['Comment']['Insert'] = {
    postId,
    userId,
    content,
  };

  // 1. コメントを挿入する
  const { data: insertedData, error: insertError } = await supabase
    .from('Comment')
    .insert(insertData);

  if (insertError) {
    console.error('Error creating comment (repository):', insertError);
    return { comment: null, error: new Error(insertError.message) };
  }

  // insertedDataがnullの場合はエラーを返す
  if (!insertedData) {
    console.error('Failed to create comment.');
    return { comment: null, error: new Error('Failed to create comment.') };
  }
  
  // 挿入されたデータから最初のコメントのIDを取得
  // Supabase v2では、insertの結果は配列で返される
  const insertedArray = insertedData as unknown as CommentRow[];
  
  if (insertedArray.length === 0) {
    console.error('No comment data returned after insert.');
    return { comment: null, error: new Error('Failed to create comment.') };
  }
  
  const commentId = insertedArray[0].id;
  if (!commentId) {
    console.error('Failed to get created comment ID.');
    return { comment: null, error: new Error('Failed to get comment ID.') };
  }

  // 2. 挿入が成功したら、IDを使用して詳細データをフェッチする
  const selectStatement = `
    id,
    content,
    userId,
    postId,
    created_at,
    user:User ( id, username, name, image )
  `;

  const { data: newComment, error: selectError } = await supabase
    .from('Comment')
    .select<string, CommentWithUser>(selectStatement)
    .eq('id', commentId)
    .single();

  if (selectError) {
    console.error('Error fetching created comment:', selectError);
    return { comment: null, error: new Error(selectError.message) };
  }

  if (!newComment) {
    console.error('Failed to fetch created comment details.');
    return { comment: null, error: new Error('Failed to fetch created comment.') };
  }

  // Map the fetched data
  const mappedComment = mapSupabaseRowToCommentType(newComment);

  return { comment: mappedComment, error: null };
};

/**
 * Updates an existing comment.
 * @param commentId - The ID of the comment to update.
 * @param userId - The ID of the user attempting the update (for authorization).
 * @param content - The new content for the comment.
 * @returns The updated comment data, or null if failed or unauthorized.
 */
export const updateComment = async (
  commentId: string,
  userId: string,
  content: string
): Promise<{ comment: Comment | null; error: Error | null }> => {

  // 1. Verify ownership (fetch the comment's userId)
  const { data: existingComment, error: fetchError } = await supabase
    .from('Comment')
    .select('userId')
    .eq('id', commentId)
    .single();

  if (fetchError) {
    console.error(`Error fetching comment ${commentId} for update check:`, fetchError);
    // Handle not found specifically
    if (fetchError.code === 'PGRST116') {
        return { comment: null, error: new Error('コメントが見つかりません。') };
    }
    return { comment: null, error: new Error('コメント取得中にエラーが発生しました。') };
  }

   if (!existingComment) { // Should be caught by single(), but double-check
     return { comment: null, error: new Error('コメントが見つかりません。') };
   }

  // 2. Check authorization
  if (existingComment.userId !== userId) {
    return { comment: null, error: new Error('このコメントを編集する権限がありません。') };
  }

  // 3. Update the comment
  const updateData: Database['public']['Tables']['Comment']['Update'] = {
    content,
    updated_at: new Date().toISOString(), // Update timestamp
  };

  // Fetch the updated comment with user data after update
  const selectStatement = `
    id,
    content,
    userId,
    postId,
    created_at,
    updated_at,
    user:User ( id, username, name, image )
  `;

  const { data: updatedComment, error: updateError } = await supabase
    .from('Comment')
    .update(updateData)
    .eq('id', commentId)
    .select<string, CommentWithUser>(selectStatement) // Fetch updated row with user
    .single();

  if (updateError) {
    console.error(`Error updating comment ${commentId}:`, updateError);
    return { comment: null, error: new Error(updateError.message) };
  }

   if (!updatedComment) {
     console.error(`Failed to fetch updated comment ${commentId} after update.`);
     return { comment: null, error: new Error('更新されたコメントの取得に失敗しました。') };
   }

  // 4. Map and return
  const mappedComment = mapSupabaseRowToCommentType(updatedComment);
  return { comment: mappedComment, error: null };
};


/**
 * Deletes a comment.
 * @param commentId - The ID of the comment to delete.
 * @param userId - The ID of the user attempting the deletion (for authorization).
 * @returns An error object if the operation failed or unauthorized, otherwise null.
 */
export const deleteComment = async (
  commentId: string,
  userId: string
): Promise<{ error: Error | null }> => {

  // 1. Verify ownership
  const { data: existingComment, error: fetchError } = await supabase
    .from('Comment')
    .select('userId')
    .eq('id', commentId)
    .single();

  if (fetchError) {
    console.error(`Error fetching comment ${commentId} for delete check:`, fetchError);
     if (fetchError.code === 'PGRST116') { // Not found is not an error for delete
        console.warn(`Comment ${commentId} not found for deletion, assuming already deleted.`);
        return { error: null };
     }
    return { error: new Error('コメント取得中にエラーが発生しました。') };
  }

   if (!existingComment) { // Should be caught by single()
     console.warn(`Comment ${commentId} not found for deletion, assuming already deleted.`);
     return { error: null };
   }

  // 2. Check authorization
  if (existingComment.userId !== userId) {
    return { error: new Error('このコメントを削除する権限がありません。') };
  }

  // 3. Delete the comment
  const { error: deleteError } = await supabase
    .from('Comment')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    // Note: Supabase delete doesn't typically error if the row doesn't exist.
    console.error(`Error deleting comment ${commentId}:`, deleteError);
    return { error: new Error(deleteError.message) };
  }

  return { error: null };
};
