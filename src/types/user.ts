// Type definitions related to Users

export interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  image: string | null; // Matches DB schema 'image' column
  // Optional counts, typically populated by specific queries
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  } | null;
  // Contextual flags, not part of the core profile data
  // isFollowing?: boolean;
  // isCurrentUser?: boolean;
}

// Example for paginated user response if needed
// import type { PaginatedResponse } from './api'; // Assuming api.ts exists for common types
// export type PaginatedUsers = PaginatedResponse<UserProfile>;
