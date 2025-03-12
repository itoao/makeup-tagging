import { PrismaClient } from '@prisma/client'

// PrismaClientのグローバルインスタンスを宣言
declare global {
  var prisma: PrismaClient | undefined
}

// 開発環境では既存のPrismaClientインスタンスを再利用し、
// 本番環境では新しいインスタンスを作成
export const prisma = global.prisma || new PrismaClient()

// 開発環境でのホットリロード時にPrismaClientの複数インスタンス作成を防ぐ
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
