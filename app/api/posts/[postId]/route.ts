import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth, hasAccessToResource, getUserId } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/supabase-storage';
import { ProductTag, Product, Brand, Category } from '@/src/types/product'; // Use ProductTag

// 投稿の詳細を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const currentUserId = await getUserId();

    // 投稿を取得
    const { data: postData, error: postError } = await supabase
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
        ),
        Comment ( 
          *, 
          User ( id, username, name, image ) 
        ),
        Like ( count ),
        SavedPost ( count ) 
      `)
      .eq('id', postId)
      .order('createdAt', { foreignTable: 'Comment', ascending: false }) // Revert to camelCase & PascalCase
      .limit(10, { foreignTable: 'Comment' }) // Revert to PascalCase
      .single();


    if (postError || !postData) {
      if (postError && postError.code !== 'PGRST116') { // Ignore 'not found' error for now
         console.error('Error fetching post:', postError);
      }
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // Map Supabase response structure
    const post = {
        ...postData,
        _count: {
            likes: postData.Like[0]?.count ?? 0, // Use PascalCase
            comments: postData.Comment?.length ?? 0, // Use PascalCase
            saved: postData.SavedPost?.[0]?.count ?? 0, // Use PascalCase
        },
        Like: undefined, // Clean up
        SavedPost: undefined, // Clean up
        Comment: undefined, // Clean up comments array after mapping count
        user: postData.User, // Map nested user
        User: undefined, // Clean up
        // Map tags relation from PascalCase
        // Use ProductTag type
        tags: postData.Tag?.map((t: ProductTag & { Product?: Product & { Brand?: Brand, Category?: Category } }) => ({
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
    };


    // 現在のユーザーがいいね/保存しているか確認 (Separate queries for now)
    // TODO: Optimize this, potentially with RPC or modifying the main query
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      // いいね状態を確認
      const { data: likeData, error: likeError } = await supabase
        .from('Like') // Revert to PascalCase
        .select('id', { count: 'exact' })
        .eq('userId', currentUserId) // Revert to camelCase
        .eq('postId', postId) // Revert to camelCase
        .maybeSingle();
      if (likeError) console.error("Error checking like status:", likeError);
      isLiked = !!likeData;

      // 保存状態を確認
      const { data: savedData, error: savedError } = await supabase
        .from('SavedPost') // Revert to PascalCase
        .select('id', { count: 'exact' })
        .eq('userId', currentUserId) // Revert to camelCase
        .eq('postId', postId) // Revert to camelCase
        .maybeSingle();
      if (savedError) console.error("Error checking save status:", savedError);
      isSaved = !!savedData;
    }

    return NextResponse.json({
      ...post,
      isLiked,
      isSaved,
      // Ensure post.user exists before accessing id
      isOwner: currentUserId === post.user?.id, 
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

    if (finalFetchError || !finalUpdatedPostData) {
      console.error('Error fetching updated post:', finalFetchError);
      // Return basic info if fetch fails, as post/tags were likely updated
      return NextResponse.json({ id: postId, ...updateData }); 
    }
    
    // Map response similar to GET
    const finalUpdatedPost = {
        ...finalUpdatedPostData,
        user: finalUpdatedPostData.User,
        User: undefined,
        // Use ProductTag type
        tags: finalUpdatedPostData.Tag?.map((t: ProductTag & { Product?: Product & { Brand?: Brand, Category?: Category } }) => ({
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
