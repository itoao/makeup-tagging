"use client";

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';

/**
 * 認証状態を管理するカスタムフック
 * Clerkの認証情報とデータベースのユーザー情報を組み合わせて提供
 */
export function useAuth() {
  // Clerkの認証情報
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user: clerkUser } = useUser();
  
  // データベースのユーザー情報を取得
  const { data: dbUserData, isLoading: isLoadingDbUser } = useQuery({
    queryKey: ['currentUser', userId],
    queryFn: async () => {
      if (!isSignedIn || !clerkUser?.username) return null;
      const { data } = await userApi.getProfile(clerkUser.username);
      return data;
    },
    enabled: isLoaded && isSignedIn && !!clerkUser?.username,
  });
  
  const dbUser = dbUserData || null;
  
  return {
    // 認証状態
    isLoaded,
    isSignedIn,
    isLoading: !isLoaded || (isSignedIn && isLoadingDbUser),
    
    // ユーザー情報
    userId,
    user: isSignedIn ? {
      // Clerkのユーザー情報
      id: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress,
      username: clerkUser?.username,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      fullName: clerkUser?.fullName,
      imageUrl: clerkUser?.imageUrl,
      
      // データベースのユーザー情報
      dbUser,
      
      // 便利なゲッター
      get name() {
        return dbUser?.name || clerkUser?.fullName || '';
      },
      get image() {
        return dbUser?.image || clerkUser?.imageUrl || '';
      },
      get bio() {
        return dbUser?.bio || '';
      },
    } : null,
  };
}
