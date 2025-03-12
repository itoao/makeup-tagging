import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// ユーザーをフォローする
export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const currentUserId = await requireAuth();

    // フォロー対象のユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 自分自身をフォローしようとしている場合
    if (targetUser.id === currentUserId) {
      return NextResponse.json(
        { error: '自分自身をフォローすることはできません' },
        { status: 400 }
      );
    }

    // 既にフォローしているか確認
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: '既にフォローしています' },
        { status: 400 }
      );
    }

    // フォロー関係を作成
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error following user:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'フォローに失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザーのフォローを解除する
export async function DELETE(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const currentUserId = await requireAuth();

    // フォロー解除対象のユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // フォロー関係を削除
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);

    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // フォロー関係が存在しない場合
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'フォローしていません' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フォロー解除に失敗しました' },
      { status: 500 }
    );
  }
}
