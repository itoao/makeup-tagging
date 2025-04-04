import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// 投稿のコメント一覧を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || '20');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const from = skip;
    const to = skip + limit - 1;

    // 投稿が存在するか確認
    const { data: postData, error: postError } = await supabase
      .from('Post') // Revert to PascalCase
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      console.error("Error checking post existence:", postError);
      return NextResponse.json({ error: '投稿の確認中にエラーが発生しました' }, { status: 500 });
    }
    if (!postData) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // コメント一覧と総数を取得
    const { data: commentsData, error: commentsError, count: total } = await supabase
      .from('Comment') // Revert to PascalCase
      .select(`
        *,
        User ( id, username, name, image )
      `, { count: 'exact' })
      .eq('postId', postId) // Revert to camelCase
      .order('createdAt', { ascending: false }) // Revert to camelCase
      .range(from, to);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'コメント一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Map user relation from PascalCase
    const comments = commentsData?.map(c => ({
        ...c,
        user: c.User,
        User: undefined,
    })) || [];

    const totalCount = total ?? 0;

    return NextResponse.json({
      comments,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
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

    // 投稿が存在するか確認
    const { data: postData, error: postError } = await supabase
      .from('Post') // Revert to PascalCase
      .select('id')
      .eq('id', postId)
      .maybeSingle();

     if (postError) {
       console.error("Error checking post existence:", postError);
       return NextResponse.json({ error: '投稿の確認中にエラーが発生しました' }, { status: 500 });
     }
    if (!postData) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // コメントを作成し、ユーザー情報を含めて取得
    const { data: newCommentData, error: insertError } = await supabase
      .from('Comment') // Revert to PascalCase
      .insert({
        content,
        userId: userId, // Revert to camelCase
        postId: postId, // Revert to camelCase
      })
      .select(`
        *,
        User ( id, username, name, image )
      `)
      .single(); // Expect a single row back

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json({ error: 'コメントの作成に失敗しました' }, { status: 500 });
    }

     // Map user relation from PascalCase
     const commentResponse = {
         ...newCommentData,
         user: newCommentData.User,
         User: undefined,
     };

    return NextResponse.json(commentResponse);
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
