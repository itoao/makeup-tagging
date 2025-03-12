// TODO: あとで client or server 検討する
"use client"
import { SignInButton, SignOutButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserButton() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return (
      <div className="flex gap-2">
        <SignInButton>
          <Button variant="outline" size="sm">
            ログイン
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button size="sm">
            登録
          </Button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/profile">
        <Button variant="ghost" size="sm">
          {user.firstName || user.username || "プロフィール"}
        </Button>
      </Link>
      <SignOutButton>
        <Button variant="destructive" size="sm">
          ログアウト
        </Button>
      </SignOutButton>
    </div>
  );
} 