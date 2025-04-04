"use client"

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { postApi, commentApi } from "@/lib/api";
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton";
// Import Tag icon with an alias to avoid naming conflict
import { Heart, MessageCircle, Share2, Bookmark, Tag as TagIcon, MoreHorizontal } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
// Import correct types from the types file
import { Post, Comment, ProductTag, Product, UserProfile } from "@/src/types/product";
import { useLikePost, useSavePost } from "@/hooks/use-interactions"; // Import hooks

export default function PostDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { isSignedIn, user: currentUser } = useUser();
  // Use the correct Post type
  const [post, setPost] = useState<Post | null>(null);
  // Use the correct Comment type
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Use a more descriptive type name reflecting the included product
  const [activeTag, setActiveTag] = useState<string | null>(null); // Keep as string (tag.id)
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const productsSectionRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const { data, error } = await postApi.getPost(id)

        if (error) {
          toast.error("投稿の読み込みに失敗しました")
          return;
        }

        if (data) {
          console.log("Fetched post data:", JSON.stringify(data, null, 2)); // Log the actual fetched data structure
          // Cast fetched data to the Post type
          setPost(data as Post);
          // Cast comments to the Comment[] type
          setComments((data.comments as Comment[]) ?? []); // Use nullish coalescing and type assertion
        }
      } catch (err) {
        console.error("Fetch post error:", err);
        toast.error("投稿の読み込み中にエラーが発生しました");
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();

  const handleLikeClick = () => {
    if (!isSignedIn) {
      toast.error("いいねするにはログインが必要です");
      return;
    }
    if (!post) return;
    likePost({ postId: post.id, isLiked: !!post.isLiked });
  };

  const handleSaveClick = () => {
    if (!isSignedIn) {
      toast.error("保存するにはログインが必要です");
      return;
    }
    if (!post) return;
    savePost({ postId: post.id, isSaved: !!post.isSaved });
  };

  const handleShare = () => {
    if (!post) return;
    if (navigator.share) {
      navigator.share({
        title: post.title ?? 'Check out this post!', // Use title
        text: post.description ?? '', // Use description
        url: window.location.href,
      }).catch(() => {
        // Fallback if share fails
        console.warn("Share API failed, falling back to clipboard.");
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
    if (!post) return; // Ensure post is not null

    try {
      setSubmitting(true)
      // Assuming addComment returns the created Comment object
      const { data, error } = await postApi.addComment(id, commentText)

      if (error || !data) {
        console.error("Add comment error:", error); // Log the actual error
        toast.error("コメントの投稿に失敗しました");
        return;
      }

      // Add the new comment (cast to Comment type)
      setComments(prevComments => [data as Comment, ...prevComments]);
      setCommentText("");

      // Update comment count with explicit type for prevPost and safe _count update
      setPost((prevPost: Post | null) => {
        if (!prevPost) return null;
        const currentLikes = prevPost._count?.likes ?? 0;
        const currentComments = prevPost._count?.comments ?? 0;
        const currentSaves = prevPost._count?.saves ?? 0; // Get saves count
        return {
          ...prevPost,
          _count: {
            likes: currentLikes,
            comments: currentComments + 1,
            saves: currentSaves, // Include saves count
          },
        };
      });

      toast.success("コメントを投稿しました");
    } catch (err) {
      console.error("Submit comment error:", err); // Log the actual error
      toast.error("コメントの投稿中にエラーが発生しました")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return; // Ensure post is not null
    try {
      const { error } = await commentApi.deleteComment(commentId)

      if (error) {
        console.error("Delete comment error:", error); // Log the actual error
        toast.error("コメントの削除に失敗しました");
        return;
      }

      // Remove comment from state
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));

      // Update comment count with explicit type for prevPost and safe _count update
      setPost((prevPost: Post | null) => {
        if (!prevPost) return null;
        const currentLikes = prevPost._count?.likes ?? 0;
        const currentComments = prevPost._count?.comments ?? 0;
        const currentSaves = prevPost._count?.saves ?? 0; // Get saves count
        return {
          ...prevPost,
          _count: {
            likes: currentLikes,
            comments: Math.max(0, currentComments - 1),
            saves: currentSaves, // Include saves count
          },
        };
      });

      toast.success("コメントを削除しました");
    } catch (err) {
      console.error("Delete comment error:", err); // Log the actual error
      toast.error("コメントの削除中にエラーが発生しました")
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "日付不明";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ja })
    } catch (e) {
      return "日付不明"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Skeleton remains the same */}
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
    );
  }

  // Determine if the current user is the owner using post.userId
  const isOwner = currentUser?.id === post.userId; // Use post.userId

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="relative">
          <div className="sticky top-8">
          {/* Ensure image container takes full width of its grid column */}
          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border"> {/* Added w-full */}
            <Image
              src={post.imageUrl || "/placeholder.svg"} // Use imageUrl from provided data
              alt={post.title ?? 'Post image'} // Use title for alt text
              fill
              className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              priority // Prioritize loading the main image
            />
            {/* Tags Overlay - Use ProductTag type and display name */}
            {post.tags?.map((tag: ProductTag) => {
              const productName = tag.product?.name ?? '製品';
              // Truncate name to approx 7 chars (adjust length as needed)
              const displayName = productName.length > 7 ? productName.substring(0, 7) + '…' : productName;
              return (
                <Badge
                  key={tag.id}
                  variant={activeTag === tag.id ? "default" : "secondary"} // Use Badge variants
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 shadow-md text-xs h-auto px-2 py-0.5 whitespace-nowrap`} // Adjusted styling for badge
                  style={{ left: `${tag.xPosition}%`, top: `${tag.yPosition}%` }} // Use xPosition, yPosition
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default browser zoom/focus behavior
                    e.stopPropagation();
                    const newActiveTag = activeTag === tag.id ? null : tag.id;
                    setActiveTag(newActiveTag);
                    // Scroll to products section when a tag is activated
                    if (newActiveTag) {
                      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  title={productName} // Full name on hover
                >
                  <TagIcon className="h-3 w-3 mr-1 flex-shrink-0" /> {/* Restore icon and add margin */}
                  {displayName}
                </Badge>
              );
            })}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Author Info - Use post.user */}
          <div className="flex items-center gap-3">
            <Link href={`/user/${post.user?.id ?? '#'}`}>
              <Avatar>
                {/* Use post.user.image */}
                <AvatarImage src={post.user?.image || "/placeholder-user.jpg"} alt={post.user?.username ?? 'U'} />
                <AvatarFallback>{post.user?.username?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href={`/user/${post.user?.id ?? '#'}`} className="font-medium hover:underline">
                {/* Use post.user.name or username */}
                {post.user?.name || post.user?.username}
              </Link>
              <div className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</div> {/* Use post.createdAt */}
            </div>
            {isOwner && (
              <Button variant="ghost" size="icon" className="ml-auto">
                {/* TODO: Implement edit functionality */}
                {/* <Link href={`/post/${id}/edit`}> */}
                  <MoreHorizontal className="h-4 w-4" />
                {/* </Link> */}
              </Button>
            )}
          </div>

          {/* Post Title & Description */}
          <h1 className="text-2xl font-bold">{post.title ?? 'Untitled Post'}</h1>
          {post.description && (
            <p className="text-muted-foreground">{post.description}</p>
          )}

          {/* Action Buttons - Use _count and remove initial isLiked/isSaved dependency */}
          <div className="flex items-center gap-2 md:gap-4"> {/* Adjusted gap */}
            <Button
              // variant depends on local isLiked state after interaction
              variant={post.isLiked ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={handleLikeClick} // Use hook handler
              disabled={!isSignedIn} // Disable if not signed in
            >
              {/* Always show Heart icon, fill based on post.isLiked state */}
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current text-red-500" : ""}`} />
              {/* Use _count.likes */}
              <span>{post._count?.likes ?? 0}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => commentInputRef.current?.focus()}
            >
              <MessageCircle className="h-4 w-4" />
              {/* Use _count.comments */}
              <span>{post._count?.comments ?? 0}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">シェア</span> {/* Hide text on small screens */}
            </Button>
            <Button
              // variant depends on local isSaved state after interaction (if implemented)
              variant={"outline"} // Default to outline as isSaved isn't fetched
              size="sm"
              className="flex items-center gap-1 ml-auto"
              onClick={handleSaveClick} // Use hook handler
              disabled={!isSignedIn} // Disable if not signed in
            >
              {/* Always show Bookmark icon, fill based on post.isSaved state */}
              <Bookmark className={`h-4 w-4 ${post.isSaved ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">保存</span> {/* Hide text on small screens */}
            </Button>
          </div>

          {/* Active Tag Info - Use ProductTag type */}
          {activeTag !== null && (
            <div className="animate-in fade-in duration-300 border rounded-lg">
              {/* Removed h2 title, info shown directly in card */}
              {post.tags?.map((tag: ProductTag) => { // Use ProductTag type
                // Use tag.product
                if (tag.id === activeTag && tag.product) {
                  const product = tag.product; // Use singular product based on type
                  return (
                    <Card key={tag.id} className="border-0 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0 border"> {/* Added border */}
                            <Image
                              // Use product.imageUrl from Product type
                              src={product.imageUrl || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="flex-1 min-w-0"> {/* Allow text to wrap */}
                            {/* Use product.category from Product type */}
                            {product.category && (
                              <Badge variant="outline" className="mb-1">
                                {product.category.name}
                              </Badge>
                            )}
                            <h3 className="font-medium truncate">{product.name}</h3>
                            {/* Use product.brand from Product type */}
                            <p className="text-sm text-muted-foreground truncate">{product.brand?.name ?? 'ブランド未設定'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {product.price && (
                              <div className="font-medium">¥{product.price.toLocaleString()}</div>
                            )}
                            {/* TODO: Link to product details page */}
                            <Button size="sm" className="mt-1 h-auto p-0" variant="link" asChild>
                              <Link href={`/products?id=${product.id}`}>詳細を見る</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Product List - Use ProductTag type and add ref */}
          <div ref={productsSectionRef}> {/* Add ref here */}
            <h2 className="text-lg font-semibold mb-3">使用製品</h2>
            <div className="space-y-3">
              {post.tags?.map((tag: ProductTag) => { // Use ProductTag type
                // Use tag.product
                if (!tag.product) return null; // Skip if product data is missing
                const product = tag.product; // Use singular product based on type
                return (
                  // Make the card itself the trigger for setActiveTag and scroll
                  <Card
                    key={tag.id}
                    className={`hover:bg-muted/50 transition-colors cursor-pointer ${activeTag === tag.id ? 'border-primary' : ''}`} // Highlight active
                    onClick={() => {
                      setActiveTag(tag.id);
                      // Scroll to the section when a product card is clicked
                      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <CardContent className="p-3"> {/* Adjusted padding */}
                      <div className="flex items-center gap-3"> {/* Adjusted gap */}
                        <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0 border">
                          <Image
                            // Use product.imageUrl from Product type
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0 flex-1"> {/* Allow text to wrap */}
                          <h3 className="font-medium truncate text-sm">{product.name}</h3>
                          {/* Use product.brand from Product type */}
                          <p className="text-xs text-muted-foreground truncate">{product.brand?.name ?? 'ブランド未設定'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {post.tags?.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  タグ付けされた製品はありません
                </p>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            {/* Use _count.comments */}
            <h2 className="text-lg font-semibold mb-3">コメント ({post._count?.comments ?? 0})</h2>
            {/* Comment Form */}
            {isSignedIn && (
              <form onSubmit={handleSubmitComment} className="mb-4"> {/* Adjusted margin */}
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
            {/* Comment List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                // Use Comment type
                comments.map((comment: Comment) => ( // Use Comment type
                  <div key={comment.id} className="flex gap-3">
                    {/* Use comment.user relation from Comment type */}
                    <Link href={`/user/${comment.user?.username ?? '#'}`}>
                      <Avatar className="h-8 w-8">
                        {/* Use comment.user.image */}
                        <AvatarImage src={comment.user?.image || "/placeholder-user.jpg"} alt={comment.user?.username ?? 'U'} />
                        <AvatarFallback>{comment.user?.username?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <Link href={`/user/${comment.user?.username ?? '#'}`} className="font-medium hover:underline text-sm">
                          {/* Use comment.user.name or username */}
                          {comment.user?.name || comment.user?.username}
                        </Link>
                        {/* Use comment.createdAt */}
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    {/* Check if current user is post owner OR comment owner */}
                    {(isOwner || currentUser?.id === comment.userId) && ( // Use comment.userId
                      <Button
                        variant="ghost"
                        size="icon" // Make it an icon button
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <span className="sr-only">Delete</span>
                        <MoreHorizontal className="h-4 w-4" /> {/* Consider using Trash2 icon */}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  まだコメントはありません。最初のコメントを残しましょう！
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
