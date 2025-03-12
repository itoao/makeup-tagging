import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserId } from '@/lib/auth';
import { uploadImage } from '@/lib/supabase-storage';

// 投稿一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = Number(searchParams.get('limit') || '10');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const currentUserId = await getUserId();

    // クエリパラメータに基づいてフィルタリング
    const where = userId ? { userId } : {};

    // 投稿一覧を取得
    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 総投稿数を取得
    const total = await prisma.post.count({ where });

    // 現在のユーザーがいいねしている投稿を取得
    let likedPostIds: string[] = [];
    if (currentUserId) {
      const likes = await prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: {
            in: posts.map(post => post.id),
          },
        },
        select: {
          postId: true,
        },
      });
      likedPostIds = likes.map(like => like.postId);
    }

    // 投稿にいいね情報を追加
    const postsWithLikeInfo = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.includes(post.id),
    }));

    return NextResponse.json({
      posts: postsWithLikeInfo,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '投稿一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しい投稿を作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const userId = await requireAuth();
    
    // リクエストボディを取得
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const image = formData.get('image') as File;
    const tagsData = formData.get('tags') as string;
    
    // バリデーション
    if (!title || !image) {
      return NextResponse.json(
        { error: 'タイトルと画像は必須です' },
        { status: 400 }
      );
    }
    
    // 画像をSupabaseにアップロード
    const uploadResult = await uploadImage(image, 'posts');
    
    if ('error' in uploadResult) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }
    
    // タグデータをパース
    let tags: { productId: string; xPosition: number; yPosition: number }[] = [];
    try {
      if (tagsData) {
        tags = JSON.parse(tagsData);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'タグデータの形式が不正です' },
        { status: 400 }
      );
    }
    
    // 投稿を作成
    const post = await prisma.post.create({
      data: {
        title,
        description,
        imageUrl: uploadResult.url,
        userId,
        tags: {
          create: tags.map(tag => ({
            productId: tag.productId,
            xPosition: tag.xPosition,
            yPosition: tag.yPosition,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}
