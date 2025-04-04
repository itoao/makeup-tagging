import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// ユーザー一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const limit = Number(searchParams.get('limit') || '10');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const from = skip;
    const to = skip + limit - 1;

    // クエリを構築
    // TODO: Verify relation names ('Followers', 'Following') match Supabase schema (likely 'Follow')
    let query = supabase
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
      `, { count: 'exact' }) // Fetch count simultaneously using aliases
      // Note: The relation names Follow!followingId and Follow!followerId depend on Supabase FK naming.
      // Verify these in your Supabase schema or generated types.
      .order('createdAt', { ascending: false }) // Revert to camelCase
      .range(from, to);

    // クエリパラメータに基づいてフィルタリング
    if (username) {
      query = query.ilike('username', `%${username}%`);
    }

    // クエリを実行
    const { data: usersData, error, count: total } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'ユーザー一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Map count structure using aliases
    const users = usersData?.map(u => ({
        ...u,
        _count: {
            posts: u.Post[0]?.count ?? 0,
            followers: u.followers[0]?.count ?? 0, 
            following: u.following[0]?.count ?? 0,
        },
        Post: undefined, // Clean up
        followers: undefined, // Clean up alias
        following: undefined, // Clean up alias
    })) || [];

    const totalCount = total ?? 0;

    return NextResponse.json({
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    // Keep existing error handling
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザープロフィールを更新
export async function PATCH(req: NextRequest) {
  try {
    // 認証チェック
    const userId = await requireAuth();
    
    // リクエストボディを取得
    const body = await req.json();
    const { name, bio } = body;
    
    // 更新するフィールドを検証
    if (typeof name !== 'string' && name !== undefined) {
      return NextResponse.json(
        { error: '名前は文字列である必要があります' },
        { status: 400 }
      );
    }
    
    if (typeof bio !== 'string' && bio !== undefined) {
      return NextResponse.json(
        { error: 'プロフィールは文字列である必要があります' },
        { status: 400 }
      );
    }

    // Prepare update data, only including defined fields
    const updateData: { name?: string; bio?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    // ユーザープロフィールを更新
    const { data: updatedUserData, error: updateError } = await supabase
      .from('User') // Revert to PascalCase
      .update(updateData) // updateData uses camelCase keys
      .eq('id', userId)
      .select(`
        id,
        username,
        name,
        bio,
        image,
        createdAt 
      `) // Revert to camelCase
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      // Handle potential errors like user not found if needed
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(updatedUserData);
  } catch (error) {
    // Keep existing error handling
    console.error('Error updating user profile:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    );
  }
}
