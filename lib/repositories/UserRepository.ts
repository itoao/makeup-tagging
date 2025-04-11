import supabase from '@/lib/supabase';
import type { Database } from '@/src/types/supabase';
import type { UserProfile } from '@/src/types/user';

// Define types using generated Database types
type UserRow = Database['public']['Tables']['User']['Row'];
type FollowRow = Database['public']['Tables']['Follow']['Row'];

// Type for the select query result including follower/following counts
// Supabase doesn't directly return counts on relations like Prisma,
// so we fetch the related IDs and count them in the mapping function.
type UserWithFollows = UserRow & {
  followers: Pick<FollowRow, 'followerId'>[]; // Users following this user
  following: Pick<FollowRow, 'followingId'>[]; // Users this user follows
};

// Helper function to map Supabase row to our UserProfile type
const mapSupabaseRowToUserProfile = (u: UserWithFollows): UserProfile => {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    image: u.image,
    _count: {
      followers: u.followers?.length ?? 0,
      following: u.following?.length ?? 0,
      // posts count requires a separate query or join if needed
    }
  };
};

/**
 * Finds a user profile by their ID or username, including follower/following counts.
 * @param identifier - The user ID or username.
 * @param currentUserId - The ID of the currently authenticated user (optional).
 * @returns The user profile, follow status, or null if not found, and an error object.
 */
export const findUserByIdentifier = async (
  identifier: string,
  currentUserId: string | null // Add currentUserId parameter
): Promise<{ profile: UserProfile | null; isFollowing: boolean; error: Error | null }> => {

  console.log(`[UserRepository] Finding user with identifier: ${identifier}, currentUserId: ${currentUserId}`);

  // Define select statement once
  const selectStatement = `
    id,
    username,
    name,
    image,
    created_at,
    followers:Follow!followingId ( followerId ),
    following:Follow!followerId ( followingId )
  `;

  let data: UserWithFollows | null = null;
  let error: Error | null = null;

  // Try fetching by ID first
  console.log(`[UserRepository] Attempting fetch by ID...`);
  const { data: dataById, error: errorById } = await supabase
    .from('User')
    .select<string, UserWithFollows>(selectStatement)
    .eq('id', identifier)
    .maybeSingle();

  console.log(`[UserRepository] Fetch by ID result - Data: ${JSON.stringify(dataById)}, Error: ${JSON.stringify(errorById)}`);

  if (errorById) {
    console.error(`[UserRepository] Error fetching user by ID:`, errorById);
    // Don't return yet, try fetching by username if ID fetch failed for reasons other than not found
    if (errorById.code !== '22P02') { // 22P02 is invalid input syntax for type uuid
       error = new Error(errorById.message); // Store the error
    }
  } else if (dataById) {
    data = dataById; // Found by ID
  }

  // If not found by ID and no critical error occurred, try fetching by username
  if (!data && !error) {
    console.log(`[UserRepository] Not found by ID, attempting fetch by username...`);
    const { data: dataByUsername, error: errorByUsername } = await supabase
      .from('User')
      .select<string, UserWithFollows>(selectStatement)
      .eq('username', identifier)
      .maybeSingle();

    console.log(`[UserRepository] Fetch by username result - Data: ${JSON.stringify(dataByUsername)}, Error: ${JSON.stringify(errorByUsername)}`);

    if (errorByUsername) {
      console.error(`[UserRepository] Error fetching user by username:`, errorByUsername);
      error = new Error(errorByUsername.message); // Store the error
    } else if (dataByUsername) {
      data = dataByUsername; // Found by username
    }
  }

  // Handle final error state
  if (error) {
    return { profile: null, isFollowing: false, error };
  }

  // If data is still null after trying both, user not found
  if (!data) {
    console.log(`[UserRepository] User not found by ID or username.`);
    return { profile: null, isFollowing: false, error: null }; // User not found
  }

  // Determine follow status using the fetched data and currentUserId
  const isFollowing = currentUserId
    ? data.followers.some(f => f.followerId === currentUserId)
    : false;

  console.log(`[UserRepository] Determined isFollowing: ${isFollowing}`);

  // Map data if found
  const userProfile = mapSupabaseRowToUserProfile(data);

  return { profile: userProfile, isFollowing, error: null };
};

/**
 * Follows a user.
 * @param followerId - The ID of the user initiating the follow.
 * @param followingId - The ID of the user being followed.
 * @returns An error object if the operation failed, otherwise null.
 */
export const followUser = async (
  followerId: string,
  followingId: string
): Promise<{ error: Error | null }> => {
  // Avoid self-following
  if (followerId === followingId) {
    return { error: new Error("自分自身をフォローすることはできません。") };
  }

  // Check if both follower and following users exist in the User table
  const { data: usersData, error: usersCheckError } = await supabase
    .from('User')
    .select('id')
    .in('id', [followerId, followingId]);

  if (usersCheckError) {
    console.error(`Error checking user existence:`, usersCheckError);
    return { error: new Error('ユーザー存在確認中にエラーが発生しました。') };
  }

  // Check if both users were found
  const foundFollower = usersData?.some(user => user.id === followerId);
  const foundFollowing = usersData?.some(user => user.id === followingId);

  if (!foundFollower) {
    console.error(`Follower user with ID ${followerId} not found in User table.`);
    return { error: new Error(`操作元のユーザー (ID: ${followerId}) が見つかりません。`) };
  }
  if (!foundFollowing) {
     console.error(`Following user with ID ${followingId} not found in User table.`);
     // This case should ideally be caught by findUserByIdentifier in the API route,
     // but adding a check here provides extra safety.
     return { error: new Error(`フォロー対象のユーザー (ID: ${followingId}) が見つかりません。`) };
  }

  // Proceed with insertion only if both users exist
  const { error } = await supabase
    .from('Follow')
    .insert({ followerId, followingId }); // Use camelCase matching schema

  if (error) {
    // Handle potential unique constraint violation (already following) gracefully
    if (error.code === '23505') { // Unique violation code
      console.warn(`User ${followerId} already follows ${followingId}.`);
      return { error: null }; // Consider it not an error in this case
    }
    console.error(`Error following user:`, error);
    return { error: new Error(error.message) };
  }

  return { error: null };
};

/**
 * Unfollows a user.
 * @param followerId - The ID of the user initiating the unfollow.
 * @param followingId - The ID of the user being unfollowed.
 * @returns An error object if the operation failed, otherwise null.
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('Follow')
    .delete()
    .eq('followerId', followerId)
    .eq('followingId', followingId);

  if (error) {
    console.error(`Error unfollowing user:`, error);
    return { error: new Error(error.message) };
  }

  return { error: null };
};


// TODO: Add functions for findManyUsers, updateUserProfile etc.
