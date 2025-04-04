import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { getUserId } from '@/lib/auth'; // Import getUserId
import { uploadImage } from '@/lib/supabase-storage';
import { ProductTag, Product, Brand, Category, Post as PostType, UserProfile } from '@/src/types/product'; // Use PostType alias, import UserProfile

// 投稿一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId'); // Renamed to avoid conflict with auth userId
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const from = skip;
    const to = skip + limit - 1;
    const currentAuthUserId = await getUserId(); // Get current authenticated user's ID

    console.log('[API /posts] Fetching posts (SIMPLIFIED)...'); // Add log

    // クエリを構築 - Use PascalCase table names and camelCase column names
    // EXTREMELY SIMPLIFIED select for debugging - only direct Post fields
    let query = supabase
      .from('Post') // Use PascalCase table name "Post"
      .select(`
        id,
        title,
        description,
        imageUrl,
        created_at, 
        updated_at, 
        userId
      `, { count: 'exact' }) // Select only direct fields, but keep count for pagination
      .order('created_at', { ascending: false }) // Use snake_case column name
      .range(from, to);

    // クエリパラメータに基づいてフィルタリング
    if (userIdParam) {
      // Use camelCase foreign key column name
      query = query.eq('userId', userIdParam); 
    }

    // クエリを実行
    const { data: postsData, error, count: total } = await query;

    if (error) {
      console.error('[API /posts] Supabase error fetching posts (SIMPLIFIED):', error); // Log specific error
      return NextResponse.json(
        { error: '投稿一覧の取得中にデータベースエラーが発生しました (SIMPLIFIED)', details: error.message }, // Include details
        { status: 500 }
      );
    }

    console.log(`[API /posts] Found ${postsData?.length ?? 0} posts raw data (SIMPLIFIED).`);

    // Map Supabase response structure (SIMPLIFIED)
    const posts: PostType[] = postsData?.map((p: any): PostType => { // Use 'any' for raw data, add return type
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        userId: p.userId,
        createdAt: p.created_at, // Map from snake_case
        updatedAt: p.updated_at, // Map from snake_case
        // Set counts and relations to default/null values
        _count: { 
          likes: 0,
          comments: 0,
        },
        user: null,
        tags: [],
        isLiked: false, // Cannot determine like status without fetching
        // isSaved: false, 
      };
    }) || [];

    console.log(`[API /posts] Mapped ${posts.length} posts (SIMPLIFIED).`); // Add log

    // Ensure total is not null
    const totalCount = total ?? 0;

    return NextResponse.json({
      // Use the correct key 'posts' expected by the frontend
      posts: posts, 
      pagination: {
        total: totalCount,
        page,
        limit,
        // Calculate hasNextPage based on fetched count vs limit
        hasNextPage: (page * limit) < totalCount, 
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[API /posts] Error fetching posts (SIMPLIFIED):', error.message, error.stack);
    } else {
      console.error('[API /posts] Error fetching posts (unknown type) (SIMPLIFIED):', error);
    }
    return NextResponse.json(
      { error: '投稿一覧の取得に失敗しました (SIMPLIFIED)', details: error instanceof Error ? error.message : 'Unknown error' }, // Include details
      { status: 500 }
    );
  }
}

// 新しい投稿を作成 (POST handler remains the same for now, but might need simplification if GET fails)
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const userId = await requireAuth();
    
    // リクエストボディを取得
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const image = formData.get('image') as File;
    const tagsData = formData.get('tags') as string;
    
    // バリデーション
    if (!title || !image) {
      return NextResponse.json(
        { error: 'タイトルと画像は必須です' },
        { status: 400 }
      );
    }
    
    // 画像をSupabaseにアップロード
    const uploadResult = await uploadImage(image, 'posts');
    
    if ('error' in uploadResult) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }
    
    // タグデータをパース
    let tags: { productId: string; xPosition: number; yPosition: number }[] = [];
    try {
      if (tagsData) {
        tags = JSON.parse(tagsData);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'タグデータの形式が不正です' },
        { status: 400 }
      );
    }

    // 1. 投稿を作成
    const { data: newPostData, error: postInsertError } = await supabase
      .from('Post') // Use PascalCase
      .insert({
        title,
        description,
        imageUrl: uploadResult.url, // Use camelCase
        userId: userId,             // Use camelCase
        // Add updatedAt if your table has it and you want to set it on creation
        // updatedAt: new Date().toISOString(), 
      })
      .select('id') // Select only the ID initially
      .single();

    if (postInsertError || !newPostData) {
      console.error('Error creating post:', postInsertError);
      return NextResponse.json({ error: '投稿の作成に失敗しました (step 1)', details: postInsertError?.message }, { status: 500 });
    }

    const postId = newPostData.id;

    // 2. タグを作成 (if any)
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        postId: postId,          // Use camelCase
        productId: tag.productId, // Use camelCase
        xPosition: tag.xPosition, // Use camelCase
        yPosition: tag.yPosition, // Use camelCase
      }));

      const { error: tagsInsertError } = await supabase
        .from('Tag') // Use PascalCase
        .insert(tagsToInsert);

      if (tagsInsertError) {
        console.error('Error creating tags:', tagsInsertError);
        // Consider rolling back post insert or logging for manual cleanup
        return NextResponse.json({ error: 'タグの作成に失敗しました (step 2)', details: tagsInsertError.message }, { status: 500 });
      }
    }

    // 3. 作成された投稿と関連データを取得して返す (SIMPLIFIED)
    const { data: finalPostData, error: finalFetchError } = await supabase
      .from('Post') // Use PascalCase
      .select(`
        id,
        title,
        description,
        imageUrl,
        createdAt,
        updatedAt, 
        userId
      `) // Simplified select
      .eq('id', postId)
      .single();

    if (finalFetchError || !finalPostData) {
      console.error('Error fetching created post (SIMPLIFIED):', finalFetchError);
      // Return basic info if fetch fails
      return NextResponse.json({ id: postId, title, description, imageUrl: uploadResult.url, userId }); 
    }
    
    // Map response similar to GET (SIMPLIFIED)
    const finalPost: PostType = {
        id: finalPostData.id,
        title: finalPostData.title,
        description: finalPostData.description,
        imageUrl: finalPostData.imageUrl,
        userId: finalPostData.userId,
        createdAt: finalPostData.createdAt,
        updatedAt: finalPostData.updatedAt, // Add if exists
        _count: { // Counts will be 0 for a new post
            likes: 0,
            comments: 0,
        },
        user: null, // Simplified
        tags: [],   // Simplified
        isLiked: false, 
        // isSaved: false, 
    };


    return NextResponse.json(finalPost);
  } catch (error) {
    // Keep existing error handling structure
    console.error('Error creating post:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '投稿の作成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' }, // Include details
      { status: 500 }
    );
  }
}
