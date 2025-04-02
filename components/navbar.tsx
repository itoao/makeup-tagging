import Link from "next/link";
import Image from "next/image"; // Imageコンポーネントをインポート
import { UserButton } from "./auth/user-button";
import { Button } from "@/components/ui/button";
import { Home, Search, PlusCircle, ShoppingBag } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b bg-background h-16">
      <div className="container h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* テキストロゴを画像ロゴに置き換え */}
          <Link href="/" className="mr-6">
            <Image
              src="/service-logo.png"
              alt="Make Recipe Logo"
              width={120} // 幅を適切に設定 (例: 120px)
              height={32} // 高さを適切に設定 (例: 32px)
              priority // LCP要素の可能性があるため、優先的に読み込む
            />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>ホーム</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore" className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                <span>探索</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products" className="flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" />
                <span>製品</span>
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1" asChild>
            <Link href="/create">
              <PlusCircle className="h-4 w-4" />
              <span>投稿</span>
            </Link>
          </Button>
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
