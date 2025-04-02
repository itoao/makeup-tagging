"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { userApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error } = await userApi.getProfile(user?.username || "")
        
        if (error) {
          toast.error("プロフィールの読み込みに失敗しました")
          return
        }
        
        if (data) {
          setProfile(data)
          setName(data.name || "")
          setBio(data.bio || "")
        }
      } catch (err) {
        toast.error("プロフィールの読み込み中にエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    if (isSignedIn && user?.username) {
      fetchProfile()
    }
  }, [isLoaded, isSignedIn, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const { data, error } = await userApi.updateProfile({ name, bio })
      
      if (error) {
        toast.error("プロフィールの更新に失敗しました")
        return
      }
      
      toast.success("プロフィールを更新しました")
      router.push(`/user/${user?.username}`)
    } catch (err) {
      toast.error("プロフィールの更新中にエラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !isLoaded) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">プロフィール編集</CardTitle>
            <CardDescription>
              プロフィール情報を読み込んでいます...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">プロフィール編集</CardTitle>
            <CardDescription>
              あなたのプロフィール情報を更新します
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.imageUrl || "/placeholder-user.jpg"} alt={user?.username || ""} />
                <AvatarFallback>{user?.username?.[0].toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.emailAddresses[0].emailAddress}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                プロフィール画像を変更するには、Clerkの設定から変更してください
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="あなたの名前"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="あなたについて教えてください"
                rows={4}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/user/${user?.username}`)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "変更を保存"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
