import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface MakeupPostProps {
  username: string
  imageUrl: string
  title: string // Corrected type
  likes: number // Corrected type
  comments: number // Corrected type
  productCount: number // Corrected type
  postId: string // Corrected type and removed duplicate
  className?: string // Corrected optional syntax
}

export function MakeupPost({
  username,
  imageUrl,
  title,
  likes,
  comments,
  productCount,
  postId, // Use the actual postId
  className = ""
}: MakeupPostProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        {/* Outer Link wraps only the image and title overlay */}
        <Link href={`/post/${postId}`} className="block cursor-pointer group">
          <div className="relative aspect-[4/5] w-full"> {/* Image container */}
            <Image
              src={imageUrl || "/placeholder.svg"} // Removed duplicate attributes
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105" // Add hover effect
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Overlay appears on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div className="p-4">
                <h3 className="text-white font-medium text-lg line-clamp-2">{title}</h3>
              </div>
            </div>
          </div>
        </Link> {/* End outer link here */}

        {/* User Avatar/Name - Separate Link */}
        <div
          className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 z-10"
          onClick={(e) => e.stopPropagation()} // Prevent card link navigation
        >
          <Link href={`/user/${username}`} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`/placeholder-user.jpg`} alt={username} /> {/* Use a placeholder */}
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
            <Heart className="h-4 w-4" />
            <span>{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="px-2">
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
