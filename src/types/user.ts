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

// Generic PaginatedResponse (assuming it's defined elsewhere or here)
// If PaginatedResponse is not defined globally, define it here or import it
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

export type PaginatedUsers = PaginatedResponse<UserProfile>;
