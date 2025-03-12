import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  // Webhookシークレットを取得
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // リクエストヘッダーを取得
  const headersList = headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  // 必要なヘッダーが存在するか確認
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // リクエストボディを取得
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhookの検証
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  // イベントタイプに基づいて処理
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    // メールアドレスを取得
    const emailAddress = email_addresses && email_addresses[0]?.email_address;

    try {
      // ユーザーをupsert（作成または更新）
      await prisma.user.upsert({
        where: { id },
        update: {
          email: emailAddress,
          username: username || undefined,
          name: first_name ? `${first_name} ${last_name || ''}`.trim() : undefined,
          image: image_url,
        },
        create: {
          id,
          email: emailAddress || '',
          username: username || id,
          name: first_name ? `${first_name} ${last_name || ''}`.trim() : null,
          image: image_url,
        },
      });

      return new Response('User created or updated', { status: 200 });
    } catch (error) {
      console.error('Error upserting user:', error);
      return new Response('Error upserting user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // ユーザーを削除
      await prisma.user.delete({
        where: { id },
      });

      return new Response('User deleted', { status: 200 });
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
} 