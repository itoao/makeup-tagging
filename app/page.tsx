"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MakeupPost } from "@/components/makeup-post"
import { FeaturedProducts } from "@/components/featured-products"
import { postApi } from "@/lib/api"
import { Post } from "@/src/types/product" // Import Post type
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]) // Use Post[] type
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setLoading(true)
        const { data, error } = await postApi.getPosts({
          sort: 'popular',
          limit: 3
        })
        console.log('data.post', data?.posts) // Keep existing log
        console.log('API Response:', { data: data, error }); // Keep existing log

        if (!error && data && data.posts) { // Check data.posts
          console.log('setposes', data.posts)
          setTrendingPosts(data.posts) // Use data.posts
        }
      } catch (err) {
        console.error("Error fetching trending posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrendingPosts()
  }, [])
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12 text-center">
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/explore">Explore Looks</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/create">Share Your Makeup</Link>
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trending Looks</h2>
          <Link href="/explore" className="text-primary hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
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
        ) : trendingPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pass the full post object to MakeupPost */}
            {trendingPosts.filter(post => post?.id).map((post) => (
              <MakeupPost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          // データがない場合の表示 (フォールバックを削除し、メッセージを追加)
          <div className="text-center text-muted-foreground py-8">
            <p>現在、トレンドの投稿はありません。</p>
            <p className="mt-2">新しいメイクを投稿してみませんか？</p>
            <Button asChild className="mt-4">
              <Link href="/create">投稿を作成する</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Popular Products</h2>
        <FeaturedProducts />
      </section>

      <section className="bg-muted p-8 rounded-lg">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Share Your Beauty Secrets</h2>
          <p className="text-muted-foreground mb-6">
            Upload your photo, tag the products you use, and inspire others with your unique style
          </p>
          <Button size="lg" asChild>
            <Link href="/create">Create Your First Post</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
