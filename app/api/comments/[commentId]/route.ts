import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth, hasAccessToResource } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// コメントを更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const commentId = params.commentId;
    const userId = await requireAuth();

    // コメントを取得して所有者を確認
    const { data: commentData, error: fetchError } = await supabase
      .from('Comment') // Revert to PascalCase
      .select('userId') // Revert to camelCase
      .eq('id', commentId)
      .single(); // Use single to error if not found

    if (fetchError) {
       if (fetchError.code === 'PGRST116') { // Comment not found
         return NextResponse.json(
           { error: 'コメントが見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching comment for update:", fetchError);
       return NextResponse.json({ error: 'コメントの取得中にエラーが発生しました' }, { status: 500 });
    }

    if (!commentData) { // Should be caught by single()
      return NextResponse.json(
        { error: 'コメントが見つかりません' },
        { status: 404 }
      );
    }

    // コメントの所有者かどうか確認
    if (!hasAccessToResource(commentData.userId)) { // Check against fetched userId
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

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

    // コメントを更新し、ユーザー情報を含めて取得
    const { data: updatedCommentData, error: updateError } = await supabase
      .from('Comment') // Revert to PascalCase
      .update({ content })
      .eq('id', commentId)
      .select(`
        *,
        User ( id, username, name, image )
      `)
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json({ error: 'コメントの更新に失敗しました' }, { status: 500 });
    }

    // Map user relation from PascalCase
    const updatedCommentResponse = {
        ...updatedCommentData,
        user: updatedCommentData.User,
        User: undefined,
    };

    return NextResponse.json(updatedCommentResponse);
  } catch (error) {
    // Keep existing error handling
    console.error('Error updating comment:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'コメントの更新に失敗しました' },
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
    const userId = await requireAuth();

    // コメントと関連する投稿の所有者IDを取得
    const { data: commentToDeleteData, error: fetchError } = await supabase
      .from('Comment') // Revert to PascalCase
      .select(`
        userId,
        Post ( userId ) 
      `) // Revert to camelCase & PascalCase
      .eq('id', commentId)
      .single();

    if (fetchError) {
       if (fetchError.code === 'PGRST116') { // Comment not found
         return NextResponse.json(
           { error: 'コメントが見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching comment for deletion:", fetchError);
       return NextResponse.json({ error: 'コメントの取得中にエラーが発生しました' }, { status: 500 });
    }


    if (!commentToDeleteData) { // Should be caught by single()
      return NextResponse.json(
        { error: 'コメントが見つかりません' },
        { status: 404 }
      );
    }

    // コメントの所有者または投稿の所有者かどうか確認
    const isCommentOwner = commentToDeleteData.userId === userId; // Use camelCase
    // Access nested post owner id, using a safer type assertion
    const postData = commentToDeleteData.Post as unknown as { userId: string } | null; // Use PascalCase & camelCase
    const isPostOwner = postData?.userId === userId; // Use camelCase

    if (!isCommentOwner && !isPostOwner) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    // コメントを削除
    const { error: deleteError } = await supabase
      .from('Comment') // Revert to PascalCase
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'コメントの削除に失敗しました' }, { status: 500 });
    }

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
