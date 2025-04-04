import supabase from '../lib/supabase'; // Adjust import path relative to supabase/seed.ts
// Removed PostgrestSingleResponse import and handleUpsert helper

async function main() {
  console.log('🌱 Starting database seeding for Supabase...');

  try { // Wrap main logic in try-catch for better overall error handling
    // --- Create Categories ---
    console.log('Creating categories...');
  const categoryData = [
    { name: 'ベースメイク' },
    { name: 'アイメイク' },
    { name: 'リップ' },
    { name: 'チーク' },
    { name: 'ハイライト' },
    { name: 'コントゥアリング' },
    { name: 'アイブロウ' },
    { name: 'スキンケア' },
  ];
  // Directly map to upsert promises
  const categoryUpsertPromises = categoryData.map(cat => 
    supabase.from('Category').upsert(cat, { onConflict: 'name' }) // Revert to PascalCase
  );
  const categoryResults = await Promise.all(categoryUpsertPromises);
  // Check for errors after all promises settle
  categoryResults.forEach((result, index) => {
      if (result.error) {
          console.error(`Error upserting category "${categoryData[index].name}":`, result.error);
          // Decide if you want to throw here or just log
      }
  });
  // Fetch categories needed later
  const { data: categories, error: catFetchError } = await supabase.from('Category').select('id, name').in('name', categoryData.map(c => c.name)); // Revert to PascalCase
  if (catFetchError || !categories) {
      console.error("Failed to fetch categories after seeding:", catFetchError);
      throw new Error("Category fetching failed after seeding.");
  }
  console.log(`${categories.length} categories processed.`);


  // --- Create Brands ---
  console.log('Creating brands...');
  const brandData = [
    { name: 'SHISEIDO' }, { name: 'KATE' }, { name: 'CANMAKE' },
    { name: 'MAJOLICA MAJORCA' }, { name: 'OPERA' }, { name: 'CEZANNE' },
    { name: 'EXCEL' }, { name: 'INTEGRATE' }, { name: 'ADDICTION' },
    { name: 'SUQQU' },
  ];
   // Directly map to upsert promises
  const brandUpsertPromises = brandData.map(brand => 
    supabase.from('Brand').upsert(brand, { onConflict: 'name' }) // Revert to PascalCase
  );
  const brandResults = await Promise.all(brandUpsertPromises);
  brandResults.forEach((result, index) => {
      if (result.error) {
          console.error(`Error upserting brand "${brandData[index].name}":`, result.error);
      }
  });
  // Fetch brands needed later
  const { data: brands, error: brandFetchError } = await supabase.from('Brand').select('id, name').in('name', brandData.map(b => b.name)); // Revert to PascalCase
   if (brandFetchError || !brands) {
      console.error("Failed to fetch brands after seeding:", brandFetchError);
      throw new Error("Brand fetching failed after seeding.");
  }
  console.log(`${brands.length} brands processed.`);

  // --- Create User ---
  console.log('Creating user...');
  const userData = {
    id: 'seed-user-id', // Use a fixed ID for the seed user
    username: 'seeduser',
    name: 'Seed User',
    email: 'seed@example.com',
    image: '/placeholder-user.jpg', // Keep 'image' as Clerk provides it this way
  };
  const { error: userError } = await supabase.from('User').upsert(userData); // Revert to PascalCase
  if (userError) {
      console.error("Error upserting user:", userError);
      console.error("Error upserting user:", userError);
      // Check for specific errors if needed, e.g., unique constraint violation
      throw new Error("User seeding failed.");
  }
  const user = userData; // Use the input data as we don't need db return here
  console.log(`User "${user.username}" processed.`);


  // --- Create Products ---
  console.log('Creating products...');
  // Ensure categories and brands were fetched successfully before proceeding
  if (!categories || categories.length === 0 || !brands || brands.length === 0) {
      throw new Error("Cannot create products: missing category or brand data.");
  }
  const baseCategory = categories.find(c => c.name === 'ベースメイク')!;
  const eyeCategory = categories.find(c => c.name === 'アイメイク')!;
  const lipCategory = categories.find(c => c.name === 'リップ')!;

  const shiseidoBrand = brands.find(b => b.name === 'SHISEIDO')!;
  const kateBrand = brands.find(b => b.name === 'KATE')!;
  const operaBrand = brands.find(b => b.name === 'OPERA')!;

  const productData = [
    {
      id: 'product-1',
      name: 'マキアージュ ドラマティックスキンセンサーベース UV',
      description: '肌悩みに合わせて色や質感が変化するベース',
      price: 3300,
      brandId: shiseidoBrand.id, // Revert to camelCase
      categoryId: baseCategory.id, // Revert to camelCase
      imageUrl: '/マキアージュuv.jpg', // Revert to camelCase
    },
    {
      id: 'product-2',
      name: 'ラッシュエキスパート（ウォータープルーフ）',
      description: '繊維入りマスカラ',
      price: 1650,
      brandId: kateBrand.id, // Revert to camelCase
      categoryId: eyeCategory.id, // Revert to camelCase
      imageUrl: '/ラッシュエキスパート.jpg', // Revert to camelCase
    },
    {
      id: 'product-3',
      name: 'リップモンスター',
      description: '落ちにくいティントリップ',
      price: 1650,
      brandId: operaBrand.id, // Revert to camelCase
      categoryId: lipCategory.id, // Revert to camelCase
      imageUrl: '/リップモンスター.jpg', // Revert to camelCase
    },
  ];
  // Directly map to upsert promises
  const productUpsertPromises = productData.map(prod => 
      supabase.from('Product').upsert(prod) // Revert to PascalCase
  );
  const productResults = await Promise.all(productUpsertPromises);
   productResults.forEach((result, index) => {
      if (result.error) {
          console.error(`Error upserting product "${productData[index].name}":`, result.error);
      }
  });
  const products = productData; // Use input data
  console.log(`${products.length} products processed.`);


  // --- Create Posts ---
  console.log('Creating posts...');
  // Ensure user exists before creating posts
  if (!user) {
      throw new Error("Cannot create posts: missing user data.");
  }
   const postData = [
    {
      id: 'post-1',
      title: '今日のメイク',
      userId: user.id, // Revert to camelCase
      imageUrl: '/face_1.jpg', // Revert to camelCase
      description: '今日のメイク💄 マキアージュの下地とKATEのマスカラを使ってみました✨',
    },
    {
      id: 'post-2',
      title: 'リップモンスターレビュー',
      userId: user.id, // Revert to camelCase
      imageUrl: '/face_2.jpg', // Revert to camelCase
      description: 'OPERAのリップモンスター、本当に落ちにくい！💋 色持ち最高です👍',
    },
    {
      id: 'post-3',
      title: '今日のフルメイク',
      userId: user.id, // Revert to camelCase
      imageUrl: '/face_3.jpg', // Revert to camelCase
      description: 'フルメイク！今日の主役はリップモンスター💄✨',
    },
  ];
   // Directly map to upsert promises
  const postUpsertPromises = postData.map(post => 
      supabase.from('Post').upsert(post) // Revert to PascalCase
  );
  const postResults = await Promise.all(postUpsertPromises);
  postResults.forEach((result, index) => {
      if (result.error) {
          console.error(`Error upserting post "${postData[index].title}":`, result.error);
      }
  });
  const posts = postData; // Use input data
  console.log(`${posts.length} posts processed.`);


  // --- Create Tags ---
  console.log('Creating tags...');
   // Ensure posts and products exist before creating tags
   if (!posts || posts.length === 0 || !products || products.length === 0) {
      throw new Error("Cannot create tags: missing post or product data.");
  }
  const post1 = posts.find(p => p.id === 'post-1')!;
  const post2 = posts.find(p => p.id === 'post-2')!;
  const post3 = posts.find(p => p.id === 'post-3')!;
  const product1 = products.find(p => p.id === 'product-1')!;
  const product2 = products.find(p => p.id === 'product-2')!;
  const product3 = products.find(p => p.id === 'product-3')!;

  const tagData = [
    // Post 1 Tags
    { id: 'tag-1-1', postId: post1.id, productId: product1.id, xPosition: 30, yPosition: 40 }, // Revert to camelCase
    { id: 'tag-1-2', postId: post1.id, productId: product2.id, xPosition: 70, yPosition: 60 }, // Revert to camelCase
    // Post 2 Tags
    { id: 'tag-2-1', postId: post2.id, productId: product3.id, xPosition: 50, yPosition: 50 }, // Revert to camelCase
    // Post 3 Tags
    { id: 'tag-3-1', postId: post3.id, productId: product1.id, xPosition: 20, yPosition: 30 }, // Revert to camelCase
    { id: 'tag-3-2', postId: post3.id, productId: product2.id, xPosition: 50, yPosition: 50 }, // Revert to camelCase
    { id: 'tag-3-3', postId: post3.id, productId: product3.id, xPosition: 80, yPosition: 70 }, // Revert to camelCase
  ];
  // Directly map to upsert promises
   const tagUpsertPromises = tagData.map(tag => 
      supabase.from('Tag').upsert(tag) // Revert to PascalCase
  );
  const tagResults = await Promise.all(tagUpsertPromises);
  tagResults.forEach((result, index) => {
      if (result.error) {
          console.error(`Error upserting tag "${tagData[index].id}":`, result.error);
      }
  });
  console.log(`${tagData.length} tags processed.`);


  console.log('✅ Seeding finished successfully.');

  } catch (e) { // Catch block for the main try
    console.error('Error during seeding process:', e);
    process.exit(1);
  }
}

main()
  // Removed catch here as it's handled inside main
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // No disconnect needed for Supabase client
    console.log('Seeding script finished.');
  });
