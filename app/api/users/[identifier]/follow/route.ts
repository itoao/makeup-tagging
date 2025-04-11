import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
// Import repository functions
import { findUserByIdentifier, followUser, unfollowUser } from '@/lib/repositories/UserRepository';

// ユーザーをフォローする
export async function POST(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const followerId = await requireAuth(); // 認証されたユーザーIDを取得
    const followingIdentifier = params.identifier; // フォロー対象のIDまたはユーザー名

    // フォロー対象のユーザーが存在するか確認し、IDを取得
    // Pass null as currentUserId, as we only need the profile here, not the follow status relative to the current user
    const { profile: userToFollow, error: findError } = await findUserByIdentifier(followingIdentifier, null);

    if (findError) {
      console.error(`[API Follow] Error finding user to follow (${followingIdentifier}):`, findError.message);
      return NextResponse.json({ error: 'ユーザー検索中にエラーが発生しました', details: findError.message }, { status: 500 });
    }

    if (!userToFollow) {
      return NextResponse.json(
        { error: 'フォロー対象のユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const followingId = userToFollow.id; // 確実にIDを使用

    // リポジトリ関数を呼び出してフォローを実行
    const { error: followError } = await followUser(followerId, followingId);

    if (followError) {
      // リポジトリで既にハンドリングされている可能性のあるエラー（例：自己フォロー）
      if (followError.message === "自分自身をフォローすることはできません。") {
        return NextResponse.json({ error: followError.message }, { status: 400 });
      }
      // リポジトリで既にハンドリングされている可能性のあるエラー（例：既にフォロー済み）
      // Note: Repository currently returns null for already following, so this check might not be needed if repo handles it silently.
      // if (followError.message === '既にフォローしています') {
      //   return NextResponse.json({ message: '既にフォローしています' });
      // }
      console.error(`[API Follow] Error from repository following user:`, followError.message);
      return NextResponse.json(
        { error: 'フォロー処理中にエラーが発生しました', details: followError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API Follow] Error:', error);
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'フォロー処理中に予期せぬエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ユーザーのフォローを解除する
export async function DELETE(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const followerId = await requireAuth(); // 認証されたユーザーIDを取得
    const followingIdentifier = params.identifier; // フォロー解除対象のIDまたはユーザー名

    // フォロー解除対象のユーザーが存在するか確認し、IDを取得
    // Pass null as currentUserId, as we only need the profile here
     const { profile: userToUnfollow, error: findError } = await findUserByIdentifier(followingIdentifier, null);

    if (findError) {
      console.error(`[API Unfollow] Error finding user to unfollow (${followingIdentifier}):`, findError.message);
      // If find error occurs, we can't proceed with unfollow based on ID
      return NextResponse.json({ error: 'ユーザー検索中にエラーが発生しました', details: findError.message }, { status: 500 });
    }

    if (!userToUnfollow) {
      // If the user doesn't exist, the "not following" state is true. Return success.
      console.log(`[API Unfollow] Target user (${followingIdentifier}) not found. Assuming unfollow is successful.`);
      return NextResponse.json({ success: true, message: '対象ユーザーが見つからないため、フォロー解除の必要はありませんでした。' });
    }

    const followingId = userToUnfollow.id; // 確実にIDを使用

    // リポジトリ関数を呼び出してフォロー解除を実行
    const { error: unfollowError } = await unfollowUser(followerId, followingId);

    if (unfollowError) {
      console.error(`[API Unfollow] Error from repository unfollowing user:`, unfollowError.message);
      return NextResponse.json(
        { error: 'フォロー解除処理中にエラーが発生しました', details: unfollowError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API Unfollow] Error:', error);
     if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'フォロー解除処理中に予期せぬエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
