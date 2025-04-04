"use client"

import { useState, useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { postApi } from "@/lib/api"
import { MakeupPost } from "@/components/makeup-post"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Post } from "@/src/types/product" // Import Post type
import Link from "next/link"

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]) // Use Post[] type
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("latest")
  const { ref, inView } = useInView()

  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 1 : page
      // Use a more specific type for params
      const params: Record<string, string | number | boolean> = { page: currentPage, limit: 9 }

      // Add filter based on active tab
      if (activeTab === 'following') {
        // Only fetch posts from users the current user follows
        params.following = true
      } else if (activeTab === 'popular') {
        // Sort by popularity (likes count)
        params.sort = 'popular'
      }
      
      // Add search term if present
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const { data, error } = await postApi.getPosts(params)
      
      if (error) {
        setError(error)
        return
      }

      // Access posts via data.posts and pagination via data.pagination
      if (data && data.posts) { // Check data.posts
        const newPosts = reset ? data.posts : [...posts, ...data.posts]; // Use data.posts
        setPosts(newPosts);
        // Use hasNextPage from pagination object
        setHasMore(data.pagination.hasNextPage);
        if (!reset) {
          setPage(currentPage + 1);
        }
      }
    } catch (err) {
      setError("投稿の読み込み中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts(true)
  }, [activeTab])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchPosts()
    }
  }, [inView, hasMore])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Explore Makeup Looks</h1>
        
        <form onSubmit={handleSearch} className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              className="pl-9 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
      </div>

      <Tabs defaultValue="latest" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchPosts(true)}>
            再試行
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link href={`/post/${post.id}`} key={post.id}>
            <MakeupPost
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
          </Link>
        ))}

        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="space-y-3">
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-6">Be the first to share your makeup look!</p>
          <Button>Create a Post</Button>
        </div>
      )}

      {hasMore && <div ref={ref} className="h-10" />}
    </div>
  )
}
