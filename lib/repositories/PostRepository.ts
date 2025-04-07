import supabase from '@/lib/supabase';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from '@/src/types/supabase'; // Attempt to import, may fail if file is empty/invalid
import type { Post as PostType, ProductTag } from '@/src/types/post';
import type { UserProfile } from '@/src/types/user';
import type { Product, Brand } from '@/src/types/product';

// TODO: Integrate generated Supabase types (Database['public']['Tables']['...']) once src/types/supabase.ts generation is fixed.
// Using manually defined helper types for now based on expected query results.

// Helper type for the complex select query result (manual definition)
// This should ideally be derived from generated types
type PostWithRelationsManual = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  userId: string;
  // Adjust user type to potentially be an array from Supabase
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  }[] | null; // Expecting array or null
  likes: { userId: string }[];
  saves: { userId: string }[];
  tags: {
    id: string;
    postId: string;
    productId: string;
    created_at: string;
    xPosition: number;
    yPosition: number;
    // Adjust product and brand types to potentially be arrays
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      brand: {
        id: string;
        name: string;
      }[] | null; // Expecting array or null for brand
      // Add other product fields if they were selected
      description: string | null;
    }[] | null; // Expecting array or null for product
  }[];
};

// Helper function to map Supabase row to our PostType
// Moved mapping logic here from API route
const mapSupabaseRowToPostType = (p: PostWithRelationsManual, currentAuthUserId: string | null): PostType => {
  const likesCount = p.likes?.length ?? 0;
  const savesCount = p.saves?.length ?? 0;
  const isLiked = currentAuthUserId ? p.likes.some(like => like.userId === currentAuthUserId) : false;
  const isSaved = currentAuthUserId ? p.saves.some(save => save.userId === currentAuthUserId) : false;

  const tags: ProductTag[] = p.tags?.map((t): ProductTag => ({
      id: t.id,
      postId: t.postId,
      productId: t.productId,
      createdAt: t.created_at,
      xPosition: t.xPosition,
      yPosition: t.yPosition,
      // Handle product and brand potentially being arrays
      product: t.product && t.product.length > 0 ? {
          id: t.product[0].id,
          name: t.product[0].name,
          imageUrl: t.product[0].imageUrl ?? null,
          brand: t.product[0].brand && t.product[0].brand.length > 0 ? {
            id: t.product[0].brand[0].id,
            name: t.product[0].brand[0].name
          } : null,
          description: t.product[0].description, // Map description
          category: null, // Category not selected here
          // price: t.product[0].price, // Map if needed
      } : null,
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
      comments: 0, // Assuming comment count is fetched elsewhere or not needed here
      saves: savesCount,
    },
     // Handle user potentially being an array
     user: p.user && p.user.length > 0 ? {
       id: p.user[0].id,
       username: p.user[0].username,
       name: p.user[0].name,
       image: p.user[0].image,
     } : null,
     tags: tags,
     comments: [], // Default empty array
    isLiked: isLiked,
    isSaved: isSaved,
  };
};


/**
 * Finds multiple posts with relations based on criteria.
 * @param options - Filtering and pagination options.
 * @param currentAuthUserId - ID of the currently authenticated user for like/save status.
 * @returns Paginated posts and total count.
 */
export const findManyPosts = async (
  options: {
    page?: number;
    limit?: number;
    userIdParam?: string | null; // Filter by user ID
  },
  currentAuthUserId: string | null
): Promise<{ posts: PostType[]; total: number; error: Error | null }> => {
  const { page = 1, limit = 10, userIdParam = null } = options;
  const skip = (page - 1) * limit;
  const from = skip;
  const to = skip + limit - 1;

  // Define the select statement here
  const selectStatement = `
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
    tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, description, brand:Brand ( id, name ) ) )
  `; // Added description to product select

  let query = supabase
    .from('Post')
    .select(selectStatement, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (userIdParam) {
    query = query.eq('userId', userIdParam);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error in findManyPosts:', error);
    return { posts: [], total: 0, error: new Error(error.message) };
  }

  // Use manual type assertion for now
  const typedData = data as PostWithRelationsManual[] | null;

  const posts: PostType[] = typedData?.map(p => mapSupabaseRowToPostType(p, currentAuthUserId)) || [];
  const totalCount = count ?? 0;

  return { posts, total: totalCount, error: null };
};


/**
 * Creates a new post and associated tags.
 * NOTE: This function does NOT handle transactions. If tag creation fails, the post remains.
 * Transaction handling requires Supabase Edge Functions or RPC.
 * @param postData - Data for the new post.
 * @param tagsData - Array of tag data to associate with the post.
 * @param userId - The ID of the user creating the post.
 * @returns The newly created complete post data.
 */
export const createPost = async (
  postData: {
    title: string;
    description: string | null;
    imageUrl: string;
  },
  tagsData: { productId: string; xPosition: number; yPosition: number }[],
  userId: string
): Promise<{ post: PostType | null; error: Error | null }> => {

  // 1. Insert Post
  // TODO: Use generated types for insert data when available
  const { data: newPostResult, error: postInsertError } = await supabase
    .from('Post')
    .insert({
      title: postData.title,
      description: postData.description,
      imageUrl: postData.imageUrl,
      userId: userId,
    })
    .select('id') // Select only the ID initially
    .single();

  if (postInsertError || !newPostResult) {
    console.error('Error creating post (repository):', postInsertError);
    return { post: null, error: new Error(postInsertError?.message || 'Failed to insert post') };
  }

  const postId = newPostResult.id;

  // 2. Insert Tags (if any) - NO TRANSACTION
  if (tagsData.length > 0) {
    const tagsToInsert = tagsData.map(tag => ({
      postId: postId,
      productId: tag.productId,
      xPosition: tag.xPosition,
      yPosition: tag.yPosition,
    }));
    // TODO: Use generated types for insert data when available
    const { error: tagsInsertError } = await supabase
      .from('Tag')
      .insert(tagsToInsert);

    if (tagsInsertError) {
      console.error('Error creating tags (repository):', tagsInsertError);
      // WARNING: Post was created, but tags failed. Data inconsistency.
      // Returning error, but post exists.
      return { post: null, error: new Error(tagsInsertError.message) };
    }
  }

  // 3. Fetch the complete post data to return
  // Define the select statement again (could be refactored)
  const selectStatement = `
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
    tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, description, brand:Brand ( id, name ) ) )
  `; // Added description to product select

  const { data: completePostData, error: fetchCompleteError } = await supabase
    .from('Post')
    .select(selectStatement)
    .eq('id', postId)
    .single();

  if (fetchCompleteError || !completePostData) {
    console.error('Error fetching complete created post (repository):', fetchCompleteError);
    // Fallback or error? Returning error for now.
    return { post: null, error: new Error(fetchCompleteError?.message || 'Failed to fetch created post') };
  }

  // Use manual type assertion for now
  const typedCompleteData = completePostData as PostWithRelationsManual;

  // Map to PostType (creator cannot have liked/saved their own post yet)
  const finalPost = mapSupabaseRowToPostType(typedCompleteData, null); // Pass null as authUserId

  return { post: finalPost, error: null };
};
