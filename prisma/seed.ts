import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 データベースのシード処理を開始します...');

  // カテゴリーの作成
  console.log('カテゴリーを作成中...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'ベースメイク' },
      update: {},
      create: { name: 'ベースメイク' },
    }),
    prisma.category.upsert({
      where: { name: 'アイメイク' },
      update: {},
      create: { name: 'アイメイク' },
    }),
    prisma.category.upsert({
      where: { name: 'リップ' },
      update: {},
      create: { name: 'リップ' },
    }),
    prisma.category.upsert({
      where: { name: 'チーク' },
      update: {},
      create: { name: 'チーク' },
    }),
    prisma.category.upsert({
      where: { name: 'ハイライト' },
      update: {},
      create: { name: 'ハイライト' },
    }),
    prisma.category.upsert({
      where: { name: 'コントゥアリング' },
      update: {},
      create: { name: 'コントゥアリング' },
    }),
    prisma.category.upsert({
      where: { name: 'アイブロウ' },
      update: {},
      create: { name: 'アイブロウ' },
    }),
    prisma.category.upsert({
      where: { name: 'スキンケア' },
      update: {},
      create: { name: 'スキンケア' },
    }),
  ]);
  console.log(`${categories.length}個のカテゴリーを作成しました`);

  // ブランドの作成
  console.log('ブランドを作成中...');
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'SHISEIDO' },
      update: {},
      create: { name: 'SHISEIDO' },
    }),
    prisma.brand.upsert({
      where: { name: 'KATE' },
      update: {},
      create: { name: 'KATE' },
    }),
    prisma.brand.upsert({
      where: { name: 'CANMAKE' },
      update: {},
      create: { name: 'CANMAKE' },
    }),
    prisma.brand.upsert({
      where: { name: 'MAJOLICA MAJORCA' },
      update: {},
      create: { name: 'MAJOLICA MAJORCA' },
    }),
    prisma.brand.upsert({
      where: { name: 'OPERA' },
      update: {},
      create: { name: 'OPERA' },
    }),
    prisma.brand.upsert({
      where: { name: 'CEZANNE' },
      update: {},
      create: { name: 'CEZANNE' },
    }),
    prisma.brand.upsert({
      where: { name: 'EXCEL' },
      update: {},
      create: { name: 'EXCEL' },
    }),
    prisma.brand.upsert({
      where: { name: 'INTEGRATE' },
      update: {},
      create: { name: 'INTEGRATE' },
    }),
    prisma.brand.upsert({
      where: { name: 'ADDICTION' },
      update: {},
      create: { name: 'ADDICTION' },
    }),
    prisma.brand.upsert({
      where: { name: 'SUQQU' },
      update: {},
      create: { name: 'SUQQU' },
    }),
  ]);
  console.log(`${brands.length}個のブランドを作成しました`);

  // ユーザーの作成
  console.log('ユーザーを作成中...');
  const user = await prisma.user.upsert({
    where: { id: 'seed-user-id' }, // ClerkのユーザーIDなど、固定のIDを使用
    update: {},
    create: {
      id: 'seed-user-id',
      username: 'seeduser',
      name: 'Seed User',
      email: 'seed@example.com',
      image: '/placeholder-user.jpg', // imageUrl -> image に変更
    },
  });
  console.log(`ユーザー "${user.username}" を作成しました`);

  // 製品の作成
  console.log('製品を作成中...');
  const baseCategory = categories.find(c => c.name === 'ベースメイク')!;
  const eyeCategory = categories.find(c => c.name === 'アイメイク')!;
  const lipCategory = categories.find(c => c.name === 'リップ')!;

  const shiseidoBrand = brands.find(b => b.name === 'SHISEIDO')!;
  const kateBrand = brands.find(b => b.name === 'KATE')!;
  const operaBrand = brands.find(b => b.name === 'OPERA')!;

  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        name: 'マキアージュ ドラマティックスキンセンサーベース UV',
        description: '肌悩みに合わせて色や質感が変化するベース',
        price: 3300,
        brandId: shiseidoBrand.id,
        categoryId: baseCategory.id,
        imageUrl: '/マキアージュuv.jpg',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        name: 'ラッシュエキスパート（ウォータープルーフ）',
        description: '繊維入りマスカラ',
        price: 1650,
        brandId: kateBrand.id,
        categoryId: eyeCategory.id,
        imageUrl: '/ラッシュエキスパート.jpg',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        name: 'リップモンスター',
        description: '落ちにくいティントリップ',
        price: 1650,
        brandId: operaBrand.id,
        categoryId: lipCategory.id,
        imageUrl: '/リップモンスター.jpg',
      },
    }),
  ]);
  console.log(`${products.length}個の製品を作成しました`);

  // 投稿の作成
  console.log('投稿を作成中...');
  const posts = await Promise.all([
    prisma.post.upsert({
      where: { id: 'post-1' },
      update: {},
      create: {
        id: 'post-1',
        title: '今日のメイク', // title を追加
        userId: user.id,
        imageUrl: '/face_1.jpg',
        description: '今日のメイク💄 マキアージュの下地とKATEのマスカラを使ってみました✨', // caption -> description に変更
        // products リレーションは Tag 経由なので削除
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-2' },
      update: {},
      create: {
        id: 'post-2',
        title: 'リップモンスターレビュー', // title を追加
        userId: user.id,
        imageUrl: '/face_2.jpg',
        description: 'OPERAのリップモンスター、本当に落ちにくい！💋 色持ち最高です👍', // caption -> description に変更
        // products リレーションは Tag 経由なので削除
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-3' },
      update: {},
      create: {
        id: 'post-3',
        title: '今日のフルメイク', // title を追加
        userId: user.id,
        imageUrl: '/face_3.jpg',
        description: 'フルメイク！今日の主役はリップモンスター💄✨', // caption -> description に変更
        // products リレーションは Tag 経由なので削除
      },
    }),
  ]);
  console.log(`${posts.length}個の投稿を作成しました`);

  // タグの作成 (Post と Product の関連付け)
  console.log('タグを作成中...');
  const post1 = posts.find(p => p.id === 'post-1')!;
  const post2 = posts.find(p => p.id === 'post-2')!;
  const post3 = posts.find(p => p.id === 'post-3')!;
  const product1 = products.find(p => p.id === 'product-1')!;
  const product2 = products.find(p => p.id === 'product-2')!;
  const product3 = products.find(p => p.id === 'product-3')!;

  const tags = await Promise.all([
    // Post 1 のタグ
    prisma.tag.upsert({
      where: { id: 'tag-1-1' }, update: {}, create: {
        id: 'tag-1-1', postId: post1.id, productId: product1.id, xPosition: 30, yPosition: 40,
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-1-2' }, update: {}, create: {
        id: 'tag-1-2', postId: post1.id, productId: product2.id, xPosition: 70, yPosition: 60,
      },
    }),
    // Post 2 のタグ
    prisma.tag.upsert({
      where: { id: 'tag-2-1' }, update: {}, create: {
        id: 'tag-2-1', postId: post2.id, productId: product3.id, xPosition: 50, yPosition: 50,
      },
    }),
    // Post 3 のタグ
    prisma.tag.upsert({
      where: { id: 'tag-3-1' }, update: {}, create: {
        id: 'tag-3-1', postId: post3.id, productId: product1.id, xPosition: 20, yPosition: 30,
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-3-2' }, update: {}, create: {
        id: 'tag-3-2', postId: post3.id, productId: product2.id, xPosition: 50, yPosition: 50,
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-3-3' }, update: {}, create: {
        id: 'tag-3-3', postId: post3.id, productId: product3.id, xPosition: 80, yPosition: 70,
      },
    }),
  ]);
  console.log(`${tags.length}個のタグを作成しました`);


  console.log('✅ シード処理が完了しました');
}

main()
  .catch((e) => {
    console.error('シード処理中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
