import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth'; // Removed getUserId as it's not used here
import { uploadImage } from '@/lib/supabase-storage';
import { ProductTag, Product, Brand, Category } from '@/src/types/product'; // Use ProductTag

// 投稿一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    // const limit = Number(searchParams.get('limit') || '10'); // Remove duplicate declaration
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const from = skip;
    const to = skip + limit - 1;
    // const currentUserId = await getUserId(); // TODO: Re-implement like status fetching

    console.log('Fetching posts from Supabase...');

    // クエリを構築
    let query = supabase
      .from('Post') // Revert to PascalCase table name
      .select(`
        *,
        User ( id, username, name, image ), 
        Tag (
          *,
          Product (
            *,
            Brand (*),
            Category (*)
          )
        ),
        Like ( count ), 
        Comment ( count )
      `, { count: 'exact' }) // Fetch count simultaneously
      .order('createdAt', { ascending: false }) // Revert to camelCase column name (based on Prisma schema)
      .range(from, to);

    // クエリパラメータに基づいてフィルタリング
    if (userId) {
      // Revert to camelCase foreign key column name
      query = query.eq('userId', userId); 
    }

    // クエリを実行
    const { data: postsData, error, count: total } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: '投稿一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    console.log(`Found ${postsData?.length ?? 0} posts.`);

    // TODO: Fetch like status for the current user efficiently (e.g., using RPC)
    // For now, return posts without like status.
    // Map Supabase response structure if needed (e.g., likes/comments count)
    const posts = postsData?.map(p => ({
      ...p,
      // Map counts from PascalCase relation names
      _count: { 
        likes: p.Like[0]?.count ?? 0,
        comments: p.Comment[0]?.count ?? 0,
      },
      // Remove the count arrays from the main object
      Like: undefined, 
      Comment: undefined,
      // Map user relation from PascalCase
      user: p.User, 
      User: undefined,
      // Map tags relation from PascalCase
      // Use ProductTag type
      tags: p.Tag?.map((t: ProductTag & { Product?: Product & { Brand?: Brand, Category?: Category } }) => ({
          ...t,
          product: t.Product ? {
              ...t.Product,
              brand: t.Product.Brand,
              category: t.Product.Category,
              Brand: undefined, // Clean up nested PascalCase
              Category: undefined, // Clean up nested PascalCase
          } : null,
          Product: undefined, // Clean up nested PascalCase
      })) || [],
      Tag: undefined, // Clean up PascalCase relation name
    })) || [];

    // Ensure total is not null
    const totalCount = total ?? 0;

    return NextResponse.json({
      posts: posts,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching posts:', error.message, error.stack);
    } else {
      console.error('Error fetching posts (unknown type):', error);
    }
    return NextResponse.json(
      { error: '投稿一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しい投稿を作成
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
      .from('Post') // Revert to PascalCase
      .insert({
        title,
        description,
        imageUrl: uploadResult.url, // Revert to camelCase
        userId: userId,             // Revert to camelCase
      })
      .select('id') // Select only the ID initially
      .single();

    if (postInsertError || !newPostData) {
      // Handle potential column name mismatch error here if needed
      console.error('Error creating post:', postInsertError);
      return NextResponse.json({ error: '投稿の作成に失敗しました (step 1)' }, { status: 500 });
    }

    const postId = newPostData.id;

    // 2. タグを作成 (if any)
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        postId: postId,          // Revert to camelCase
        productId: tag.productId, // Revert to camelCase
        xPosition: tag.xPosition, // Revert to camelCase
        yPosition: tag.yPosition, // Revert to camelCase
      }));

      const { error: tagsInsertError } = await supabase
        .from('Tag') // Revert to PascalCase
        .insert(tagsToInsert);

      if (tagsInsertError) {
        // Handle potential column name mismatch error here if needed
        // TODO: Consider rolling back the post insert or handling partial failure
        console.error('Error creating tags:', tagsInsertError);
        return NextResponse.json({ error: 'タグの作成に失敗しました (step 2)' }, { status: 500 });
      }
    }

    // 3. 作成された投稿と関連データを取得して返す
    const { data: finalPostData, error: finalFetchError } = await supabase
      .from('Post') // Revert to PascalCase
      .select(`
        *,
        User ( id, username, name, image ),
        Tag (
          *,
          Product (
            *,
            Brand (*),
            Category (*)
          )
        )
      `)
      .eq('id', postId)
      .single();

    if (finalFetchError || !finalPostData) {
      console.error('Error fetching created post:', finalFetchError);
      // Return basic info if fetch fails, as post/tags were likely created
      return NextResponse.json({ id: postId, title, description, imageUrl: uploadResult.url, userId }); 
    }
    
    // Map response similar to GET
    const finalPost = {
        ...finalPostData,
        user: finalPostData.User,
        User: undefined,
        // Use ProductTag type
        tags: finalPostData.Tag?.map((t: ProductTag & { Product?: Product & { Brand?: Brand, Category?: Category } }) => ({
            ...t,
            product: t.Product ? {
                ...t.Product,
                brand: t.Product.Brand,
                category: t.Product.Category,
                Brand: undefined,
                Category: undefined,
            } : null,
            Product: undefined,
        })) || [],
        Tag: undefined,
    };


    return NextResponse.json(finalPost);
  } catch (error) {
    // Keep existing error handling structure
    // Keep existing error handling structure
    console.error('Error creating post:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}
