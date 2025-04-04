"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { userApi, postApi } from "@/lib/api";
import { MakeupPost } from "@/components/makeup-post";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
// Define a type for the expected API response for user profile
import { UserProfile, Post } from "@/src/types/product";
import Link from "next/link";
import { useFollowUser } from "@/hooks/use-interactions"; // Import the hook

// Define the expected shape of the data returned by userApi.getProfile
interface UserProfileApiResponse extends UserProfile {
  isFollowing: boolean;
  isCurrentUser: boolean;
  // _count should be part of UserProfile now
}


export default function UserProfilePage() {
  const { id: userId } = useParams() as { id: string };
  const { user: currentUser } = useUser();
  // State for the core profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Separate state for isFollowing, managed by API response and local updates
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  // Remove local isFollowing state, rely on fetched data

  useEffect(() => {
    const fetchProfile = async () => {
      // Ensure userId is defined before fetching
      if (!userId) { 
        setLoading(false); // Stop loading if userId is not yet available
        return;
      }
      
      try {
        setLoading(true);
        // Fetch profile using userId, expect UserProfileApiResponse
        const response = await userApi.getProfile(userId);
        const data = response.data as UserProfileApiResponse | null; // Cast response data

        if (response.error || !data) {
          setError(response.error || "ユーザーデータの取得に失敗しました");
          return
        } else {
          setProfile(data); // Set the core profile data
          setIsFollowing(data.isFollowing); // Set following status from API response
        }
      } catch (err: any) {
        setError(err.message || "プロフィールの読み込み中にエラーが発生しました");
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId]);

  useEffect(() => {
    const fetchPosts = async () => {
      // Fetch posts only if userId is available (profile might still be loading)
      console.log('a')
      if (!userId) return;

      try {
        setPostsLoading(true);
        // Fetch posts using userId directly
        const { data, error } = await postApi.getPosts({ userId: userId });

        if (error) {
          console.error("Error fetching posts:", error);
          return
        }

        // Log the fetched data
        console.log("Fetched posts data:", data);

        // Access posts via data.posts based on PostsApiResponse type
        if (data && data.posts) {
          console.log(`Setting ${data.posts.length} posts to state.`);
          setPosts(data.posts);
        } else {
          console.log("No posts found in data or data is null.");
          setPosts([]); // Ensure posts state is an empty array if no posts found
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setPostsLoading(false)
      }
    }

    fetchPosts()
    // Depend on userId instead of profile to fetch posts when userId changes
  }, [userId]) 

  const { mutate: followUser } = useFollowUser();

  const handleFollowClick = () => {
    if (!userId) return; // Ensure userId is available
    // Pass the current following state to the mutation
    followUser({ userId, isFollowing });
    // Optimistic update for isFollowing state is handled within the hook's onMutate
    // We also update the local isFollowing state for immediate UI feedback
    // The hook will handle cache updates for the profile data (_count.followers)
    setIsFollowing(!isFollowing);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">ユーザーが見つかりません</h2>
        <p className="text-muted-foreground mb-6">{error || "指定されたユーザーは存在しないか、削除された可能性があります。"}</p>
        <Button asChild>
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    );
  }

  // Calculate isCurrentUser locally based on Clerk's currentUser and fetched profile id
  const isCurrentUser = currentUser?.id === profile?.id; // Use profile.id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
        <Avatar className="h-24 w-24">
          {/* Use profile.image based on UserProfile type */}
          <AvatarImage src={profile.image || "/placeholder-user.jpg"} alt={profile.username} />
          <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
            
            {!isCurrentUser ? (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowClick} // Use the new handler
                // Disable button while mutation is pending? (Optional)
                // disabled={followMutation.isLoading}
              >
                {isFollowing ? "フォロー中" : "フォローする"}
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/profile/edit">プロフィールを編集</Link>
              </Button>
            )}
          </div>

          {/* bio is optional, display if present */}
          {/* <p className="text-muted-foreground mb-4">{profile.bio || "自己紹介はまだありません"}</p> */}

          {/* Display stats using _count from profile */}
          <div className="flex gap-6">
            <div className="text-center">
              {/* Posts count might need separate fetching */}
              <div className="font-medium">{profile._count?.posts ?? posts.length}</div>
              <div className="text-sm text-muted-foreground">投稿</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{profile._count?.followers ?? 0}</div>
              <div className="text-sm text-muted-foreground">フォロワー</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{profile._count?.following ?? 0}</div>
              <div className="text-sm text-muted-foreground">フォロー中</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="posts">投稿</TabsTrigger>
          <TabsTrigger value="saved">保存済み</TabsTrigger>
          <TabsTrigger value="liked">いいね</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-6">
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                // Pass the full post object to MakeupPost
                <MakeupPost key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">投稿がありません</h3>
              {isCurrentUser ? (
                <>
                  <p className="text-muted-foreground mb-6">あなたの最初のメイク投稿を共有しましょう！</p>
                  <Button asChild>
                    <Link href="/create">投稿を作成</Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">このユーザーはまだ投稿していません</p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">保存済みの投稿</h3>
            <p className="text-muted-foreground">
              {isCurrentUser 
                ? "保存した投稿はここに表示されます" 
                : "他のユーザーの保存済み投稿は表示できません"}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="liked" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">いいねした投稿</h3>
            <p className="text-muted-foreground">
              {isCurrentUser 
                ? "いいねした投稿はここに表示されます" 
                : "他のユーザーのいいね投稿は表示できません"}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
