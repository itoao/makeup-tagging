import { NextRequest, NextResponse } from 'next/server';
// Remove direct Supabase client import
// import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth'; // Keep requireAuth
// Import repository functions
import { updateComment, deleteComment } from '@/lib/repositories/CommentRepository';
// Import Comment type if needed for response structure
import type { Comment } from '@/src/types/post';

// コメントを更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const commentId = params.commentId;
    const userId = await requireAuth(); // Get authenticated user ID

    // リクエストボディを取得
    const body = await req.json();
    const { content } = body;

    // バリデーション
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'コメント内容は必須です' },
        { status: 400 }
      );
    }

    console.log(`[API /comments/${commentId}] Calling repository to update comment`);

    // Call repository function to update comment (includes ownership check)
    const { comment: updatedComment, error: updateError } = await updateComment(
      commentId,
      userId,
      content
    );

    if (updateError) {
      console.error(`[API /comments/${commentId}] Error from repository:`, updateError.message);
      // Handle specific errors from repository (e.g., not found, forbidden)
      if (updateError.message.includes('見つかりません')) {
        return NextResponse.json({ error: updateError.message }, { status: 404 });
      }
      if (updateError.message.includes('権限がありません')) {
        return NextResponse.json({ error: updateError.message }, { status: 403 });
      }
      // Generic server error for other repository issues
      return NextResponse.json(
        { error: 'コメントの更新に失敗しました (repository error)', details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedComment) {
       // Should ideally be caught by error handling above, but as a safeguard
       console.error(`[API /comments/${commentId}] Repository returned null comment without error.`);
       return NextResponse.json({ error: 'コメントの更新に失敗しました' }, { status: 500 });
    }

    console.log(`[API /comments/${commentId}] Successfully updated comment.`);
    return NextResponse.json(updatedComment); // Return the updated comment from repo
  } catch (error) {
    // Keep existing error handling
    console.error('Error updating comment:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'コメントの更新中に予期せぬエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// コメントを削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const commentId = params.commentId;
    const userId = await requireAuth(); // Get authenticated user ID

    console.log(`[API /comments/${commentId}] Calling repository to delete comment`);

    // Call repository function to delete comment (includes ownership check)
    const { error: deleteError } = await deleteComment(commentId, userId);

    if (deleteError) {
      console.error(`[API /comments/${commentId}] Error from repository:`, deleteError.message);
      // Handle specific errors from repository (e.g., forbidden)
      // Note: Repository currently handles "not found" gracefully by returning null error.
      if (deleteError.message.includes('権限がありません')) {
        return NextResponse.json({ error: deleteError.message }, { status: 403 });
      }
      // Generic server error for other repository issues
      return NextResponse.json(
        { error: 'コメントの削除に失敗しました (repository error)', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`[API /comments/${commentId}] Successfully deleted comment.`);
    return NextResponse.json({ success: true });
  } catch (error) {
    // Keep existing error handling
    console.error('Error deleting comment:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'コメントの削除に失敗しました' },
      { status: 500 }
    );
  }
}
