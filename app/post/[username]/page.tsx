import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Bookmark, Tag } from "lucide-react"
import Image from "next/image"

export default function PostDetail({ params }: { params: { username: string } }) {
  const username = params.username

  // This would be fetched from a database in a real application
  const post = {
    title: "Summer Glow Makeup Look",
    description:
      "This is my go-to summer look that's perfect for both day and night events. I focused on creating a dewy base with a subtle bronze eye and peachy lips. The highlighter really catches the light beautifully!",
    imageUrl: "/placeholder.svg?height=800&width=600",
    likes: 243,
    comments: 18,
    tags: [
      {
        id: 1,
        x: 30,
        y: 20,
        product: {
          name: "Luminous Foundation",
          brand: "Glow Cosmetics",
          price: "$38",
          category: "Face",
          imageUrl: "/placeholder.svg?height=80&width=80",
        },
      },
      {
        id: 2,
        x: 45,
        y: 35,
        product: {
          name: "Velvet Matte Lipstick",
          brand: "Color Pop",
          price: "$22",
          category: "Lips",
          imageUrl: "/placeholder.svg?height=80&width=80",
        },
      },
      {
        id: 3,
        x: 65,
        y: 25,
        product: {
          name: "Shimmer Eyeshadow Palette",
          brand: "Eye Magic",
          price: "$45",
          category: "Eyes",
          imageUrl: "/placeholder.svg?height=80&width=80",
        },
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="sticky top-8">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
              <Image src={post.imageUrl || "/placeholder.svg"} alt={post.title} fill className="object-cover" />

              {post.tags.map((tag) => (
                <div
                  key={tag.id}
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer border-2 border-background"
                  style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                >
                  <Tag className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <Avatar>
              <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={username} />
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{username}</div>
              <div className="text-sm text-muted-foreground">Makeup Enthusiast</div>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              Follow
            </Button>
          </div>

          <h1 className="text-2xl font-bold mb-3">{post.title}</h1>
          <p className="text-muted-foreground mb-6">{post.description}</p>

          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{post.likes}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1 ml-auto">
              <Bookmark className="h-4 w-4" />
              <span>Save</span>
            </Button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Products Used</h2>
            <div className="space-y-4">
              {post.tags.map((tag) => (
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
                          {tag.product.category}
                        </Badge>
                        <h3 className="font-medium">{tag.product.name}</h3>
                        <p className="text-sm text-muted-foreground">{tag.product.brand}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{tag.product.price}</div>
                        <Button size="sm" className="mt-1">
                          Shop
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">jane_doe</span>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                  <p className="text-sm mt-1">
                    This look is absolutely stunning! I'm definitely going to try that lipstick shade.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>MK</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">makeup_lover</span>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                  <p className="text-sm mt-1">
                    I've been using that foundation for months and it's amazing! Great choice!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

