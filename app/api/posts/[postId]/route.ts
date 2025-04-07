import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth, hasAccessToResource, getUserId } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/supabase-storage';
// Use import type and correct paths for moved types
import type { ProductTag, Post as PostType } from '@/src/types/post';
import type { UserProfile } from '@/src/types/user';
import type { Product, Brand, Category } from '@/src/types/product';

// Define interfaces for the GET request Supabase query result
interface SingleSupabaseUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null; // Use correct column name 'image'
}
interface SingleSupabaseLike {
  userId: string;
}
interface SingleSupabaseSave {
  userId: string;
}
interface SingleSupabaseBrand {
    id: string;
    name: string;
}
interface SingleSupabaseProduct {
    id: string;
    name: string;
    imageUrl: string | null;
    brand: SingleSupabaseBrand | null;
}
interface SingleSupabaseTag {
    id: string;
    postId: string;
    productId: string;
    created_at: string;
    xPosition: number;
    yPosition: number;
    product: SingleSupabaseProduct | null;
}
interface SingleSupabaseCommentInfo {
    count: number;
}
interface SinglePostDataFromSupabase {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  userId: string;
  user: SingleSupabaseUser | null; // Expecting object or null
  likes: SingleSupabaseLike[];
  saves: SingleSupabaseSave[];
  tags: SingleSupabaseTag[];
  comments: SingleSupabaseCommentInfo[]; // Expecting array with one count object
}


