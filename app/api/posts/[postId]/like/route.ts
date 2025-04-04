import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// 投稿にいいねする
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

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

    // 既にいいねしているか確認
    const { data: likeData, error: likeCheckError } = await supabase
      .from('Like') // Revert to PascalCase
      .select('id')
      .eq('userId', userId) // Revert to camelCase
      .eq('postId', postId) // Revert to camelCase
      .maybeSingle();

    if (likeCheckError) {
      console.error("Error checking existing like:", likeCheckError);
      return NextResponse.json({ error: 'いいね状態の確認中にエラーが発生しました' }, { status: 500 });
    }
    if (likeData) {
      return NextResponse.json(
        { error: '既にいいねしています' },
        { status: 400 }
      );
    }

    // いいねを作成
    const { error: insertError } = await supabase
      .from('Like') // Revert to PascalCase
      .insert({
        userId: userId, // Revert to camelCase
        postId: postId, // Revert to camelCase
      });

    if (insertError) {
      // Handle potential unique constraint violation if check somehow failed
      if (insertError.code === '23505') { // Unique violation code
         return NextResponse.json(
           { error: '既にいいねしています' },
           { status: 400 }
         );
      }
      console.error('Error creating like:', insertError);
      return NextResponse.json({ error: 'いいねの作成に失敗しました' }, { status: 500 });
    }

    // いいね数を取得 (using head: true for efficiency)
    const { count: likeCount, error: countError } = await supabase
      .from('Like') // Revert to PascalCase
      .select('*', { count: 'exact', head: true })
      .eq('postId', postId); // Revert to camelCase

     if (countError) {
       // Log error but potentially proceed, or return error
       console.error('Error fetching like count after insert:', countError);
       // Optionally return error: return NextResponse.json({ error: 'いいね数の取得に失敗しました' }, { status: 500 });
     }

    return NextResponse.json({ success: true, likeCount: likeCount ?? 0 });
  } catch (error) {
    // Keep existing error handling structure
    console.error('Error liking post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'いいねに失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿のいいねを解除する
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // いいねを削除
    const { error: deleteError } = await supabase
      .from('Like') // Revert to PascalCase
      .delete()
      .eq('userId', userId) // Revert to camelCase
      .eq('postId', postId); // Revert to camelCase

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return NextResponse.json({ error: 'いいねの削除中にエラーが発生しました' }, { status: 500 });
    }

    // いいね数を取得
    const { count: likeCount, error: countError } = await supabase
      .from('Like') // Revert to PascalCase
      .select('*', { count: 'exact', head: true })
      .eq('postId', postId); // Revert to camelCase

    if (countError) {
       console.error('Error fetching like count after delete:', countError);
    }

    return NextResponse.json({ success: true, likeCount: likeCount ?? 0 });
  } catch (error) {
    // Keep existing error handling structure
    console.error('Error unliking post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Remove Prisma-specific error handling for non-existent record

    return NextResponse.json(
      { error: 'いいね解除に失敗しました' },
      { status: 500 }
    );
  }
}
