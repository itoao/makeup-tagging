import Link from "next/link";
import { UserButton } from "./auth/user-button";

export function Navbar() {
  return (
    <nav className="border-b bg-background h-16">
      <div className="container h-full flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          tap&make
        </Link>
        <UserButton />
      </div>
    </nav>
  );
} 