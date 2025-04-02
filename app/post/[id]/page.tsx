"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { postApi, commentApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageCircle, Share2, Bookmark, Tag, MoreHorizontal } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export default function PostDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [activeTag, setActiveTag] = useState<number | null>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const { data, error } = await postApi.getPost(id)
        
        if (error) {
          toast.error("投稿の読み込みに失敗しました")
          return
        }
        
        if (data) {
          setPost(data)
          setComments(data.comments)
        }
      } catch (err) {
        toast.error("投稿の読み込み中にエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const handleLike = async () => {
    if (!isSignedIn) {
      toast.error("いいねするにはログインが必要です")
      return
    }

    try {
      if (post.isLiked) {
        await postApi.unlikePost(id)
      } else {
        await postApi.likePost(id)
      }
      
      // Update post state
      setPost({
        ...post,
        isLiked: !post.isLiked,
        _count: {
          ...post._count,
          likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1
        }
      })
    } catch (err) {
      toast.error("操作に失敗しました")
    }
  }

  const handleSave = async () => {
    if (!isSignedIn) {
      toast.error("保存するにはログインが必要です")
      return
    }

    toast.info("この機能は現在開発中です")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch(() => {
        // Fallback if share fails
        navigator.clipboard.writeText(window.location.href)
        toast.success("リンクをコピーしました")
      })
    } else {
      // Fallback for browsers that don't support share API
      navigator.clipboard.writeText(window.location.href)
      toast.success("リンクをコピーしました")
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isSignedIn) {
      toast.error("コメントするにはログインが必要です")
      return
    }
    
    if (!commentText.trim()) {
      toast.error("コメントを入力してください")
      return
    }
    
    try {
      setSubmitting(true)
      const { data, error } = await postApi.addComment(id, commentText)
      
      if (error) {
        toast.error("コメントの投稿に失敗しました")
        return
      }
      
      setComments([data, ...comments])
      setCommentText("")
      
      // Update comment count
      setPost({
        ...post,
        _count: {
          ...post._count,
          comments: post._count.comments + 1
        }
      })
      
      toast.success("コメントを投稿しました")
    } catch (err) {
      toast.error("コメントの投稿中にエラーが発生しました")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await commentApi.deleteComment(commentId)
      
      if (error) {
        toast.error("コメントの削除に失敗しました")
        return
      }
      
      // Remove comment from state
      setComments(comments.filter(comment => comment.id !== commentId))
      
      // Update comment count
      setPost({
        ...post,
        _count: {
          ...post._count,
          comments: post._count.comments - 1
        }
      })
      
      toast.success("コメントを削除しました")
    } catch (err) {
      toast.error("コメントの削除中にエラーが発生しました")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ja })
    } catch (e) {
      return "日付不明"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-[3/4] rounded-lg" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">投稿が見つかりません</h2>
        <p className="text-muted-foreground mb-6">指定された投稿は存在しないか、削除された可能性があります。</p>
        <Button asChild>
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="sticky top-8">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
              <Image 
                src={post.imageUrl || "/placeholder.svg"} 
                alt={post.title} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {post.tags.map((tag: any) => (
                <div
                  key={tag.id}
                  className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center cursor-pointer ${
                    activeTag === tag.id ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                  } border-2 border-background shadow-sm`}
                  style={{ left: `${tag.xPosition}%`, top: `${tag.yPosition}%` }}
                  onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
                >
                  <Tag className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/user/${post.user.username}`}>
              <Avatar>
                <AvatarImage src={post.user.image || "/placeholder-user.jpg"} alt={post.user.username} />
                <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/user/${post.user.username}`} className="font-medium hover:underline">
                {post.user.name || post.user.username}
              </Link>
              <div className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</div>
            </div>
            {post.isOwner && (
              <Button variant="ghost" size="icon" className="ml-auto" asChild>
                <Link href={`/post/${id}/edit`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-3">{post.title}</h1>
          <p className="text-muted-foreground mb-6">{post.description}</p>

          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant={post.isLiked ? "default" : "outline"} 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span>{post._count.likes}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => commentInputRef.current?.focus()}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post._count.comments}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span>シェア</span>
            </Button>
            <Button 
              variant={post.isSaved ? "default" : "outline"} 
              size="sm" 
              className="flex items-center gap-1 ml-auto"
              onClick={handleSave}
            >
              <Bookmark className={`h-4 w-4 ${post.isSaved ? "fill-current" : ""}`} />
              <span>保存</span>
            </Button>
          </div>

          {activeTag !== null && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">タグ情報</h2>
              {post.tags.map((tag: any) => {
                if (tag.id === activeTag) {
                  return (
                    <Card key={tag.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 relative rounded overflow-hidden">
                            <Image
                              src={tag.product.imageUrl || "/placeholder.svg"}
                              alt={tag.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-1">
                              {tag.product.category.name}
                            </Badge>
                            <h3 className="font-medium">{tag.product.name}</h3>
                            <p className="text-sm text-muted-foreground">{tag.product.brand.name}</p>
                          </div>
                          <div className="text-right">
                            {tag.product.price && (
                              <div className="font-medium">¥{tag.product.price.toLocaleString()}</div>
                            )}
                            <Button size="sm" className="mt-1">
                              詳細
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }
                return null
              })}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">使用製品</h2>
            <div className="space-y-4 mb-8">
              {post.tags.map((tag: any) => (
                <Card key={tag.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTag(tag.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 relative rounded overflow-hidden">
                        <Image
                          src={tag.product.imageUrl || "/placeholder.svg"}
                          alt={tag.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{tag.product.name}</h3>
                        <p className="text-sm text-muted-foreground">{tag.product.brand.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {post.tags.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  タグされた製品はありません
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">コメント</h2>
            
            {isSignedIn && (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <Textarea
                  ref={commentInputRef}
                  placeholder="コメントを追加..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="mb-2"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting || !commentText.trim()}>
                    {submitting ? "送信中..." : "コメントする"}
                  </Button>
                </div>
              </form>
            )}
            
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/user/${comment.user.username}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.image || "/placeholder-user.jpg"} alt={comment.user.username} />
                        <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <Link href={`/user/${comment.user.username}`} className="font-medium hover:underline">
                          {comment.user.name || comment.user.username}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    {post.isOwner || comment.user.id === post.user.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <span className="sr-only">Delete</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  まだコメントはありません。最初のコメントを残しましょう！
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
