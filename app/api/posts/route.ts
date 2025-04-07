import { NextRequest, NextResponse } from 'next/server';
// Remove direct supabase client import
// import supabase from '@/lib/supabase';
import { getUserId, requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/supabase-storage';
// Import repository
import { findManyPosts, createPost } from '@/lib/repositories/PostRepository';
// Import only necessary types
import type { Post as PostType, ProductTag } from '@/src/types/post'; // Re-add ProductTag
// Remove unused type imports
// import type { Product, Brand } from '@/src/types/product';
// import type { UserProfile } from '@/src/types/user';
// import type { Database } from '@/src/types/supabase'; // Keep commented out for now

// Remove Supabase row type definitions as they are handled by the repository
/*
type UserRow = Database['public']['Tables']['User']['Row'];
type LikeRow = Database['public']['Tables']['Like']['Row'];
type SaveRow = Database['public']['Tables']['Save']['Row'];
type BrandRow = Database['public']['Tables']['Brand']['Row'];
type ProductRow = Database['public']['Tables']['Product']['Row'];
type TagRow = Database['public']['Tables']['Tag']['Row'];
type PostRow = Database['public']['Tables']['Post']['Row'];
*/

// Remove complex type definitions as they are handled by the repository
/*
type PostWithRelations = PostRow & { ... };
type CompletePostDataFromSupabase = PostWithRelations;
*/

// Remove old interfaces
/*
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
  tags: (TagRow & { product: (ProductRow & { brand: BrandRow | null }) | null })[];
}
*/


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
    const currentAuthUserId = await getUserId(); // Still need auth user ID for context

    console.log(`[API /posts] Calling repository to fetch posts for user: ${userIdParam ?? 'all'}, page: ${page}, limit: ${limit}, authUser: ${currentAuthUserId ?? 'none'}`);

    // Call the repository function
    const { posts, total, error } = await findManyPosts(
      { page, limit, userIdParam },
      currentAuthUserId
    );

    if (error) {
      console.error('[API /posts] Error from repository:', error.message);
      return NextResponse.json(
        { error: '投稿一覧の取得に失敗しました (repository error)', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API /posts] Received ${posts.length} posts from repository, total: ${total}.`);

    // Repository now returns mapped PostType[], so no mapping needed here.
    // Total count is also returned directly.

    return NextResponse.json({
      posts: posts, // Use the posts directly from the repository result
      pagination: {
        total: total, // Use total from repository result
        page,
        limit,
        hasNextPage: (page * limit) < total, // Calculate based on total from repository
        pages: Math.ceil(total / limit),
      },
    });
    // Removed leftover mapping code from previous incorrect replace operation
  } catch (error) {
    // Corrected catch block
    if (error instanceof Error) {
      console.error('[API /posts] Error fetching posts:', error.message, error.stack); // Use consistent log message
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
    const image = formData.get('image'); // Get as File | null
    const tagsData = formData.get('tags') as string | null; // Get as string | null

    // --- Input Validation ---
    // Basic validation
    if (!title || !image || !(image instanceof File)) {
      return NextResponse.json(
        { error: 'タイトルと画像は必須です' },
        { status: 400 }
      );
    }

    // Keep the first (correct) image upload block
    const uploadResult = await uploadImage(image, 'posts');
    if ('error' in uploadResult) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 });
    }

    // Keep the first (correct) tag parsing block, renaming `tags` to `parsedTags`
    let parsedTags: { productId: string; xPosition: number; yPosition: number }[] = [];
    if (tagsData) { // Use tagsData from function arguments
      try {
        // Use tagsData from function arguments
        const rawTags = JSON.parse(tagsData);
        // Add more robust validation if needed (e.g., using Zod)
        if (!Array.isArray(rawTags) || rawTags.some(tag =>
          typeof tag?.productId !== 'string' ||
          typeof tag?.xPosition !== 'number' ||
          typeof tag?.yPosition !== 'number'
        )) {
          throw new Error('Invalid tag structure in JSON data.');
        }
        parsedTags = rawTags; // Assign to parsedTags
      } catch (error) {
        console.error("Error parsing tags JSON:", error);
        return NextResponse.json(
          { error: 'タグデータの形式が不正です', details: error instanceof Error ? error.message : 'Unknown parsing error' },
          { status: 400 }
        );
      }
    }
    // Removed the duplicated image upload and tag parsing logic that was incorrectly inserted here.

    // --- Call Repository to Create Post ---
    // Ensure this uses the correct variables: `uploadResult` and `parsedTags` from above
    console.log(`[API /posts] Calling repository to create post for user: ${userId}`);
    const { post: newPost, error: createError } = await createPost(
      {
        title,
        description,
        imageUrl: uploadResult.url,
      },
      parsedTags,
      userId
    );

    if (createError || !newPost) {
      console.error('[API /posts] Error from createPost repository:', createError?.message);
      // Check if the error is due to tag creation failure (which implies post was created but tags failed)
      // The repository currently returns a generic error message for tag failure.
      // More specific error handling could be implemented in the repository.
      return NextResponse.json(
        { error: '投稿の作成に失敗しました (repository error)', details: createError?.message },
        { status: 500 } // Or potentially a different status if tag creation failed specifically
      );
    }

    console.log(`[API /posts] Successfully created post ID: ${newPost.id} via repository.`);

    // Repository now returns the complete PostType object
    return NextResponse.json(newPost);
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
