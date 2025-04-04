import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { getUserId } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// ユーザー情報を取得
export async function GET(
  req: NextRequest,
  // Update params type to use identifier
  { params }: { params: { identifier: string } }
) {
  try {
    // Get userId (identifier) from params
    const userId = params.identifier;
    const currentUserId = await getUserId(); // Still needed for isCurrentUser check

    console.log(`[API] Fetching user with ID: ${userId}`); // Add logging

    // ユーザーを取得 - identifier is always treated as userId
    // Use PascalCase table names and camelCase column names based on provided schema
    // EXTREMELY SIMPLIFIED select statement for debugging
    const { data: userData, error: userError } = await supabase
      .from('User') // Use PascalCase table name "User"
      .select(`
        id,
        username,
        name,
        image,
        created_at 
      `) // Select ONLY direct fields from User table
      // Always filter by 'id' column using userId
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to return null instead of error if not found

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

    console.log(`[API] User found:`, userData);

     // Map basic user data (no counts or relations)
     const user = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        image: userData.image,
        createdAt: userData.created_at, // Map from snake_case
     };

    return NextResponse.json({
      ...user,
      // isFollowing is removed as we are not fetching relations
      isCurrentUser: currentUserId === user.id,
    });
    
  } catch (error: any) { // Catch any potential error, including auth errors
    console.error('[API] Error in GET /api/users/[identifier]:', error); 
    // Check if it's an auth error from getUserId()
    if (error.message === '認証が必要です') {
         return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'ユーザー情報の取得中に予期せぬエラーが発生しました', details: error.message },
      { status: 500 }
    );
  }
}
