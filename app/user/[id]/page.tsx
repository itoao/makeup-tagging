"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { userApi, postApi } from "@/lib/api"
import { MakeupPost } from "@/components/makeup-post"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@clerk/nextjs"
import { UserProfile, Post } from "@/src/types/product" // Import types
import Link from "next/link"

export default function UserProfilePage() {
  const { username } = useParams() as { username: string }
  const { user: currentUser } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null) // Use UserProfile type
  const [posts, setPosts] = useState<Post[]>([]) // Use Post[] type
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("posts")
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error } = await userApi.getProfile(username)
        
        if (error) {
          setError(error)
          return
        }

        if (data) {
          setProfile(data);
          // isFollowing is managed by local state, not fetched profile data based on current types
          // setIsFollowing(data.isFollowing ?? false); // Remove this line
        }
      } catch (err) {
        setError("プロフィールの読み込み中にエラーが発生しました");
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  useEffect(() => {
    const fetchPosts = async () => {
      if (!profile) return
      
      try {
        setPostsLoading(true)
        const { data, error } = await postApi.getPosts({ userId: profile.id })
        
        if (error) {
          console.error("Error fetching posts:", error)
          return
        }

        // Access posts via data.data
        if (data && data.data) {
          setPosts(data.data)
        }
      } catch (err) {
        console.error("Error fetching posts:", err)
      } finally {
        setPostsLoading(false)
      }
    }

    fetchPosts()
  }, [profile])

  const handleFollow = async () => {
    if (!profile) return
    
    try {
      if (isFollowing) {
        await userApi.unfollowUser(username)
        setIsFollowing(false)
      } else {
        await userApi.followUser(username)
        setIsFollowing(true)
      }

      // Update follower count - _count is removed from UserProfile, so this update is no longer possible here.
      // Consider fetching updated profile data if follower count needs to be displayed accurately after follow/unfollow.
      // setProfile(prev => {
      //   if (!prev) return null;
      //   const currentFollowers = prev._count?.followers ?? 0;
      //   return {
      //     ...prev,
      //     _count: {
      //       ...(prev._count ?? {}), // Ensure _count exists
      //       followers: isFollowing ? Math.max(0, currentFollowers - 1) : currentFollowers + 1,
      //     },
      //   };
      // });
    } catch (err) {
      console.error("Error following/unfollowing user:", err)
    }
  }

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
          {/* Use profile.image based on updated UserProfile type */}
          <AvatarImage src={profile.image || "/placeholder-user.jpg"} alt={profile.username} />
          <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
            
            {!isCurrentUser ? (
              <Button 
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
              >
                {isFollowing ? "フォロー中" : "フォローする"}
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/profile/edit">プロフィールを編集</Link>
              </Button>
            )}
          </div>

          {/* bio is removed from UserProfile type */}
          {/* <p className="text-muted-foreground mb-4">{profile.bio || "自己紹介はまだありません"}</p> */}

          {/* _count is removed from UserProfile type, remove stats display */}
          {/*
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-medium">{profile._count?.posts ?? 0}</div>
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
          */}
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
                <MakeupPost
                  key={post.id}
                  // Use post.user based on updated Post type
                  username={post.user?.username ?? 'unknown'}
                  // Use post.imageUrl based on updated Post type
                  imageUrl={post.imageUrl}
                  // Use post.title based on updated Post type
                  title={post.title ?? 'Untitled'}
                  // Use post._count.likes based on updated Post type
                  likes={post._count?.likes ?? 0}
                  // Use post._count.comments based on updated Post type
                  comments={post._count?.comments ?? 0}
                  productCount={post.tags?.length ?? 0}
                  postId={post.id}
                />
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
