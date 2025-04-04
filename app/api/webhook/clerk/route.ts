import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import supabase from '@/lib/supabase'; // Import Supabase client
// TODO: Import generated Supabase types if available

// const prisma = new PrismaClient(); // Remove Prisma client instance

export async function POST(req: Request) {
  // Webhookシークレットを取得
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // リクエストヘッダーを取得 (req.headersを使用)
  const headersList = req.headers; 
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

    // Note: Supabase uses snake_case for column names by default
    const userData = {
        id, // Conflict target for upsert
        email: emailAddress || '',
        username: username || id, // Use id as fallback username if null
        name: first_name ? `${first_name} ${last_name || ''}`.trim() : null,
        image: image_url, // Clerk provides image_url
    };

    try {
      // ユーザーをupsert（作成または更新）
      // Supabase upsert uses 'id' as conflict target by default if it's the primary key
      const { error: upsertError } = await supabase
        .from('User') // Revert to PascalCase
        .upsert(userData); // userData uses camelCase keys matching schema

      if (upsertError) {
        throw upsertError; // Throw error to be caught below
      }

      return new Response('User created or updated', { status: 200 });
    } catch (error) {
      // Keep existing error handling structure
      console.error('Error upserting user:', error);
      return new Response('Error upserting user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    // Ensure id is present before attempting delete
    if (!id) {
        console.error('Error: Missing user ID for deletion webhook');
        return new Response('Error: Missing user ID', { status: 400 });
    }

    try {
      // ユーザーを削除
      const { error: deleteError } = await supabase
        .from('User') // Revert to PascalCase
        .delete()
        .eq('id', id);

       if (deleteError) {
         // Log error but potentially return success if user might already be deleted
         console.error('Error deleting user:', deleteError);
         // Optionally check error code if needed
       }

      return new Response('User deleted', { status: 200 });
    } catch (error) {
      // Keep existing error handling structure
      console.error('Error deleting user:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
}
