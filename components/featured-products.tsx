"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { productApi } from "@/lib/api"
import { Product } from "@/src/types/product" // Import Product type
import Image from "next/image"
import Link from "next/link"

// Fallback products in case API fails - Updated to match Product type
const fallbackProducts: Product[] = [
  {
    id: "fallback-1", // Use distinct IDs
    name: "マキアージュ ドラマティックパウダリー UV",
    description: null,
    price: 3850,
    imageUrl: "/マキアージュuv.jpg?height=200&width=200", // Corrected property name
    brand_id: "dummy-brand-1", // Added dummy FK
    category_id: "dummy-category-1", // Added dummy FK
    brand: { id: "dummy-brand-1", name: "資生堂" }, // Added dummy id
    category: { id: "dummy-category-1", name: "ベースメイク" }, // Added dummy id
    // Removed _count
  },
  {
    id: "fallback-2", // Use distinct IDs
    name: "リップモンスター",
    description: null,
    price: 1650,
    imageUrl: "/リップモンスター.jpg?height=200&width=200", // Corrected property name
    brand_id: "dummy-brand-2",
    category_id: "dummy-category-2",
    brand: { id: "dummy-brand-2", name: "KATE" }, // Added dummy id
    category: { id: "dummy-category-2", name: "リップ" }, // Added dummy id
    // Removed _count
  },
  {
    id: "fallback-3", // Use distinct IDs
    name: "デザイニング カラー アイズ",
    description: null,
    price: 6600,
    imageUrl: "/designing-color-eyes.jpg?height=200&width=200", // Corrected property name
    brand_id: "dummy-brand-3",
    category_id: "dummy-category-3",
    brand: { id: "dummy-brand-3", name: "SUQQU" }, // Added dummy id
    category: { id: "dummy-category-3", name: "アイシャドウ" }, // Added dummy id
    // Removed _count
  },
  {
    id: "fallback-4", // Use distinct IDs
    name: "ラッシュエキスパート",
    description: null,
    price: 1320,
    imageUrl: "/ラッシュエキスパート.jpg?height=200&width=200", // Corrected property name
    brand_id: "dummy-brand-4",
    category_id: "dummy-category-4",
    brand: { id: "dummy-brand-4", name: "ヒロインメイク" }, // Added dummy id
    category: { id: "dummy-category-4", name: "マスカラ" }, // Added dummy id
    // Removed _count
  },
]

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]) // Use Product[] type
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // Remove invalid 'sort' parameter
        const { data, error } = await productApi.getProducts({ 
          limit: 4,
        })

        // Access products via data.data and check length
        if (!error && data && data.data?.length > 0) {
          setProducts(data.data)
        } else {
          // Use updated fallback data if API fails or returns no data
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
                src={product.imageUrl || "/placeholder.svg"} // Use imageUrl
                alt={product.name}
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <Badge variant="outline" className="mb-2">
              {product.category?.name ?? 'カテゴリ未設定'} {/* Add null check for category */}
            </Badge>
            <h3 className="font-medium line-clamp-1">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-1">{product.brand?.name ?? 'Unknown Brand'}</p> {/* Add safety check for brand name */}
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">¥{product.price?.toLocaleString() || "価格未設定"}</span>
              {/* Temporarily comment out the count display as _count is removed from Product type */}
              {/* <span className="text-xs text-muted-foreground">Used in {product?._count?.tags ?? 0} looks</span> */}
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
