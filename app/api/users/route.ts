import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// ユーザー一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const limit = Number(searchParams.get('limit') || '10');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // クエリパラメータに基づいてフィルタリング
    const where = username
      ? {
          username: {
            contains: username,
            mode: 'insensitive' as const,
          },
        }
      : {};

    // ユーザー一覧を取得
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 総ユーザー数を取得
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザープロフィールを更新
export async function PATCH(req: NextRequest) {
  try {
    // 認証チェック
    const userId = await requireAuth();
    
    // リクエストボディを取得
    const body = await req.json();
    const { name, bio } = body;
    
    // 更新するフィールドを検証
    if (typeof name !== 'string' && name !== undefined) {
      return NextResponse.json(
        { error: '名前は文字列である必要があります' },
        { status: 400 }
      );
    }
    
    if (typeof bio !== 'string' && bio !== undefined) {
      return NextResponse.json(
        { error: 'プロフィールは文字列である必要があります' },
        { status: 400 }
      );
    }
    
    // ユーザープロフィールを更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    );
  }
}
