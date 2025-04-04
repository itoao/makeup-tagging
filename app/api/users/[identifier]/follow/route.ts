import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// Helper function to get target user ID from identifier (always treat as userId)
const getTargetUserId = async (userId: string): Promise<string | null> => {
  // Always query by 'id' column
  const { data, error } = await supabase
    .from('User') // Use PascalCase table name
    .select('id')
    .eq('id', userId) // Always use 'id'
    .single();

  if (error || !data) {
    // Log error but return null to let the caller handle 404 etc.
    if (error && error.code !== 'PGRST116') { // Don't log "not found" as an error here
      console.error(`Error fetching target user by id:`, error);
    }
    return null; // Return null if not found or error
  }
  return data.id;
};


// ユーザーをフォローする
export async function POST(
  req: NextRequest,
  // Update params type to use identifier
  { params }: { params: { identifier: string } } 
) {
  try {
    // Get identifier from params
    const identifier = params.identifier; 
    const currentUserId = await requireAuth();

    // フォロー対象のユーザーIDを取得
    const targetUserId = await getTargetUserId(identifier);

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'フォロー対象見つかりません' },
        { status: 404 }
      );
    }

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
  // Update params type to use identifier
  { params }: { params: { identifier: string } } 
) {
  try {
    // Get identifier from params
    const identifier = params.identifier; 
    const currentUserId = await requireAuth();

    // フォロー解除対象のユーザーIDを取得
    const targetUserId = await getTargetUserId(identifier);

    if (!targetUserId) {
      // If target user not found, arguably the unfollow is "successful"
      // or at least not an error from the client's perspective.
      // Return success, or a specific message if needed.
      return NextResponse.json({ success: true, message: '対象ユーザーが見つからないため、フォロー解除の必要はありませんでした。' });
    }

    // フォロー関係を削除
    const { error: deleteError } = await supabase
      .from('Follow') // Revert to PascalCase
      .delete()
      .eq('followerId', currentUserId) // Revert to camelCase
      .eq('followingId', targetUserId); // Revert to camelCase

    if (deleteError) {
      // Note: Supabase delete doesn't typically error if the row doesn't exist.
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

    return NextResponse.json(
      { error: 'フォロー解除に失敗しました' },
      { status: 500 }
    );
  }
}
