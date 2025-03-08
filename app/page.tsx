import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MakeupPost } from "@/components/makeup-post"
import { FeaturedProducts } from "@/components/featured-products"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12 text-center">
        <div className="flex justify-center gap-4">
          <Button size="lg">Explore Looks</Button>
          <Button size="lg" variant="outline">
            Share Your Makeup
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MakeupPost
            username="beauty_guru"
            imageUrl="/face_1.jpg?height=500&width=400"
            title="Summer Glow Look"
            likes={243}
            comments={18}
            productCount={5}
          />
          <MakeupPost
            username="makeup_artist"
            imageUrl="/face_2.jpg?height=500&width=400"
            title="Natural Everyday Makeup"
            likes={187}
            comments={24}
            productCount={7}
          />
          <MakeupPost
            username="style_icon"
            imageUrl="/face_3.jpg?height=500&width=400"
            title="Bold Evening Look"
            likes={312}
            comments={42}
            productCount={8}
          />
        </div>
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
          <Button size="lg">Create Your First Post</Button>
        </div>
      </section>
    </div>
  )
}

