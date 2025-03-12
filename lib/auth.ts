import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

/**
 * 現在のユーザーIDを取得する
 * @returns ユーザーIDまたはnull
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * 現在のユーザーの詳細情報を取得する
 * @returns ユーザー情報またはnull
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

/**
 * 現在のユーザーのデータベースレコードを取得する
 * @returns データベースのユーザーレコードまたはnull
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  return dbUser;
}

/**
 * ユーザーが特定のリソースにアクセスする権限があるか確認する
 * @param resourceUserId リソースの所有者ID
 * @returns アクセス権があるかどうか
 */
export async function hasAccessToResource(resourceUserId: string): Promise<boolean> {
  const { userId } = await auth();
  return userId === resourceUserId;
}

/**
 * 認証が必要なAPIルートで使用するための認証チェック
 * @returns ユーザーIDまたはエラーをスロー
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('認証が必要です');
  }
  
  return userId;
}
