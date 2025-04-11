"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2 } from "lucide-react"
import { productApi } from "@/lib/api"
import type { Product } from "@/src/types/product" // Import Product type
import Image from "next/image"

interface ProductTagProps {
  onSelect: (product: string, productId?: string) => void
}

export function ProductTag({ onSelect }: ProductTagProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<Product[]>([]) // Use Product[] type
  const [loading, setLoading] = useState(false)

  // Fetch products on initial load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const { data, error } = await productApi.getProducts({ limit: 10 })

        // Access products via data.data
        if (!error && data && data.data) {
          setResults(data.data)
        }
      } catch (err) {
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Search products when search term changes
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    
    if (term.trim() === "") {
      // If search term is empty, fetch default products
      try {
        setLoading(true)
        const { data, error } = await productApi.getProducts({ limit: 10 })

        // Access products via data.data
        if (!error && data && data.data) {
          setResults(data.data)
        }
      } catch (err) {
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    } else {
      // Search products by name
      try {
        setLoading(true)
        const { data, error } = await productApi.getProducts({ name: term, limit: 10 })

        // Access products via data.data
        if (!error && data && data.data) {
          setResults(data.data)
        }
      } catch (err) {
        console.error("Error searching products:", err)
      } finally {
        setLoading(false)
      }
    }
  }

  // Handle adding a new product
  const handleAddNewProduct = () => {
    // In a real app, you would open a modal to create a new product
    // For now, we'll just pass the name
    onSelect(searchTerm)
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

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {results.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onSelect(product.name, product.id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 relative rounded overflow-hidden">
                  <Image
                    src={product.imageUrl || "/placeholder.svg"} // Use imageUrl
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {/* Add null checks */}
                    {product.brand?.name ?? 'Unknown Brand'} • {product.category?.name ?? 'Unknown Category'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {results.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No products found</p>
              <Button variant="link" size="sm" className="mt-1" onClick={handleAddNewProduct}>
                Add "{searchTerm}" as a new product
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
