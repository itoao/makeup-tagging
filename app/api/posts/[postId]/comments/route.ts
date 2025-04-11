import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// Import repository function
import { findCommentsByPostId } from '@/lib/repositories/CommentRepository';
// Import Comment type if needed for response structure
import type { Comment } from '@/src/types/post';

// 投稿のコメント一覧を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || '10'); // Default limit from repo
    const page = Number(searchParams.get('page') || '1');

    // TODO: Consider moving post existence check to repository or keep it here for validation
    const { data: postData, error: postError } = await supabase
      .from('Post')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      console.error("Error checking post existence:", postError);
      return NextResponse.json({ error: '投稿の確認中にエラーが発生しました' }, { status: 500 });
    }
    if (!postData) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    console.log(`[API /posts/${postId}/comments] Calling repository to fetch comments`);

    // Call the repository function
    const { comments, total, error } = await findCommentsByPostId(postId, { page, limit });

    if (error) {
      console.error(`[API /posts/${postId}/comments] Error from repository:`, error.message);
      return NextResponse.json(
        { error: 'コメント一覧の取得に失敗しました (repository error)', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API /posts/${postId}/comments] Received ${comments.length} comments from repository, total: ${total}.`);

    return NextResponse.json({
      comments: comments,
      pagination: {
        total: total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // Keep existing error handling
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'コメント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// Import createComment from repository
import { findCommentsByPostId, createComment } from '@/lib/repositories/CommentRepository';

// ... (Keep GET handler as modified above) ...

// 投稿にコメントを追加
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

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

    // TODO: Consider moving post existence check to repository or keep it here
    const { data: postData, error: postError } = await supabase
      .from('Post')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

     if (postError) {
       console.error("Error checking post existence:", postError);
       return NextResponse.json({ error: '投稿の確認中にエラーが発生しました' }, { status: 500 });
     }
    if (!postData) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    console.log(`[API /posts/${postId}/comments] Calling repository to create comment`);

    // Call the repository function
    const { comment: newComment, error: createError } = await createComment(postId, userId, content);

    if (createError || !newComment) {
      console.error(`[API /posts/${postId}/comments] Error from repository:`, createError?.message);
      return NextResponse.json(
        { error: 'コメントの作成に失敗しました (repository error)', details: createError?.message },
        { status: 500 }
      );
    }

    console.log(`[API /posts/${postId}/comments] Successfully created comment ID: ${newComment.id} via repository.`);

    // Repository returns the mapped Comment type
    return NextResponse.json(newComment);
  } catch (error) {
    // Keep existing error handling
    console.error('Error creating comment:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'コメントの作成に失敗しました' },
      { status: 500 }
    );
  }
}
