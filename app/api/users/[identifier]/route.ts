import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { getUserId } from '@/lib/auth';
import type { UserProfile } from '@/src/types/user'; // Import UserProfile type from user.ts

// Define interfaces for Supabase query results
interface SupabaseFollower {
  followerId: string;
}
interface SupabaseFollowing {
  followingId: string;
}
interface UserDataFromSupabase {
  id: string;
  username: string;
  name: string | null;
  image: string | null; // Assuming 'image' is the avatar column name
  created_at: string;
  followers: SupabaseFollower[]; // Array of followers
  following: SupabaseFollowing[]; // Array of users being followed
}

// ユーザー情報を取得
export async function GET(
  req: NextRequest,
  // Update params type to use identifier
  { params }: { params: { identifier: string } }
) {
  try {
    // Get userId (identifier) from params
    const userId = params.identifier;
    const currentUserId = await getUserId(); // Can be null if user is not logged in

    console.log(`[API] Fetching user with ID: ${userId}, currentAuthUser: ${currentUserId ?? 'none'}`);

    // ユーザーを取得し、フォロー関係も取得
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select(`
        id,
        username,
        name,
        image,
        created_at,
        followers:Follow!followingId ( followerId ), 
        following:Follow!followerId ( followingId ) 
      `) // Fetch follower/following IDs
      .eq('id', userId)
      .maybeSingle();

    // Check for errors during the query execution
    if (userError) {
       // Log the specific Supabase error for debugging
       console.error("[API] Supabase error fetching user:", userError); 
       return NextResponse.json({ error: 'ユーザー情報の取得中にデータベースエラーが発生しました', details: userError.message }, { status: 500 });
    }

    // Check if user data was found
    if (!userData) { 
      console.log(`[API] User not found with ID: ${userId}`);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' }, 
        { status: 404 }
      );
    }

    console.log(`[API] User data fetched:`, userData);

    // Cast the fetched data
    const typedUserData = userData as UserDataFromSupabase | null;

    if (!typedUserData) {
      console.log(`[API] User not found after cast with ID: ${userId}`);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // フォロー状態を確認 (currentUserId が存在する場合のみ)
    const isFollowing = currentUserId
      ? typedUserData.followers.some(f => f.followerId === currentUserId)
      : false;

    // Map to UserProfile type
    const userProfile: UserProfile = {
      id: typedUserData.id,
      username: typedUserData.username,
      name: typedUserData.name,
      image: typedUserData.image, // Map 'image' to 'image'
      // Add counts
      _count: {
        followers: typedUserData.followers?.length ?? 0,
        following: typedUserData.following?.length ?? 0,
        // posts count needs a separate query or join if required
      }
    };


    return NextResponse.json({
      ...userProfile,
      isFollowing: isFollowing, // Add isFollowing status
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
