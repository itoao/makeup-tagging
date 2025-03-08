"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import Image from "next/image"

interface ProductTagProps {
  onSelect: (product: string) => void
}

const sampleProducts = [
  {
    id: 1,
    name: "マキアージュ ドラマティックパウダリー UV",
    brand: "資生堂",
    category: "ベースメイク",
    imageUrl: "/マキアージュuv.jpg?height=60&width=60",
  },
  {
    id: 2,
    name: "リップモンスター",
    brand: "KATE", 
    category: "リップ",
    imageUrl: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 3,
    name: "デザイニング カラー アイズ",
    brand: "SUQQU",
    category: "アイシャドウ",
    imageUrl: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 4,
    name: "ラッシュエキスパート",
    brand: "ヒロインメイク",
    category: "マスカラ",
    imageUrl: "/placeholder.svg?height=60&width=60",
  },
]

export function ProductTag({ onSelect }: ProductTagProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState(sampleProducts)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)

    if (term.trim() === "") {
      setResults(sampleProducts)
    } else {
      const filtered = sampleProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.brand.toLowerCase().includes(term.toLowerCase()),
      )
      setResults(filtered)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for a product..."
          className="pl-9"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {results.map((product) => (
          <Card key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(product.name)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 relative rounded overflow-hidden">
                <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </div>
              <div>
                <div className="font-medium text-sm">{product.name}</div>
                <div className="text-xs text-muted-foreground">
                  {product.brand} • {product.category}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No products found</p>
            <Button variant="link" size="sm" className="mt-1" onClick={() => onSelect(searchTerm)}>
              Add "{searchTerm}" as a new product
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

