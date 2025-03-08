import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const products = [
  {
    id: 1,
    name: "マキアージュ ドラマティックパウダリー UV",
    brand: "資生堂",
    price: "¥3,850",
    category: "ベースメイク",
    imageUrl: "/マキアージュuv.jpg?height=200&width=200",
    usedCount: 128,
  },
  {
    id: 2,
    name: "リップモンスター",
    brand: "KATE",
    price: "¥1,650",
    category: "リップ",
    imageUrl: "/リップモンスター.jpg?height=200&width=200", 
    usedCount: 94,
  },
  {
    id: 3,
    name: "デザイニング カラー アイズ",
    brand: "SUQQU",
    price: "¥6,600",
    category: "アイシャドウ",
    imageUrl: "/デザイニングカラーアイズ.jpg?height=200&width=200",
    usedCount: 156,
  },
  {
    id: 4,
    name: "ラッシュエキスパート",
    brand: "ヒロインメイク",
    price: "¥1,320",
    category: "マスカラ",
    imageUrl: "/ラッシュエキスパート.jpg?height=200&width=200",
    usedCount: 87,
  },
]

export function FeaturedProducts() {
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
              {product.category}
            </Badge>
            <h3 className="font-medium line-clamp-1">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">{product.price}</span>
              <span className="text-xs text-muted-foreground">Used in {product.usedCount} looks</span>
            </div>
            <Button className="w-full mt-3" size="sm">
              Shop Now
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

