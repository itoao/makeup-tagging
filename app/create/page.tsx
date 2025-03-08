"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Tag, X } from "lucide-react"
import Image from "next/image"
import { ProductTag } from "@/components/product-tag"

export default function CreatePost() {
  const [image, setImage] = useState<string | null>(null)
  const [tags, setTags] = useState<Array<{ id: number; x: number; y: number; product: string | null }>>([])
  const [activeTag, setActiveTag] = useState<number | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a server
      // For this demo, we'll use a placeholder
      setImage("/placeholder.svg?height=600&width=400")
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newTag = {
      id: Date.now(),
      x,
      y,
      product: null,
    }

    setTags([...tags, newTag])
    setActiveTag(newTag.id)
  }

  const handleTagProduct = (id: number, product: string) => {
    setTags(
      tags.map((tag) => {
        if (tag.id === id) {
          return { ...tag, product }
        }
        return tag
      }),
    )
    setActiveTag(null)
  }

  const removeTag = (id: number) => {
    setTags(tags.filter((tag) => tag.id !== id))
    if (activeTag === id) {
      setActiveTag(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create New Makeup Post</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="mb-6">
            <Label htmlFor="title">Post Title</Label>
            <Input id="title" placeholder="e.g., Summer Glow Makeup Look" className="mt-1" />
          </div>

          <div className="mb-6">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your makeup look and techniques used..."
              className="mt-1 h-32"
            />
          </div>

          {!image ? (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <span className="text-lg font-medium mb-1">Upload your photo</span>
                  <span className="text-sm text-muted-foreground mb-4">Click on the image to tag makeup products</span>
                  <Button type="button">Select Image</Button>
                </div>
                <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </Label>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden" ref={imageRef} onClick={handleImageClick}>
              <div className="aspect-[3/4] relative">
                <Image src={image || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center cursor-pointer ${
                      activeTag === tag.id ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                    } border-2 border-primary`}
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTag(tag.id)
                    }}
                  >
                    <Tag className="h-3 w-3" />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => setImage(null)}>
                Change Image
              </Button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Tagged Products</h2>
          {tags.length === 0 ? (
            <div className="text-muted-foreground text-center p-8 border rounded-lg">
              <Tag className="h-8 w-8 mx-auto mb-2" />
              <p>Click on the image to tag makeup products</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tags.map((tag) => (
                <Card key={tag.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            activeTag === tag.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Tag className="h-3 w-3" />
                        </div>
                        <span className="font-medium">Product {tags.indexOf(tag) + 1}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeTag(tag.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {activeTag === tag.id ? (
                      <div className="mt-3">
                        <ProductTag onSelect={(product) => handleTagProduct(tag.id, product)} />
                      </div>
                    ) : (
                      <div className="mt-3">
                        {tag.product ? (
                          <div className="flex items-center gap-3 p-2 bg-muted rounded-md">
                            <div className="w-10 h-10 relative rounded overflow-hidden">
                              <Image
                                src="/placeholder.svg?height=40&width=40"
                                alt={tag.product}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{tag.product}</div>
                              <div className="text-xs text-muted-foreground">Brand Name</div>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTag(tag.id)}>
                            Select Product
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Button className="w-full" size="lg" disabled={tags.length === 0}>
              Publish Makeup Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

