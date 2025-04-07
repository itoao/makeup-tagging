import supabase from '@/lib/supabase';
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'; // Use import type
import type { Database } from '@/src/types/supabase'; // Attempt to import, may fail if file is empty/invalid
import type { Post as PostType, ProductTag } from '@/src/types/post';
import type { UserProfile } from '@/src/types/user';
import type { Product, Brand } from '@/src/types/product';

// Define types using generated Database types
type PostRow = Database['public']['Tables']['Post']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];
type LikeRow = Database['public']['Tables']['Like']['Row'];
type SaveRow = Database['public']['Tables']['Save']['Row'];
type TagRow = Database['public']['Tables']['Tag']['Row'];
type ProductRow = Database['public']['Tables']['Product']['Row'];
type BrandRow = Database['public']['Tables']['Brand']['Row'];

// Type for the complex select query result using generated types
// Adjust based on the actual select statement structure and Supabase behavior
type PostWithRelations = Omit<PostRow, 'userId'> & { // Omit original userId if user object is present
  userId: string; // Ensure userId is always string (not null if user exists)
  user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null; // Select specific user fields
  likes: Pick<LikeRow, 'userId'>[];
  saves: Pick<SaveRow, 'userId'>[];
  tags: (Pick<TagRow, 'id' | 'postId' | 'productId' | 'created_at' | 'xPosition' | 'yPosition'> & {
    product: (Pick<ProductRow, 'id' | 'name' | 'imageUrl' | 'description'> & { // Select specific product fields
      brand: Pick<BrandRow, 'id' | 'name'> | null; // Select specific brand fields
    }) | null;
  })[];
};


// Helper function to map Supabase row (using generated types) to our PostType
const mapSupabaseRowToPostType = (p: PostWithRelations, currentAuthUserId: string | null): PostType => {
  const likesCount = p.likes?.length ?? 0;
  const savesCount = p.saves?.length ?? 0;
  // Explicitly type callback parameters
  const isLiked = currentAuthUserId ? p.likes.some((like: Pick<LikeRow, 'userId'>) => like.userId === currentAuthUserId) : false;
  const isSaved = currentAuthUserId ? p.saves.some((save: Pick<SaveRow, 'userId'>) => save.userId === currentAuthUserId) : false;

  // Map tags using generated types
  const tags: ProductTag[] = p.tags?.map((t): ProductTag => ({ // t is inferred based on PostWithRelations['tags']
      id: t.id,
      postId: t.postId, // Assuming postId is selected or available on TagRow
      productId: t.productId, // Assuming productId is selected or available on TagRow
      createdAt: t.created_at, // Map from snake_case
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
    id: p.id, // From PostRow
    title: p.title, // From PostRow
    description: p.description, // From PostRow
    imageUrl: p.imageUrl, // From PostRow
    userId: p.userId, // Use the non-null userId from PostWithRelations
    createdAt: p.created_at, // From PostRow
    updatedAt: p.updated_at, // From PostRow
    _count: {
      likes: likesCount,
      comments: 0, // Assuming comment count is fetched elsewhere or not needed here
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
     comments: [], // Default empty array for now
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
    user:User!inner ( id, username, name, image ),
    likes:Like ( userId ),
    saves:Save ( userId ),
    tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, description, brand:Brand ( id, name ) ) )
  `; // Ensure selected fields match PostWithRelations

  // Use type parameter with the query for better type safety from Supabase client
  let query = supabase
    .from('Post')
    // Specify the expected return type based on the select statement
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
  // Use generated types for insert data
  const insertData: Database['public']['Tables']['Post']['Insert'] = {
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
    user:User!inner ( id, username, name, image ),
    likes:Like ( userId ),
    saves:Save ( userId ),
    tags:Tag ( id, postId, productId, created_at, xPosition, yPosition, product:Product ( id, name, imageUrl, description, brand:Brand ( id, name ) ) )
  `; // Ensure selected fields match PostWithRelations

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
