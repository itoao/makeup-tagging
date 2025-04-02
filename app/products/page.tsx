import Image from "next/image";
import Link from "next/link";
import { fetchProducts } from "@/lib/repositories/ProductRepository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

// Server Componentとして商品リストを表示
export default async function ProductsPage() {
  // サーバーサイドで商品データを取得
  const { data: products, error } = await fetchProducts();

  // エラーハンドリング
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-destructive">
          Error loading products
        </h2>
        <p className="text-muted-foreground">
          Failed to fetch products from the database. Please try again later.
        </p>
        <pre className="mt-4 text-sm text-muted-foreground bg-muted p-2 rounded text-left overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  // 商品がない場合の表示
  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-2">No products found</h2>
        <p className="text-muted-foreground">
          There are currently no products available.
        </p>
        {/* TODO: Add a link to suggest adding products if applicable */}
      </div>
    );
  }

  // 商品リスト表示
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Makeup Products</h1>
        {/* TODO: Add filtering/sorting controls here if needed (likely requires client component) */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden group">
            <Link href={`/products/${product.id}`} className="block"> {/* Link to potential detail page */}
              <CardContent className="p-0">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  {product.category?.name && (
                     <Badge variant="outline" className="mb-1 text-xs">
                       {product.category.name}
                     </Badge>
                  )}
                  <h3 className="font-medium line-clamp-2 text-sm leading-snug mb-1">
                    {product.name}
                  </h3>
                  {product.brand?.name && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {product.brand.name}
                    </p>
                  )}
                  {product.price !== null && product.price !== undefined && (
                    <span className="font-semibold text-base">
                      ¥{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Link>
             {/* Add to cart or other actions can be added here, likely needing client interaction */}
             {/* 
             <div className="p-4 pt-0">
               <Button className="w-full" size="sm">Add to Cart</Button>
             </div> 
             */}
          </Card>
        ))}
      </div>
    </div>
  );
}
