import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface MakeupPostProps {
  username: string
  imageUrl: string
  title: string
  likes: number
  comments: number
  productCount: number
}

export function MakeupPost({ username, imageUrl, title, likes, comments, productCount }: MakeupPostProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative">
        <Link href={`/post/${username}`}>
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-medium text-lg">{title}</h3>
              </div>
            </div>
          </div>
        </Link>
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=30&width=30`} alt={username} />
            <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{username}</span>
        </div>
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
          <Tag className="h-3 w-3" />
          <span>{productCount} products</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between">
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

