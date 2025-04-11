import { NextRequest, NextResponse } from 'next/server';
// Remove direct Supabase client import
// import supabase from '@/lib/supabase';
import { getUserId } from '@/lib/auth';
// Import repository function
import { findUserByIdentifier } from '@/lib/repositories/UserRepository';
// Keep UserProfile type for response structure if needed, or rely on repository return type
import type { UserProfile } from '@/src/types/user';

// Remove Supabase query result interfaces if no longer needed directly
/*
interface SupabaseFollower { ... }
interface SupabaseFollowing { ... }
interface UserDataFromSupabase { ... }
*/

// ユーザー情報を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const identifier = params.identifier; // Use identifier directly
    const currentUserId = await getUserId(); // Can be null

    console.log(`[API /users/${identifier}] Calling repository to find user by identifier: ${identifier}, currentAuthUser: ${currentUserId ?? 'none'}`);

    // Call the repository function, passing currentUserId
    const { profile: userProfile, isFollowing, error } = await findUserByIdentifier(identifier, currentUserId);

    if (error) {
      console.error(`[API /users/${identifier}] Error from repository:`, error.message);
      // Consider returning 500 for repository errors vs 404 for not found
      return NextResponse.json(
        { error: 'ユーザー情報の取得中にエラーが発生しました (repository error)', details: error.message },
        { status: 500 }
      );
    }

    if (!userProfile) {
      console.log(`[API /users/${identifier}] User not found by repository.`);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log(`[API /users/${identifier}] User profile found:`, userProfile);

    // Use the isFollowing status returned by the repository
    console.log(`[API /users/${identifier}] isFollowing status from repository: ${isFollowing}`);

    // Repository returns the UserProfile, add context-specific flags
    return NextResponse.json({
      ...userProfile,
      isFollowing: isFollowing, // Use value from repository
      isCurrentUser: currentUserId === userProfile.id,
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/users/[identifier]:', error);
    // Keep existing auth error check if needed, otherwise simplify
    // if (error.message === '認証が必要です') {
    //      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    // }
    return NextResponse.json(
      { error: 'ユーザー情報の取得中に予期せぬエラーが発生しました', details: error.message },
      { status: 500 }
    );
  }
}
