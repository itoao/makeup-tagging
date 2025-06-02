import supabase from '@/lib/supabase';
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'; // Use import type
import type { Database } from '@/src/types/supabase'; // Attempt to import, may fail if file is empty/invalid
import type { Post as PostType, ProductTag, Comment } from '@/src/types/post'; // Import Comment type
import type { UserProfile } from '@/src/types/user';
import type { Product, Brand } from '@/src/types/product';
import { mockPosts } from '@/lib/mock-data';

// Define types using generated Database types
type PostRow = Database['public']['Tables']['Post']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];
type LikeRow = Database['public']['Tables']['Like']['Row'];
type SaveRow = Database['public']['Tables']['Save']['Row'];
type TagRow = Database['public']['Tables']['Tag']['Row'];
type ProductRow = Database['public']['Tables']['Product']['Row'];
type BrandRow = Database['public']['Tables']['Brand']['Row'];
type CommentRow = Database['public']['Tables']['Comment']['Row']; // Add CommentRow type

// Type for the complex select query result using generated types
// Type for the complex select query result using generated types
// Adjust based on the actual select statement structure and Supabase behavior
// NOTE: Supabase client with select<string, T> might not perfectly infer nested relations
// when using raw select strings. We define the expected structure based on the query.
// Type for the complex select query result including comments and their users
type PostWithRelations = PostRow & {
  user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null;
  likes: Pick<LikeRow, 'userId'>[];
  saves: Pick<SaveRow, 'userId'>[];
  tags: (Pick<TagRow, 'id' | 'postId' | 'productId' | 'created_at' | 'xPosition' | 'yPosition'> & {
    product: (Pick<ProductRow, 'id' | 'name' | 'imageUrl' | 'description'> & {
      brand: Pick<BrandRow, 'id' | 'name'> | null;
    }) | null;
  })[];
  // Add comments with their user data
  comments: (CommentRow & {
    user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null;
  })[];
};


// Helper function to map Supabase CommentRow with User to our Comment type
// Similar to the one in CommentRepository, defined here to avoid cross-repo dependency
const mapSupabaseCommentToCommentType = (c: PostWithRelations['comments'][number]): Comment => {
  return {
    id: c.id,
    content: c.content,
    userId: c.userId,
    postId: c.postId,
    createdAt: c.created_at,
    user: c.user ? {
      id: c.user.id,
      username: c.user.username,
      name: c.user.name,
      image: c.user.image,
    } : null,
  };
};

