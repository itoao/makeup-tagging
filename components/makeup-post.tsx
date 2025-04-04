import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Tag, Bookmark } from "lucide-react"; // Add Bookmark
import Image from "next/image";
import Link from "next/link";
import { Post as PostType } from "@/src/types/product";
import { useLikePost, useSavePost } from "@/hooks/use-interactions"; // Import hooks

interface MakeupPostProps {
  post: PostType;
  className?: string;
}

export function MakeupPost({ post, className = "" }: MakeupPostProps) {
  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent link navigation if inside a link
    e.stopPropagation();
    likePost({ postId: post.id, isLiked: !!post.isLiked });
  };

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent link navigation if inside a link
    e.stopPropagation();
    savePost({ postId: post.id, isSaved: !!post.isSaved });
  };

  // Add a check for the post object itself
  if (!post) {
    // Optionally return a skeleton or null if post data is not yet available
    return null; // Or <Skeleton className="w-full h-[400px]" /> etc.
  }

  // Safely access nested properties, providing defaults if post or user is null/undefined
  const userId = post.user?.id; // Get user ID
  const username = post.user?.username ?? "Unknown User";
  const userImage = post.user?.image ?? "/placeholder-user.jpg"; // Renamed variable
  const likesCount = post._count?.likes ?? 0;
  const savesCount = post._count?.saves ?? 0;
  const commentsCount = post._count?.comments ?? 0;
  const productCount = post.tags?.length ?? 0; // Use tags length for product count
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        {/* Outer Link wraps only the image and title overlay */}
        <Link href={`/post/${post.id}`} className="block cursor-pointer group">
          <div className="relative aspect-[4/5] w-full"> {/* Image container */}
            <Image
              src={post.imageUrl || "/placeholder.svg"}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105" // Add hover effect
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Overlay appears on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div className="p-4">
                <h3 className="text-white font-medium text-lg line-clamp-2">{post.title}</h3>
              </div>
            </div>
          </div>
        </Link> {/* End outer link here */}

        {/* User Avatar/Name - Separate Link */}
        <div
          className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 z-10"
          onClick={(e) => e.stopPropagation()} // Prevent card link navigation
        >
          {/* Link to user profile using userId, disable if no ID */}
          <Link 
            href={userId ? `/user/${userId}` : '#'} 
            className={`flex items-center gap-2 ${!userId ? 'pointer-events-none' : ''}`}
            aria-disabled={!userId}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={userImage} alt={username} /> {/* Use renamed variable */}
              <AvatarFallback>{username ? username[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hover:underline">{username}</span>
          </Link>
        </div>

        {/* Product Count Tag - Not a link */}
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 z-10">
          <Tag className="h-3 w-3" />
          <span>{productCount} products</span>
        </div>
      </CardContent>

      {/* Footer - Outside the main link */}
      <CardFooter
        className="p-4 flex justify-between"
        onClick={(e) => e.stopPropagation()} // Prevent card link navigation
      >
        <div className="flex items-center gap-2"> {/* Reduced gap */}
          {/* Like Button */}
          <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2" onClick={handleLikeClick}>
            <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likesCount}</span>
          </Button>
          {/* Comment Button (Link to post page comments section?) */}
          <Link href={`/post/${post.id}#comments`} className="inline-flex">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
              <MessageCircle className="h-4 w-4" />
              <span>{commentsCount}</span>
            </Button>
          </Link>
           {/* Save Button */}
           <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2" onClick={handleSaveClick}>
            <Bookmark className={`h-4 w-4 ${post.isSaved ? 'fill-current' : ''}`} />
             {/* Optionally display save count */}
             {/* <span>{savesCount}</span> */}
           </Button>
        </div>
        {/* Share Button */}
        <Button variant="ghost" size="sm" className="px-2">
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
