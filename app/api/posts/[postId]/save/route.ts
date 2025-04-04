import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// 投稿を保存（ブックマーク）する
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 投稿が存在するか確認
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
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 既に保存しているか確認
    const { data: saveData, error: saveCheckError } = await supabase
      .from('Save')
      .select('id')
      .eq('userId', userId)
      .eq('postId', postId)
      .maybeSingle();

    if (saveCheckError) {
      console.error("Error checking existing save:", saveCheckError);
      return NextResponse.json({ error: '保存状態の確認中にエラーが発生しました' }, { status: 500 });
    }
    if (saveData) {
      return NextResponse.json(
        { error: '既に保存しています' },
        { status: 400 }
      );
    }

    // 保存を作成
    const { error: insertError } = await supabase
      .from('Save')
      .insert({
        userId: userId,
        postId: postId,
      });

    if (insertError) {
      // Handle potential unique constraint violation if check somehow failed
      if (insertError.code === '23505') { // Unique violation code
         return NextResponse.json(
           { error: '既に保存しています' },
           { status: 400 }
         );
      }
      console.error('Error creating save:', insertError);
      return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
    }

    // 保存数を取得 (using head: true for efficiency)
    const { count: saveCount, error: countError } = await supabase
      .from('Save')
      .select('*', { count: 'exact', head: true })
      .eq('postId', postId);

     if (countError) {
       console.error('Error fetching save count after insert:', countError);
     }

    return NextResponse.json({ success: true, saveCount: saveCount ?? 0 });
  } catch (error) {
    console.error('Error saving post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '保存に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿の保存（ブックマーク）を解除する
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 保存を削除
    const { error: deleteError } = await supabase
      .from('Save')
      .delete()
      .eq('userId', userId)
      .eq('postId', postId);

    if (deleteError) {
      console.error('Error deleting save:', deleteError);
      return NextResponse.json({ error: '保存の削除中にエラーが発生しました' }, { status: 500 });
    }

    // 保存数を取得
    const { count: saveCount, error: countError } = await supabase
      .from('Save')
      .select('*', { count: 'exact', head: true })
      .eq('postId', postId);

    if (countError) {
       console.error('Error fetching save count after delete:', countError);
    }

    return NextResponse.json({ success: true, saveCount: saveCount ?? 0 });
  } catch (error) {
    console.error('Error unsaving post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '保存解除に失敗しました' },
      { status: 500 }
    );
  }
}
