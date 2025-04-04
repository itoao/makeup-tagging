import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { getUserId } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// ユーザー情報を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const currentUserId = await getUserId();

    // ユーザーを取得
    // TODO: Verify relation names match Supabase schema (using aliases like in GET /api/users)
    const { data: userData, error: userError } = await supabase
      .from('User') // Revert to PascalCase
      .select(`
        id,
        username,
        name,
        bio,
        image,
        createdAt, 
        Post ( count ),
        followers:Follow!followingId ( count ), 
        following:Follow!followerId ( count ) 
      `) // Use aliases for counts
      .eq('username', username)
      .single(); // Expect a single user

    if (userError) {
       if (userError.code === 'PGRST116') { // User not found
         return NextResponse.json(
           { error: 'ユーザーが見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching user:", userError);
       return NextResponse.json({ error: 'ユーザー情報の取得中にエラーが発生しました' }, { status: 500 });
    }

    if (!userData) { // Should be caught by single()
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

     // Map count structure using aliases
     const user = {
        ...userData,
        _count: {
            posts: userData.Post[0]?.count ?? 0,
            followers: userData.followers[0]?.count ?? 0, 
            following: userData.following[0]?.count ?? 0,
        },
        Post: undefined, // Clean up
        followers: undefined, // Clean up alias
        following: undefined, // Clean up alias
    };


    // 現在のユーザーがこのユーザーをフォローしているかチェック
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) { // Don't check if it's the same user
      const { data: followData, error: followError } = await supabase
        .from('Follow') // Revert to PascalCase
        .select('id', { count: 'exact' }) // Just check for existence
        .eq('followerId', currentUserId) // Revert to camelCase
        .eq('followingId', user.id)    // Revert to camelCase
        .maybeSingle(); // Returns null if not found

      if (followError) {
        console.error("Error checking follow status:", followError);
        // Decide how to handle this - maybe return user data without follow status?
      }
      isFollowing = !!followData;
    }

    return NextResponse.json({
      ...user,
      isFollowing,
      isCurrentUser: currentUserId === user.id,
    });
  } catch (error) {
    // Keep existing error handling
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
