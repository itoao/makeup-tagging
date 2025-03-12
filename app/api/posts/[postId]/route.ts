import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasAccessToResource, getUserId } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/supabase-storage';

// 投稿の詳細を取得
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const currentUserId = await getUserId();

    // 投稿を取得
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 現在のユーザーがいいねしているか確認
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      // いいね状態を確認
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId,
          },
        },
      });
      isLiked = !!like;

      // 保存状態を確認
      const savedPost = await prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId,
          },
        },
      });
      isSaved = !!savedPost;
    }

    return NextResponse.json({
      ...post,
      isLiked,
      isSaved,
      isOwner: currentUserId === post.userId,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿を更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 投稿を取得
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿の所有者かどうか確認
    if (!hasAccessToResource(post.userId)) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    // リクエストボディを取得
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const image = formData.get('image') as File | null;
    const tagsData = formData.get('tags') as string;

    // バリデーション
    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    // 更新データを準備
    const updateData: any = {
      title,
      description,
    };

    // 画像が提供された場合は更新
    if (image) {
      // 古い画像を削除
      if (post.imageUrl) {
        await deleteImage(post.imageUrl, 'posts');
      }

      // 新しい画像をアップロード
      const uploadResult = await uploadImage(image, 'posts');

      if ('error' in uploadResult) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 500 }
        );
      }

      updateData.imageUrl = uploadResult.url;
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

    // 既存のタグを削除
    await prisma.tag.deleteMany({
      where: { postId },
    });

    // 投稿を更新
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...updateData,
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

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '投稿の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿を削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 投稿を取得
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿の所有者かどうか確認
    if (!hasAccessToResource(post.userId)) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    // 画像を削除
    if (post.imageUrl) {
      await deleteImage(post.imageUrl, 'posts');
    }

    // 投稿を削除（関連するタグ、いいね、コメント、保存は自動的に削除される）
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}
