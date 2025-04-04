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
        // data↓
        //   {
        //     "posts": [
        //         {
        //             "id": "post-3",
        //             "title": "今日のフルメイク",
        //             "description": "フルメイク！今日の主役はリップモンスター💄✨",
        //             "imageUrl": "/face_3.jpg",
        //             "userId": "seed-user-id",
        //             "createdAt": "2025-04-02T08:43:04.716",
        //             "updatedAt": "2025-04-02T08:43:04.716",
        //             "_count": {
        //                 "likes": 0,
        //                 "comments": 0
        //             },
        //             "user": {
        //                 "id": "seed-user-id",
        //                 "name": "Seed User",
        //                 "image": "/placeholder-user.jpg",
        //                 "username": "seeduser"
        //             },
        //             "tags": [
        //                 {
        //                     "id": "tag-3-2",
        //                     "postId": "post-3",
        //                     "createdAt": "2025-04-02T08:43:04.944",
        //                     "productId": "product-2",
        //                     "updatedAt": "2025-04-02T08:43:04.944",
        //                     "xPosition": 50,
        //                     "yPosition": 50,
        //                     "product": {
        //                         "id": "product-2",
        //                         "name": "ラッシュエキスパート（ウォータープルーフ）",
        //                         "price": 1650,
        //                         "brandId": "cm8zofhvq0009go05uh35roqi",
        //                         "imageUrl": "/ラッシュエキスパート.jpg",
        //                         "createdAt": "2025-04-02T08:40:19.193",
        //                         "updatedAt": "2025-04-02T08:40:19.193",
        //                         "categoryId": "cm8zofhqw0006go054g4hkwl7",
        //                         "description": "繊維入りマスカラ",
        //                         "brand": {
        //                             "id": "cm8zofhvq0009go05uh35roqi",
        //                             "name": "KATE",
        //                             "logoUrl": null,
        //                             "createdAt": "2025-04-02T08:40:18.759",
        //                             "updatedAt": "2025-04-02T08:40:18.759"
        //                         },
        //                         "category": {
        //                             "id": "cm8zofhqw0006go054g4hkwl7",
        //                             "name": "アイメイク",
        //                             "createdAt": "2025-04-02T08:40:18.381",
        //                             "updatedAt": "2025-04-02T08:40:18.381"
        //                         }
        //                     }
        //                 },
        //                 {
        //                     "id": "tag-3-3",
        //                     "postId": "post-3",
        //                     "createdAt": "2025-04-02T08:43:04.945",
        //                     "productId": "product-3",
        //                     "updatedAt": "2025-04-02T08:43:04.945",
        //                     "xPosition": 80,
        //                     "yPosition": 70,
        //                     "product": {
        //                         "id": "product-3",
        //                         "name": "リップモンスター",
        //                         "price": 1650,
        //                         "brandId": "cm8zofhvq000bgo051j8x7lyp",
        //                         "imageUrl": "/リップモンスター.jpg",
        //                         "createdAt": "2025-04-02T08:40:19.193",
        //                         "updatedAt": "2025-04-02T08:40:19.193",
        //                         "categoryId": "cm8zofhql0005go05ctrr01m5",
        //                         "description": "落ちにくいティントリップ",
        //                         "brand": {
        //                             "id": "cm8zofhvq000bgo051j8x7lyp",
        //                             "name": "OPERA",
        //                             "logoUrl": null,
        //                             "createdAt": "2025-04-02T08:40:18.759",
        //                             "updatedAt": "2025-04-02T08:40:18.759"
        //                         },
        //                         "category": {
        //                             "id": "cm8zofhql0005go05ctrr01m5",
        //                             "name": "リップ",
        //                             "createdAt": "2025-04-02T08:40:18.381",
        //                             "updatedAt": "2025-04-02T08:40:18.381"
        //                         }
        //                     }
        //                 },
        //                 {
        //                     "id": "tag-3-1",
        //                     "postId": "post-3",
        //                     "createdAt": "2025-04-02T08:43:04.945",
        //                     "productId": "product-1",
        //                     "updatedAt": "2025-04-02T08:43:04.945",
        //                     "xPosition": 20,
        //                     "yPosition": 30,
        //                     "product": {
        //                         "id": "product-1",
        //                         "name": "マキアージュ ドラマティックスキンセンサーベース UV",
        //                         "price": 3300,
        //                         "brandId": "cm8zofhvq000ago0530x9k0ab",
        //                         "imageUrl": "/マキアージュuv.jpg",
        //                         "createdAt": "2025-04-02T08:40:19.193",
        //                         "updatedAt": "2025-04-02T08:40:19.193",
        //                         "categoryId": "cm8zofhq60002go05yjmsyiv8",
        //                         "description": "肌悩みに合わせて色や質感が変化するベース",
        //                         "brand": {
        //                             "id": "cm8zofhvq000ago0530x9k0ab",
        //                             "name": "SHISEIDO",
        //                             "logoUrl": null,
        //                             "createdAt": "2025-04-02T08:40:18.759",
        //                             "updatedAt": "2025-04-02T08:40:18.759"
        //                         },
        //                         "category": {
        //                             "id": "cm8zofhq60002go05yjmsyiv8",
        //                             "name": "ベースメイク",
        //                             "createdAt": "2025-04-02T08:40:18.381",
        //                             "updatedAt": "2025-04-02T08:40:18.381"
        //                         }
        //                     }
        //                 }
        //             ]
        //         },
        //         {
        //             "id": "post-2",
        //             "title": "リップモンスターレビュー",
        //             "description": "OPERAのリップモンスター、本当に落ちにくい！💋 色持ち最高です👍",
        //             "imageUrl": "/face_2.jpg",
        //             "userId": "seed-user-id",
        //             "createdAt": "2025-04-02T08:43:04.716",
        //             "updatedAt": "2025-04-02T08:43:04.716",
        //             "_count": {
        //                 "likes": 0,
        //                 "comments": 0
        //             },
        //             "user": {
        //                 "id": "seed-user-id",
        //                 "name": "Seed User",
        //                 "image": "/placeholder-user.jpg",
        //                 "username": "seeduser"
        //             },
        //             "tags": [
        //                 {
        //                     "id": "tag-2-1",
        //                     "postId": "post-2",
        //                     "createdAt": "2025-04-02T08:43:04.944",
        //                     "productId": "product-3",
        //                     "updatedAt": "2025-04-02T08:43:04.944",
        //                     "xPosition": 50,
        //                     "yPosition": 50,
        //                     "product": {
        //                         "id": "product-3",
        //                         "name": "リップモンスター",
        //                         "price": 1650,
        //                         "brandId": "cm8zofhvq000bgo051j8x7lyp",
        //                         "imageUrl": "/リップモンスター.jpg",
        //                         "createdAt": "2025-04-02T08:40:19.193",
        //                         "updatedAt": "2025-04-02T08:40:19.193",
        //                         "categoryId": "cm8zofhql0005go05ctrr01m5",
        //                         "description": "落ちにくいティントリップ",
        //                         "brand": {
        //                             "id": "cm8zofhvq000bgo051j8x7lyp",
        //                             "name": "OPERA",
        //                             "logoUrl": null,
        //                             "createdAt": "2025-04-02T08:40:18.759",
        //                             "updatedAt": "2025-04-02T08:40:18.759"
        //                         },
        //                         "category": {
        //                             "id": "cm8zofhql0005go05ctrr01m5",
        //                             "name": "リップ",
        //                             "createdAt": "2025-04-02T08:40:18.381",
        //                             "updatedAt": "2025-04-02T08:40:18.381"
        //                         }
        //                     }
        //                 }
        //             ]
        //         },
        //         {
        //             "id": "post-1",
        //             "title": "今日のメイク",
        //             "description": "今日のメイク💄 マキアージュの下地とKATEのマスカラを使ってみました✨",
        //             "imageUrl": "/face_1.jpg",
        //             "userId": "seed-user-id",
        //             "createdAt": "2025-04-02T08:43:04.716",
        //             "updatedAt": "2025-04-02T08:43:04.716",
        //             "_count": {
        //                 "likes": 0,
        //                 "comments": 0
        //             },
        //             "user": {
        //                 "id": "seed-user-id",
        //                 "name": "Seed User",
        //                 "image": "/placeholder-user.jpg",
        //                 "username": "seeduser"
        //             },
        //             "tags": [
        //                 {
        //                     "id": "tag-1-1",
        //                     "postId": "post-1",
        //                     "createdAt": "2025-04-02T08:43:04.943",
        //                     "productId": "product-1",
        //                     "updatedAt": "2025-04-02T08:43:04.943",
        //                     "xPosition": 30,
        //                     "yPosition": 40,
        //                     "product": {
        //                         "id": "product-1",
        //                         "name": "マキアージュ ドラマティックスキンセンサーベース UV",
        //                         "price": 3300,
        //                         "brandId": "cm8zofhvq000ago0530x9k0ab",
        //                         "imageUrl": "/マキアージュuv.jpg",
        //                         "createdAt": "2025-04-02T08:40:19.193",
        //                         "updatedAt": "2025-04-02T08:40:19.193",
        //                         "categoryId": "cm8zofhq60002go05yjmsyiv8",
        //                         "description": "肌悩みに合わせて色や質感が変化するベース",
        //                         "brand": {
        //                             "id": "cm8zofhvq000ago0530x9k0ab",
        //                             "name": "SHISEIDO",
        //                             "logoUrl": null,
        //                             "createdAt": "2025-04-02T08:40:18.759",
        //                             "updatedAt": "2025-04-02T08:40:18.759"
        //                         },
        //                         "category": {
        //                             "id": "cm8zofhq60002go05yjmsyiv8",
        //                             "name": "ベースメイク",
        //                             "createdAt": "2025-04-02T08:40:18.381",
        //                             "updatedAt": "2025-04-02T08:40:18.381"
        //                         }
        //                     }
        //                 },
        //                 {
        //                     "id": "tag-1-2",
        //                     "postId": "post-1",
        //                     "createdAt": "2025-04-02T08:43:04.943",
        //                     "productId": "product-2",
        //                     "updatedAt": "2025-04-02T08:43:04.943",
        //                     "xPosition": 70,
        //                     "yPosition": 60,
        //                     "product": {
        //                         "id": "product-2",
        //                         "name": "ラッシュエキスパート（ウォータープルーフ）",
        //                         "price": 1650,
        //                         "brandId": "cm8zofhvq0009go05uh35roqi",
        //                         "imageUrl": "/ラッシュエキスパート.jpg",
        //                         "createdAt": "2025-04-02T08:40:19.193",
        //                         "updatedAt": "2025-04-02T08:40:19.193",
        //                         "categoryId": "cm8zofhqw0006go054g4hkwl7",
        //                         "description": "繊維入りマスカラ",
        //                         "brand": {
        //                             "id": "cm8zofhvq0009go05uh35roqi",
        //                             "name": "KATE",
        //                             "logoUrl": null,
        //                             "createdAt": "2025-04-02T08:40:18.759",
        //                             "updatedAt": "2025-04-02T08:40:18.759"
        //                         },
        //                         "category": {
        //                             "id": "cm8zofhqw0006go054g4hkwl7",
        //                             "name": "アイメイク",
        //                             "createdAt": "2025-04-02T08:40:18.381",
        //                             "updatedAt": "2025-04-02T08:40:18.381"
        //                         }
        //                     }
        //                 }
        //             ]
        //         }
        //     ],
        //     "pagination": {
        //         "total": 3,
        //         "page": 1,
        //         "limit": 3,
        //         "pages": 1
        //     }
        // }
        // console.log('API Response:', { data: data?.data, error }); // Keep original comment
        // data-> undefined // Keep original comment
        // Access posts via data.posts based on the actual API response structure
        if (!error && data && data.posts) { // Check data.posts
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
            {/* Filter out posts without an id and pass postId */}
            {trendingPosts.filter(post => post?.id).map((post) => (
              <MakeupPost
                key={post.id}
                // Use post.user based on updated Post type
                username={post.user?.username ?? 'unknown_user'}
                // Use post.imageUrl based on updated Post type
                imageUrl={post.imageUrl}
                // Use post.title based on updated Post type
                title={post.title ?? 'Untitled Post'}
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
