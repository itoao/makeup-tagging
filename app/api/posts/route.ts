import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { getUserId, requireAuth } from '@/lib/auth'; // Import getUserId and requireAuth
import { uploadImage } from '@/lib/supabase-storage';
// Ensure Post type includes isSaved and _count.saves
import { ProductTag, Product, Brand, Category, Post as PostType, UserProfile } from '@/src/types/product';

// Define interfaces for Supabase query results to help TypeScript inference
interface SupabaseUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null; // Use correct column name 'image'
}
interface SupabaseLike {
  userId: string;
}
interface SupabaseSave {
  userId: string;
}
interface SupabaseBrand {
    id: string;
    name: string;
}
interface SupabaseProduct {
    id: string;
    name: string;
    imageUrl: string | null;
    brand: SupabaseBrand | null;
}
interface SupabaseTag {
    id: string;
    postId: string;
    productId: string;
    created_at: string;
    xPosition: number;
    yPosition: number;
    product: SupabaseProduct | null;
}
interface CompletePostDataFromSupabase {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  userId: string;
  user: SupabaseUser | null; // Expecting object or null
  likes: SupabaseLike[];
  saves: SupabaseSave[];
  tags: SupabaseTag[];
}


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
    const currentAuthUserId = await getUserId(); // Get current authenticated user's ID (can be null)

    console.log(`[API /posts] Fetching posts for user: ${userIdParam ?? 'all'}, page: ${page}, limit: ${limit}, authUser: ${currentAuthUserId ?? 'none'}`);

    // クエリを構築 - 関連データを含める
    // Fetch related counts and user details
    // Fetch user's like/save status if authenticated
    let selectStatement = `
      id,
      title,
      description,
      imageUrl,
      created_at,
      updated_at,
      userId,
      user:User ( id, username, name, image ),
      likes:Like ( userId ),
      saves:Save ( userId ),
      tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, brand:Brand ( id, name ) ) )
    `;

    let query = supabase
      .from('Post')
      .select(selectStatement, { count: 'exact' }) // Fetch related data
      .order('created_at', { ascending: false })
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

    console.log(`[API /posts] Found ${postsData?.length ?? 0} posts raw data.`);

    // Map Supabase response structure to PostType
    const posts: PostType[] = postsData?.map((p: any): PostType => {
      const likesCount = p.likes?.length ?? 0;
      const savesCount = p.saves?.length ?? 0;
      // Check if the current authenticated user has liked/saved this post
      const isLiked = currentAuthUserId ? p.likes.some((like: any) => like.userId === currentAuthUserId) : false;
      const isSaved = currentAuthUserId ? p.saves.some((save: any) => save.userId === currentAuthUserId) : false;

      // Map tags with product and brand details, including required ProductTag fields
      const tags: ProductTag[] = p.tags?.map((t: any): ProductTag => ({
          id: t.id,
          postId: t.postId, // Add postId
          productId: t.productId, // Add productId
          createdAt: t.created_at, // Add createdAt (map from snake_case)
          xPosition: t.xPosition,
          yPosition: t.yPosition,
          product: t.product ? {
              id: t.product.id,
              name: t.product.name,
              imageUrl: t.product.imageUrl ?? null,
              // Construct Brand object correctly
              brand: t.product.brand ? { id: t.product.brand.id, name: t.product.brand.name } : null,
              description: null, // Assuming not selected
              category: null,    // Assuming not selected
          } : null, // Return null if t.product is null/undefined
      })) || [];

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        userId: p.userId,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        _count: {
          likes: likesCount,
          comments: 0, // TODO: Fetch comment count if needed
          saves: savesCount,
        },
         user: p.user ? { // Map user data if exists
           id: p.user.id,
           username: p.user.username,
           name: p.user.name,
           image: p.user.image, // Map 'image' column
         } : null,
         tags: tags,
         comments: [], // Add empty comments array to satisfy type
        isLiked: isLiked,
        isSaved: isSaved,
      };
    }) || [];

    console.log(`[API /posts] Mapped ${posts.length} posts.`);

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
      { error: '投稿一覧の取得に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 新しい投稿を作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const userId = await requireAuth(); // Use requireAuth here

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

    // 3. Fetch the complete post data including relations after creation
    const { data: completePostData, error: fetchCompleteError } = await supabase
      .from('Post')
      .select(`
        id,
        title,
        description,
        imageUrl,
        created_at,
        updated_at,
        userId,
        user:User ( id, username, name, image ), // Select 'image' column
        likes:Like ( userId ),
        saves:Save ( userId ),
        tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, brand:Brand ( id, name ) ) )
      `)
      .eq('id', postId)
      .single();

    // Cast the fetched data to the defined interface
    const typedCompletePostData = completePostData as CompletePostDataFromSupabase | null;

    if (fetchCompleteError || !typedCompletePostData) {
        console.error('Error fetching complete created post:', fetchCompleteError);
        // Fallback to returning the basic info if the detailed fetch fails
        return NextResponse.json({ id: postId, title, description, imageUrl: uploadResult.url, userId, _count: { likes: 0, comments: 0, saves: 0 }, user: null, tags: [], isLiked: false, isSaved: false });
    }


    // Map the complete data using the typed variable
    const completePost: PostType = {
        id: typedCompletePostData.id,
        title: typedCompletePostData.title,
        description: typedCompletePostData.description,
        imageUrl: typedCompletePostData.imageUrl,
        userId: typedCompletePostData.userId,
        createdAt: typedCompletePostData.created_at,
        updatedAt: typedCompletePostData.updated_at,
        _count: {
            likes: typedCompletePostData.likes?.length ?? 0,
            comments: 0, // Assuming comments are handled separately
            saves: typedCompletePostData.saves?.length ?? 0,
        },
         // Map user directly using the typed data
         user: typedCompletePostData.user ? {
             id: typedCompletePostData.user.id,
             username: typedCompletePostData.user.username,
             name: typedCompletePostData.user.name,
             image: typedCompletePostData.user.image, // Map 'image' column
         } : null,
         comments: [], // Add empty comments array
         tags: typedCompletePostData.tags?.map((t): ProductTag => ({ // Use inferred type 't'
             id: t.id,
             postId: t.postId,
             productId: t.productId,
             createdAt: t.created_at,
            xPosition: t.xPosition,
            yPosition: t.yPosition,
            product: t.product ? {
                id: t.product.id,
                name: t.product.name,
                imageUrl: t.product.imageUrl ?? null,
                brand: t.product.brand ? { id: t.product.brand.id, name: t.product.brand.name } : null,
                description: null,
                category: null,
            } : null,
        })) || [],
        // For a newly created post, isLiked and isSaved are false for the creator
        isLiked: false,
        isSaved: false,
    };


    return NextResponse.json(completePost);
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
