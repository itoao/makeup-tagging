import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/supabase-storage';

// 製品一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const limit = Number(searchParams.get('limit') || '20');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // クエリパラメータに基づいてフィルタリング
    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive' as const,
      };
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 製品一覧を取得
    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 総製品数を取得
    const total = await prisma.product.count({ where });

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: '製品一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しい製品を作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    await requireAuth();
    
    // リクエストボディを取得
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const brandId = formData.get('brandId') as string;
    const categoryId = formData.get('categoryId') as string;
    const image = formData.get('image') as File | null;
    
    // バリデーション
    if (!name || !brandId || !categoryId) {
      return NextResponse.json(
        { error: '製品名、ブランド、カテゴリーは必須です' },
        { status: 400 }
      );
    }
    
    // ブランドとカテゴリーが存在するか確認
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });
    
    if (!brand) {
      return NextResponse.json(
        { error: '指定されたブランドが見つかりません' },
        { status: 404 }
      );
    }
    
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: '指定されたカテゴリーが見つかりません' },
        { status: 404 }
      );
    }
    
    // 画像をアップロード（存在する場合）
    let imageUrl = null;
    if (image) {
      const uploadResult = await uploadImage(image, 'products');
      
      if ('error' in uploadResult) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 500 }
        );
      }
      
      imageUrl = uploadResult.url;
    }
    
    // 製品を作成
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        brandId,
        categoryId,
      },
      include: {
        brand: true,
        category: true,
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '製品の作成に失敗しました' },
      { status: 500 }
    );
  }
}
