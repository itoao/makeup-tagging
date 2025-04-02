"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { productApi } from "@/lib/api"
import Image from "next/image"
import Link from "next/link"

// Fallback products in case API fails
const fallbackProducts = [
  {
    id: "1",
    name: "マキアージュ ドラマティックパウダリー UV",
    brand: { name: "資生堂" },
    price: 3850,
    category: { name: "ベースメイク" },
    imageUrl: "/マキアージュuv.jpg?height=200&width=200",
    _count: { tags: 128 },
  },
  {
    id: "2",
    name: "リップモンスター",
    brand: { name: "KATE" },
    price: 1650,
    category: { name: "リップ" },
    imageUrl: "/リップモンスター.jpg?height=200&width=200", 
    _count: { tags: 94 },
  },
  {
    id: "3",
    name: "デザイニング カラー アイズ",
    brand: { name: "SUQQU" },
    price: 6600,
    category: { name: "アイシャドウ" },
    imageUrl: "/designing-color-eyes.jpg?height=200&width=200",
    _count: { tags: 156 },
  },
  {
    id: "4",
    name: "ラッシュエキスパート",
    brand: { name: "ヒロインメイク" },
    price: 1320,
    category: { name: "マスカラ" },
    imageUrl: "/ラッシュエキスパート.jpg?height=200&width=200",
    _count: { tags: 87 },
  },
]

export function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // Remove invalid 'sort' parameter
        const { data, error } = await productApi.getProducts({ 
          limit: 4, 
        })
        
        if (!error && data && data.products.length > 0) {
          setProducts(data.products)
        } else {
          // Use fallback data if API fails
          setProducts(fallbackProducts)
        }
      } catch (err) {
        console.error("Error fetching products:", err)
        setProducts(fallbackProducts)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="relative aspect-square mb-3">
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <Badge variant="outline" className="mb-2">
              {product.category.name}
            </Badge>
            <h3 className="font-medium line-clamp-1">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-1">{product.brand?.name ?? 'Unknown Brand'}</p> {/* Add safety check for brand name */}
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">¥{product.price?.toLocaleString() || "価格未設定"}</span>
              {/* Add safety check for _count.tags */}
              <span className="text-xs text-muted-foreground">Used in {product?._count?.tags ?? 0} looks</span>
            </div>
            <Button className="w-full mt-3" size="sm" asChild>
              <Link href={`/products?id=${product.id}`}>View Details</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