// 投稿の詳細を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    console.log(`[API /posts/${postId}] Fetching post details for ID: ${postId}`); // Log incoming request
    const currentUserId = await getUserId(); // Can be null if user is not logged in

    // 投稿を取得 - Include Likes and Saves with userId
    const { data: postData, error: postError } = await supabase
      .from('Post')
      .select(`
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
        tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, brand:Brand ( id, name ) ) ),
        comments:Comment ( count ) 
      `) // Fetch comment count directly
      .eq('id', postId)
      .single();

    console.log(`[API /posts/${postId}] Supabase query result:`, { data: postData, error: postError }); // Log query result

    // Cast the fetched data
    const typedPostData = postData as SinglePostDataFromSupabase | null;

    if (postError || !typedPostData) {
      if (postError && postError.code !== 'PGRST116') { // Ignore 'not found' error for now
         console.error('Error fetching post:', postError);
      }
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // Map Supabase response structure to PostType using typedPostData
    const likesCount = typedPostData.likes?.length ?? 0;
    const savesCount = typedPostData.saves?.length ?? 0;
    const commentsCount = typedPostData.comments?.[0]?.count ?? 0;
    const isLiked = currentUserId ? typedPostData.likes.some((like) => like.userId === currentUserId) : false;
    const isSaved = currentUserId ? typedPostData.saves.some((save) => save.userId === currentUserId) : false;

    const tags: ProductTag[] = typedPostData.tags?.map((t): ProductTag => ({ // Use inferred type t
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
    })) || [];

    const post: PostType = {
      id: typedPostData.id,
      title: typedPostData.title,
      description: typedPostData.description,
      imageUrl: typedPostData.imageUrl,
      userId: typedPostData.userId,
      createdAt: typedPostData.created_at,
      updatedAt: typedPostData.updated_at,
      _count: {
        likes: likesCount,
        comments: commentsCount,
        saves: savesCount,
      },
      // Map user directly using typed data
      user: typedPostData.user ? {
        id: typedPostData.user.id,
        username: typedPostData.user.username,
        name: typedPostData.user.name,
        image: typedPostData.user.image, // Map 'image' column
      } : null,
      tags: tags,
      comments: [], // Comments are not fetched in detail here, only count
      isLiked: isLiked,
      isSaved: isSaved,
    };

    return NextResponse.json({
      ...post,
      // Add isOwner flag
      isOwner: currentUserId === post.userId,
    });
  } catch (error) {
    // Keep existing error handling
    // Keep existing error handling
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿を更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 投稿を取得して所有者を確認
    const { data: postOwnerData, error: ownerCheckError } = await supabase
      .from('Post') // Revert to PascalCase
      .select('userId, imageUrl') // Revert to camelCase
      .eq('id', postId)
      .single(); // Use single to error if not found

    if (ownerCheckError) {
       if (ownerCheckError.code === 'PGRST116') { // Post not found
         return NextResponse.json(
           { error: '投稿が見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching post for ownership check:", ownerCheckError);
       return NextResponse.json({ error: '投稿の取得中にエラーが発生しました' }, { status: 500 });
    }

    if (!postOwnerData) { // Should be caught by single(), but double-check
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿の所有者かどうか確認
    if (!hasAccessToResource(postOwnerData.userId)) { // Check against fetched userId
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    // リクエストボディを取得
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const image = formData.get('image') as File | null;
    const tagsData = formData.get('tags') as string;

    // バリデーション
    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    // 更新データを準備 (Use camelCase)
    const updateData: { title: string; description: string | null; imageUrl?: string } = {
      title,
      description,
    };

    // 画像が提供された場合は更新
    if (image) {
      // 古い画像を削除
      if (postOwnerData.imageUrl) { // Use camelCase
        await deleteImage(postOwnerData.imageUrl, 'posts');
      }

      // 新しい画像をアップロード
      const uploadResult = await uploadImage(image, 'posts');

      if ('error' in uploadResult) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 500 }
        );
      }

      updateData.imageUrl = uploadResult.url; // Use camelCase
    }

    // タグデータをパース (Use camelCase internally for consistency)
    let tags: { productId: string; xPosition: number; yPosition: number }[] = [];
    try { // Move try block here
      if (tagsData) {
        // Expect camelCase from client based on previous code
        const parsedTags = JSON.parse(tagsData);
        // Define type for parsed client-side tag data
        tags = parsedTags.map((t: { productId: string; xPosition: number; yPosition: number }) => ({
            productId: t.productId,
            xPosition: t.xPosition,
            yPosition: t.yPosition
        }));
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'タグデータの形式が不正です' },
        { status: 400 }
      );
    }
    // Move catch block end here

    // --- Transaction Logic (Conceptual - Supabase doesn't have direct transactions like Prisma) ---
    // 1. Update post data
    const { error: postUpdateError } = await supabase
        .from('Post') // Revert to PascalCase
        .update(updateData) // updateData uses camelCase keys matching schema
        .eq('id', postId);

    if (postUpdateError) {
        console.error("Error updating post data:", postUpdateError);
        return NextResponse.json({ error: '投稿データの更新に失敗しました' }, { status: 500 });
    }

    // 2. Delete existing tags
    const { error: deleteTagsError } = await supabase
        .from('Tag') // Revert to PascalCase
        .delete()
        .eq('postId', postId); // Revert to camelCase

    if (deleteTagsError) {
        // TODO: Handle potential inconsistency (post updated, tags not deleted)
        console.error("Error deleting existing tags:", deleteTagsError);
        return NextResponse.json({ error: '既存タグの削除に失敗しました' }, { status: 500 });
    }

    // 3. Insert new tags (if any)
    if (tags.length > 0) {
        const tagsToInsert = tags.map(tag => ({
            postId: postId, // Use camelCase
            productId: tag.productId, // Use camelCase
            xPosition: tag.xPosition, // Use camelCase
            yPosition: tag.yPosition, // Use camelCase
        }));
        const { error: insertTagsError } = await supabase
            .from('Tag') // Revert to PascalCase
            .insert(tagsToInsert);

        if (insertTagsError) {
            // TODO: Handle potential inconsistency (post updated, old tags deleted, new tags failed)
            console.error("Error inserting new tags:", insertTagsError);
            return NextResponse.json({ error: '新規タグの作成に失敗しました' }, { status: 500 });
        }
    }
    // --- End Transaction Logic ---


    // 4. Fetch the updated post with relations to return
     const { data: finalUpdatedPostData, error: finalFetchError } = await supabase
      .from('Post') // Revert to PascalCase
      .select(`
        *,
        user:User ( id, username, name, image ), // Select 'image' column
        tags:Tag (
          id, postId, productId, created_at, xPosition, yPosition,
          product:Product (
            id, name, imageUrl,
            brand:Brand (id, name)
          )
        )
      `) // Removed comments from select
      .eq('id', postId)
      .single();

    if (finalFetchError || !finalUpdatedPostData) {
      console.error('Error fetching updated post:', finalFetchError);
      // Return basic info if fetch fails, as post/tags were likely updated
      return NextResponse.json({ id: postId, ...updateData }); 
    }
    
    // Map response similar to GET, but use PostType and map counts/status
    // Note: Likes/Saves/Comments counts are NOT fetched in the final select for PATCH,
    // so we cannot reliably update them here without another fetch or passing them.
    // We will return the updated post structure but counts/isLiked/isSaved might be stale
    // if the goal is just to confirm the PATCH succeeded and return the core updated data.
    // If fresh counts/status are needed, the client should refetch the post after PATCH.

    const updatedTags: ProductTag[] = finalUpdatedPostData.tags?.map((t: any): ProductTag => ({
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
    })) || [];

    const finalUpdatedPost: PostType = {
        id: finalUpdatedPostData.id,
        title: finalUpdatedPostData.title,
        description: finalUpdatedPostData.description,
        imageUrl: finalUpdatedPostData.imageUrl,
        userId: finalUpdatedPostData.userId,
        createdAt: finalUpdatedPostData.created_at,
        updatedAt: finalUpdatedPostData.updated_at,
        _count: {
            // Use potentially stale counts/status or omit them
            likes: 0, // Omit or use stale data
            comments: 0, // Omit or use stale data
            saves: 0, // Omit or use stale data
        },
        // Use IIFE for user mapping
        user: (() => {
            const user = finalUpdatedPostData.user;
            if (user && typeof user === 'object' && !Array.isArray(user)) {
                return {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    image: user.image, // Map 'image' column
                } as UserProfile;
            }
            return null;
        })(),
        tags: updatedTags,
        comments: [], // Comments not fetched in detail
        // Omit isLiked/isSaved or use stale data
        // isLiked: updatedIsLiked,
        // isSaved: updatedIsSaved,
    };

    return NextResponse.json(finalUpdatedPost);
  } catch (error) {
    // Keep existing error handling
    // Keep existing error handling
    console.error('Error updating post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '投稿の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿を削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 投稿を取得して所有者を確認 & 画像URL取得
    const { data: postToDelete, error: fetchError } = await supabase
      .from('Post') // Revert to PascalCase
      .select('userId, imageUrl') // Revert to camelCase
      .eq('id', postId)
      .single();

    if (fetchError) {
       if (fetchError.code === 'PGRST116') { // Post not found
         return NextResponse.json(
           { error: '投稿が見つかりません' },
           { status: 404 }
         );
       }
       console.error("Error fetching post for deletion:", fetchError);
       return NextResponse.json({ error: '投稿の取得中にエラーが発生しました' }, { status: 500 });
    }

    if (!postToDelete) { // Should be caught by single()
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿の所有者かどうか確認
    if (!hasAccessToResource(postToDelete.userId)) { // Check against fetched userId
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    // 画像を削除 (Storage)
    if (postToDelete.imageUrl) { // Use camelCase
      // Add error handling for deleteImage if necessary
      await deleteImage(postToDelete.imageUrl, 'posts'); 
    }

    // 投稿を削除 (Database)
    // Assumes cascade delete is set up in Supabase DB schema for related tables (Tag, Like, Comment, SavedPost)
    const { error: deleteError } = await supabase
      .from('Post') // Revert to PascalCase
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('Error deleting post from database:', deleteError);
      return NextResponse.json({ error: 'データベースからの投稿削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Keep existing error handling
    console.error('Error deleting post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}
