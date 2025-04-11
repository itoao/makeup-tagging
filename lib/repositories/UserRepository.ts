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
 * @returns The user profile or null if not found, and an error object.
 */
export const findUserByIdentifier = async (
  identifier: string
): Promise<{ profile: UserProfile | null; error: Error | null }> => {

  console.log(`[UserRepository] Finding user with identifier: ${identifier}`);

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
    return { profile: null, error };
  }

  // If data is still null after trying both, user not found
  if (!data) {
    console.log(`[UserRepository] User not found by ID or username.`);
    return { profile: null, error: null }; // User not found
  }

  // Map data if found

  const userProfile = mapSupabaseRowToUserProfile(data);

  return { profile: userProfile, error: null };
};

// TODO: Add functions for findManyUsers, updateUserProfile etc.
