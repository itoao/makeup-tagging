"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusCircle, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"

export function MobileNav() {
  const pathname = usePathname()
  const { user, isSignedIn } = useUser()
  
  const routes = [
    {
      href: "/",
      icon: Home,
      label: "ホーム",
      active: pathname === "/"
    },
    {
      href: "/explore",
      icon: Search,
      label: "探索",
      active: pathname === "/explore"
    },
    {
      href: "/create",
      icon: PlusCircle,
      label: "投稿",
      active: pathname === "/create"
    },
    {
      href: "/products",
      icon: ShoppingBag,
      label: "製品",
      active: pathname === "/products"
    },
    {
      href: isSignedIn ? `/user/${user?.username}` : "/sign-in",
      icon: User,
      label: "プロフィール",
      active: pathname === `/user/${user?.username}` || pathname === "/profile"
    }
  ]
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t md:hidden">
      <div className="flex justify-between items-center">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center py-2 flex-1 text-xs",
              route.active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <route.icon className="h-5 w-5 mb-1" />
            <span>{route.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
