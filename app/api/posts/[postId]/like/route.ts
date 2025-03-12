import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// 投稿にいいねする
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // 投稿が存在するか確認
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 既にいいねしているか確認
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: '既にいいねしています' },
        { status: 400 }
      );
    }

    // いいねを作成
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    // いいね数を取得
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return NextResponse.json({ success: true, likeCount });
  } catch (error) {
    console.error('Error liking post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'いいねに失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿のいいねを解除する
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const userId = await requireAuth();

    // いいねを削除
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    // いいね数を取得
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return NextResponse.json({ success: true, likeCount });
  } catch (error) {
    console.error('Error unliking post:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // いいねが存在しない場合
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'いいねしていません' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'いいね解除に失敗しました' },
      { status: 500 }
    );
  }
}