// Helper function to map Supabase PostWithRelations row to our PostType
const mapSupabaseRowToPostType = (p: PostWithRelations, currentAuthUserId: string | null): PostType => {
  const likesCount = p.likes?.length ?? 0;
  const savesCount = p.saves?.length ?? 0;
  // Use generated types in callbacks
  const isLiked = currentAuthUserId ? p.likes.some((like) => like.userId === currentAuthUserId) : false;
  const isSaved = currentAuthUserId ? p.saves.some((save) => save.userId === currentAuthUserId) : false;

  // Map tags using generated types
  const tags: ProductTag[] = p.tags?.map((t): ProductTag => ({
      id: t.id,
      postId: t.postId, // Assuming postId exists on the picked TagRow fields
      productId: t.productId, // Assuming productId exists on the picked TagRow fields
      createdAt: t.created_at, // Correctly map snake_case to camelCase
      xPosition: t.xPosition,
      yPosition: t.yPosition,
      // Map product and brand directly using selected fields
      product: t.product ? {
          id: t.product.id,
          name: t.product.name,
          imageUrl: t.product.imageUrl ?? null,
          brand: t.product.brand ? { // brand is Pick<BrandRow, 'id' | 'name'> | null
            id: t.product.brand.id,
            name: t.product.brand.name
          } : null,
          description: t.product.description, // Map description
          category: null, // Category not selected in the query
          // price: t.product.price, // Map if needed and selected
      } : null,
  })) || [];

  // Construct PostType using fields from PostWithRelations 'p'
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl ?? null, // Revert to nullish coalescing
    userId: p.userId, // userId from PostRow should be correct
    createdAt: p.created_at,
    updatedAt: p.updated_at ?? null, // Correct property name and use nullish coalescing
    _count: {
      likes: likesCount,
      comments: p.comments?.length ?? 0, // Calculate comment count from fetched data
      saves: savesCount,
    },
     // Map user directly using selected fields
     user: p.user ? { // p.user is Pick<UserRow, ...> | null
       id: p.user.id,
       username: p.user.username,
       name: p.user.name,
       image: p.user.image,
     } : null,
     tags: tags,
     // Map fetched comments using the helper function
     comments: p.comments?.map(mapSupabaseCommentToCommentType) || [],
    isLiked: isLiked,
    isSaved: isSaved,
  } as PostType; // Explicitly cast the returned object to PostType
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

  try {

  // Define the select statement matching PostWithRelations structure
  // Note: Supabase client might infer types better if select isn't a raw string,
  // but using string for clarity based on previous code. Ensure it matches the type.
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
    tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, description, brand:Brand ( id, name ) ) ),
    comments:Comment ( *, user:User ( id, username, name, image ) )
  `;

  // Use type parameter with the query for better type safety from Supabase client
  let query = supabase
    .from('Post')
    // Specify the expected return type based on the select statement
    // Using '<string, PostWithRelations>' helps Supabase client infer types
    .select<string, PostWithRelations>(selectStatement, { count: 'exact' })
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

  // Data should now be typed as PostWithRelations[] | null by the Supabase client
  // No need for manual type assertion 'as PostWithRelationsManual[]'

  const posts: PostType[] = data?.map(p => mapSupabaseRowToPostType(p, currentAuthUserId)) || [];
  const totalCount = count ?? 0;

  return { posts, total: totalCount, error: null };
  } catch (err) {
    console.warn('Supabase unavailable, using mock data:', err);
    
    // Filter mock data based on options
    let filteredPosts = [...mockPosts];
    
    if (userIdParam) {
      filteredPosts = filteredPosts.filter(p => p.user_id === userIdParam);
    }
    
    // Apply pagination
    const paginatedPosts = filteredPosts.slice(from, to + 1);
    
    // Map to PostType
    const posts: PostType[] = paginatedPosts.map(p => ({
      id: p.id,
      title: p.content.slice(0, 50), // Use first part of content as title
      description: p.content,
      imageUrl: p.image_url,
      userId: p.user_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      likesCount: p.likes.length,
      commentsCount: 0,
      savesCount: p.saves.length,
      counts: {
        likes: p.likes.length,
        comments: 0,
        saves: p.saves.length,
      },
      user: p.users,
      tags: p.tags.map(t => ({
        id: t.id,
        postId: p.id,
        product: t.products ? {
          id: t.products.id,
          name: t.products.name,
          description: t.products.description || null,
          imageUrl: t.products.image_url,
          brand: t.products.brand,
        } : null,
        xPosition: t.x,
        yPosition: t.y,
        createdAt: '2024-01-01T00:00:00Z',
      })),
      comments: [],
      isLiked: p.isLiked || false,
      isSaved: p.isSaved || false,
    }));
    
    return { posts, total: filteredPosts.length, error: null };
  }
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
  // Let TypeScript infer the type for insertData based on the object literal
  const insertData = {
    title: postData.title,
    description: postData.description,
    imageUrl: postData.imageUrl,
    userId: userId,
  };
  const { data: newPostResult, error: postInsertError } = await supabase
    .from('Post')
    .insert(insertData) // Use the insertData object
    .select('id') // Select only the ID initially
    .single();

  if (postInsertError || !newPostResult) {
    console.error('Error creating post (repository):', postInsertError);
    return { post: null, error: new Error(postInsertError?.message || 'Failed to insert post') };
  }

  const postId = newPostResult.id;

  // 2. Insert Tags (if any) - NO TRANSACTION
  if (tagsData.length > 0) {
    // Add type annotation for 'tag' parameter
    const tagsToInsert = tagsData.map((tag: { productId: string; xPosition: number; yPosition: number }) => ({
      postId: postId,
      productId: tag.productId,
      xPosition: tag.xPosition,
      yPosition: tag.yPosition,
    }));
    // Use generated types for insert data
    const { error: tagsInsertError } = await supabase
      .from('Tag')
      .insert(tagsToInsert as Database['public']['Tables']['Tag']['Insert'][]); // Assert type

    if (tagsInsertError) {
      console.error('Error creating tags (repository):', tagsInsertError);
      // WARNING: Post was created, but tags failed. Data inconsistency.
      // Returning error, but post exists.
      return { post: null, error: new Error(tagsInsertError.message) };
    }
  }

  // 3. Fetch the complete post data to return
  // Define the select statement matching PostWithRelations structure again
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
    tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, description, brand:Brand ( id, name ) ) ),
    comments:Comment ( *, user:User ( id, username, name, image ) )
  `;

  // Use type parameter with the query
  const { data: completePostData, error: fetchCompleteError } = await supabase
    .from('Post')
    .select<string, PostWithRelations>(selectStatement) // Specify return type
    .eq('id', postId)
    .single();

  if (fetchCompleteError || !completePostData) {
    console.error('Error fetching complete created post (repository):', fetchCompleteError);
    // Fallback or error? Returning error for now.
    return { post: null, error: new Error(fetchCompleteError?.message || 'Failed to fetch created post') };
  }

  // Data should be typed as PostWithRelations | null by Supabase client
  // No need for manual type assertion 'as PostWithRelationsManual'

  // Map to PostType (creator cannot have liked/saved their own post yet)
  // Pass completePostData directly as it's already typed PostWithRelations | null
  const finalPost = mapSupabaseRowToPostType(completePostData, null); // Pass null as authUserId

  return { post: finalPost, error: null };
};
