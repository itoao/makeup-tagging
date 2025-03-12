import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// カテゴリー一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const limit = Number(searchParams.get('limit') || '50');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // クエリパラメータに基づいてフィルタリング
    const where = name
      ? {
          name: {
            contains: name,
            mode: 'insensitive' as const,
          },
        }
      : {};

    // カテゴリー一覧を取得
    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    // 総カテゴリー数を取得
    const total = await prisma.category.count({ where });

    return NextResponse.json({
      categories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'カテゴリー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しいカテゴリーを作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    await requireAuth();
    
    // リクエストボディを取得
    const body = await req.json();
    const { name } = body;
    
    // バリデーション
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'カテゴリー名は必須です' },
        { status: 400 }
      );
    }
    
    // 同名のカテゴリーが存在するか確認
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: '同名のカテゴリーが既に存在します' },
        { status: 400 }
      );
    }
    
    // カテゴリーを作成
    const category = await prisma.category.create({
      data: {
        name,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'カテゴリーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
