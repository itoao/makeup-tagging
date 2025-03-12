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
