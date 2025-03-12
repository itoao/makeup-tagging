import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/supabase-storage';

// ブランド一覧を取得
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

    // ブランド一覧を取得
    const brands = await prisma.brand.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    // 総ブランド数を取得
    const total = await prisma.brand.count({ where });

    return NextResponse.json({
      brands,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'ブランド一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しいブランドを作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    await requireAuth();
    
    // リクエストボディを取得
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const logo = formData.get('logo') as File | null;
    
    // バリデーション
    if (!name) {
      return NextResponse.json(
        { error: 'ブランド名は必須です' },
        { status: 400 }
      );
    }
    
    // 同名のブランドが存在するか確認
    const existingBrand = await prisma.brand.findUnique({
      where: { name },
    });
    
    if (existingBrand) {
      return NextResponse.json(
        { error: '同名のブランドが既に存在します' },
        { status: 400 }
      );
    }
    
    // ロゴをアップロード（存在する場合）
    let logoUrl = null;
    if (logo) {
      const uploadResult = await uploadImage(logo, 'brands');
      
      if ('error' in uploadResult) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 500 }
        );
      }
      
      logoUrl = uploadResult.url;
    }
    
    // ブランドを作成
    const brand = await prisma.brand.create({
      data: {
        name,
        logoUrl,
      },
    });
    
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'ブランドの作成に失敗しました' },
      { status: 500 }
    );
  }
}
