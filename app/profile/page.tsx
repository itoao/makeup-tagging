import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <UserProfile />
    </div>
  );
} 