import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// ユーザーをフォローする
export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const currentUserId = await requireAuth();

    // フォロー対象のユーザーを取得
    const { data: targetUserData, error: targetUserError } = await supabase
      .from('User') // Revert to PascalCase
      .select('id')
      .eq('username', username)
      .single();

    if (targetUserError) {
       if (targetUserError.code === 'PGRST116') { // User not found
         return NextResponse.json(
           { error: 'ユーザーが見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching target user:", targetUserError);
       return NextResponse.json({ error: 'ユーザー情報の取得中にエラーが発生しました' }, { status: 500 });
    }

    if (!targetUserData) { // Should be caught by single()
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUserData.id;

    // 自分自身をフォローしようとしている場合
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: '自分自身をフォローすることはできません' },
        { status: 400 }
      );
    }

    // 既にフォローしているか確認
    const { data: followData, error: followCheckError } = await supabase
      .from('Follow') // Revert to PascalCase
      .select('id')
      .eq('followerId', currentUserId) // Revert to camelCase
      .eq('followingId', targetUserId) // Revert to camelCase
      .maybeSingle();

    if (followCheckError) {
      console.error("Error checking existing follow:", followCheckError);
      return NextResponse.json({ error: 'フォロー状態の確認中にエラーが発生しました' }, { status: 500 });
    }
    if (followData) {
      return NextResponse.json(
        { error: '既にフォローしています' },
        { status: 400 }
      );
    }

    // フォロー関係を作成
    const { error: insertError } = await supabase
      .from('Follow') // Revert to PascalCase
      .insert({
        followerId: currentUserId, // Revert to camelCase
        followingId: targetUserId, // Revert to camelCase
      });

     if (insertError) {
       // Handle potential unique constraint violation
       if (insertError.code === '23505') {
         return NextResponse.json(
           { error: '既にフォローしています' },
           { status: 400 }
         );
       }
       console.error('Error creating follow relationship:', insertError);
       return NextResponse.json({ error: 'フォロー関係の作成に失敗しました' }, { status: 500 });
     }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Keep existing error handling structure
    console.error('Error following user:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'フォローに失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザーのフォローを解除する
export async function DELETE(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const currentUserId = await requireAuth();

    // フォロー解除対象のユーザーを取得
    const { data: targetUserData, error: targetUserError } = await supabase
      .from('User') // Revert to PascalCase
      .select('id')
      .eq('username', username)
      .single();

     if (targetUserError) {
       if (targetUserError.code === 'PGRST116') { // User not found
         return NextResponse.json(
           { error: 'ユーザーが見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching target user for unfollow:", targetUserError);
       return NextResponse.json({ error: 'ユーザー情報の取得中にエラーが発生しました' }, { status: 500 });
     }

    if (!targetUserData) { // Should be caught by single()
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUserData.id;

    // フォロー関係を削除
    const { error: deleteError } = await supabase
      .from('Follow') // Revert to PascalCase
      .delete()
      .eq('followerId', currentUserId) // Revert to camelCase
      .eq('followingId', targetUserId); // Revert to camelCase

    if (deleteError) {
      // Note: Supabase delete doesn't typically error if the row doesn't exist.
      // You might want to check the 'count' from the response if needed,
      // but often just proceeding is fine.
      console.error('Error deleting follow relationship:', deleteError);
      return NextResponse.json({ error: 'フォロー関係の削除中にエラーが発生しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Keep existing error handling structure
    console.error('Error unfollowing user:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Remove Prisma-specific error handling

    return NextResponse.json(
      { error: 'フォロー解除に失敗しました' },
      { status: 500 }
    );
  }
}
