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

// TODO: Add functions for updateComment, deleteComment
