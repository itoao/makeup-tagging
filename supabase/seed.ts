import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Supabase URLとキーを環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://doeoivuhqbnxkzmwjosz.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || ''
console.log(process.env)

// Supabaseクライアントを初期化
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🌱 Starting database seeding for Supabase...');

  try {
    // Wrap main logic in try-catch for better overall error handling
    // --- Drop all tables first ---
    // console.log('Dropping existing tables...');
    // // Drop order matters due to foreign keys. Start with tables referencing others.
    // const { error: dropFollowError } = await supabase.from('Follow').delete().neq('id', '0'); // Drop Follow first
    // if (dropFollowError) console.error('Error dropping Follow table:', dropFollowError);
    // const { error: dropTagError } = await supabase.from('Tag').delete().neq('id', '0');
    // if (dropTagError) console.error('Error dropping Tag table:', dropTagError);
    // const { error: dropPostError } = await supabase.from('Post').delete().neq('id', '0');
    // if (dropPostError) console.error('Error dropping Post table:', dropPostError);
    // const { error: dropProductError } = await supabase.from('Product').delete().neq('id', '0');
    // if (dropProductError) console.error('Error dropping Product table:', dropProductError);
    // const { error: dropUserError } = await supabase.from('User').delete().neq('id', '0');
    // if (dropUserError) console.error('Error dropping User table:', dropUserError);
    // const { error: dropBrandError } = await supabase.from('Brand').delete().neq('id', '0');
    // if (dropBrandError) console.error('Error dropping Brand table:', dropBrandError);
    // const { error: dropCategoryError } = await supabase.from('Category').delete().neq('id', '0');
    // if (dropCategoryError) console.error('Error dropping Category table:', dropCategoryError);
    // console.log('Existing data cleared successfully.');


    // --- Create Categories ---
    console.log('Creating categories...');
    const categoryData = [
      { name: 'ベースメイク' }, { name: 'アイメイク' }, { name: 'リップ' },
      { name: 'チーク' }, { name: 'ハイライト' }, { name: 'コントゥアリング' },
      { name: 'アイブロウ' }, { name: 'スキンケア' },
    ];
    const categoryUpsertPromises = categoryData.map(cat =>
      supabase.from('Category').upsert(cat, { onConflict: 'name' })
    );
    const categoryResults = await Promise.all(categoryUpsertPromises);
    categoryResults.forEach((result, index) => {
        if (result.error) console.error(`Error upserting category "${categoryData[index].name}":`, result.error);
    });
    const { data: categories, error: catFetchError } = await supabase.from('Category').select('id, name').in('name', categoryData.map(c => c.name));
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
    const brandUpsertPromises = brandData.map(brand =>
      supabase.from('Brand').upsert(brand, { onConflict: 'name' })
    );
    const brandResults = await Promise.all(brandUpsertPromises);
    brandResults.forEach((result, index) => {
        if (result.error) console.error(`Error upserting brand "${brandData[index].name}":`, result.error);
    });
    const { data: brands, error: brandFetchError } = await supabase.from('Brand').select('id, name').in('name', brandData.map(b => b.name));
     if (brandFetchError || !brands) {
        console.error("Failed to fetch brands after seeding:", brandFetchError);
        throw new Error("Brand fetching failed after seeding.");
    }
    console.log(`${brands.length} brands processed.`);

    // --- Create Users --- // Modified to create two users
    console.log('Creating users...');
    const userData1 = {
      id: 'seed-user-id', // Fixed ID for the first seed user
      username: 'seeduser',
      name: 'Seed User',
      email: 'seed@example.com',
      image: '/placeholder-user.jpg',
    };
    const userData2 = {
      id: 'another-user-id', // Fixed ID for the second seed user
      username: 'anotheruser',
      name: 'Another User',
      email: 'another@example.com',
      image: '/placeholder-user.jpg',
    };

    const userUpsertPromises = [userData1, userData2].map(ud =>
      supabase.from('User').upsert(ud) // Use PascalCase table name
    );
    const userResults = await Promise.all(userUpsertPromises);
    userResults.forEach((result, index) => {
        if (result.error) {
            console.error(`Error upserting user ${index + 1}:`, result.error);
            // Decide if you want to throw here
        }
    });
    // Store user IDs for follow seeding
    const user1Id = userData1.id;
    const user2Id = userData2.id;
    console.log(`Users "${userData1.username}" and "${userData2.username}" processed.`);


    // --- Create Products ---
    console.log('Creating products...');
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
      { id: 'product-1', name: 'マキアージュ ドラマティックスキンセンサーベース UV', description: '肌悩みに合わせて色や質感が変化するベース', price: 3300, brandId: shiseidoBrand.id, categoryId: baseCategory.id, imageUrl: '/マキアージュuv.jpg' },
      { id: 'product-2', name: 'ラッシュエキスパート（ウォータープルーフ）', description: '繊維入りマスカラ', price: 1650, brandId: kateBrand.id, categoryId: eyeCategory.id, imageUrl: '/ラッシュエキスパート.jpg' },
      { id: 'product-3', name: 'リップモンスター', description: '落ちにくいティントリップ', price: 1650, brandId: operaBrand.id, categoryId: lipCategory.id, imageUrl: '/リップモンスター.jpg' },
    ];
    const productUpsertPromises = productData.map(prod =>
        supabase.from('Product').upsert(prod)
    );
    const productResults = await Promise.all(productUpsertPromises);
     productResults.forEach((result, index) => {
        if (result.error) console.error(`Error upserting product "${productData[index].name}":`, result.error);
    });
    const products = productData;
    console.log(`${products.length} products processed.`);


    // --- Create Posts ---
    console.log('Creating posts...');
    if (!user1Id) { // Check if user1Id exists
        throw new Error("Cannot create posts: missing user data.");
    }
     const postData = [
      { id: 'post-1', title: '今日のメイク', userId: user1Id, imageUrl: '/face_1.jpg', description: '今日のメイク💄 マキアージュの下地とKATEのマスカラを使ってみました✨' },
      { id: 'post-2', title: 'リップモンスターレビュー', userId: user1Id, imageUrl: '/face_2.jpg', description: 'OPERAのリップモンスター、本当に落ちにくい！💋 色持ち最高です👍' },
      { id: 'post-3', title: '今日のフルメイク', userId: user1Id, imageUrl: '/face_3.jpg', description: 'フルメイク！今日の主役はリップモンスター💄✨' },
    ];
    const postUpsertPromises = postData.map(post =>
        supabase.from('Post').upsert(post)
    );
    const postResults = await Promise.all(postUpsertPromises);
    postResults.forEach((result, index) => {
        if (result.error) console.error(`Error upserting post "${postData[index].title}":`, result.error);
    });
    const posts = postData;
    console.log(`${posts.length} posts processed.`);


    // --- Create Tags ---
    console.log('Creating tags...');
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
      { id: 'tag-1-1', postId: post1.id, productId: product1.id, xPosition: 30, yPosition: 40 },
      { id: 'tag-1-2', postId: post1.id, productId: product2.id, xPosition: 70, yPosition: 60 },
      { id: 'tag-2-1', postId: post2.id, productId: product3.id, xPosition: 50, yPosition: 50 },
      { id: 'tag-3-1', postId: post3.id, productId: product1.id, xPosition: 20, yPosition: 30 },
      { id: 'tag-3-2', postId: post3.id, productId: product2.id, xPosition: 50, yPosition: 50 },
      { id: 'tag-3-3', postId: post3.id, productId: product3.id, xPosition: 80, yPosition: 70 },
    ];
     const tagUpsertPromises = tagData.map(tag =>
        supabase.from('Tag').upsert(tag)
    );
    const tagResults = await Promise.all(tagUpsertPromises);
    tagResults.forEach((result, index) => {
        if (result.error) console.error(`Error upserting tag "${tagData[index].id}":`, result.error);
    });
    console.log(`${tagData.length} tags processed.`);

    // --- Create Follows --- // New section added
    console.log('Creating follows...');
    // Ensure user IDs are available
    if (!user1Id || !user2Id) {
        throw new Error("Cannot create follows: missing user IDs.");
    }
    const followData = [
      { followerId: user1Id, followingId: user2Id }, // seeduser follows anotheruser
      // Add more follow relationships if needed
      // { followerId: user2Id, followingId: user1Id }, // anotheruser follows seeduser
    ];

    // Use insert for follows, handle conflicts if necessary
    const { error: followInsertError } = await supabase
      .from('Follow') // Use PascalCase table name
      .insert(followData, { /* upsert: false is default */ }); 

    if (followInsertError) {
        // Check if it's a unique constraint violation (already followed)
        if (followInsertError.code === '23505') { 
            console.warn('Follow relationship already exists, skipping insertion.');
        } else {
            console.error('Error inserting follow data:', followInsertError);
            // Decide if you want to throw here
        }
    } else {
    console.log(`${followData.length} follow relationships processed.`);
  }

  // --- Create Likes --- // New section added
  console.log('Creating likes...');
  // Ensure users and posts exist
  if (!user1Id || !user2Id || !posts || posts.length === 0) {
      throw new Error("Cannot create likes: missing user or post data.");
  }
  // Use existing post1, post2 variables declared in Create Tags section
  // const post1 = posts.find(p => p.id === 'post-1')!; // Remove duplicate declaration
  // const post2 = posts.find(p => p.id === 'post-2')!; // Remove duplicate declaration
  const likeData = [
      { userId: user1Id, postId: post2.id }, // seeduser likes post-2
      { userId: user2Id, postId: post1.id }, // anotheruser likes post-1
      { userId: user2Id, postId: post2.id }, // anotheruser likes post-2
  ];
  const { error: likeInsertError } = await supabase
      .from('Like') // Use PascalCase table name
      .insert(likeData);
  if (likeInsertError) {
      if (likeInsertError.code === '23505') {
          console.warn('Like relationship already exists, skipping insertion.');
      } else {
          console.error('Error inserting like data:', likeInsertError);
      }
  } else {
      console.log(`${likeData.length} likes processed.`);
  }

  // --- Create Comments --- // New section added
  console.log('Creating comments...');
  // Ensure users and posts exist
  if (!user1Id || !user2Id || !posts || posts.length === 0) {
      throw new Error("Cannot create comments: missing user or post data.");
  }
  // Use existing post1, post2 variables declared in Create Tags section
  const commentData = [
      { userId: user2Id, postId: post1.id, content: '素敵なメイクですね！参考になります✨' },
      { userId: user1Id, postId: post1.id, content: 'ありがとうございます！嬉しいです😊' },
      { userId: user2Id, postId: post2.id, content: 'リップモンスター気になってました！買ってみます💄' },
  ];
  const { error: commentInsertError } = await supabase
      .from('Comment') // Use PascalCase table name
      .insert(commentData);
  if (commentInsertError) {
      console.error('Error inserting comment data:', commentInsertError);
  } else {
      console.log(`${commentData.length} comments processed.`);
  }

  // --- Create Saves --- // New section added
  console.log('Creating saves...');
  // Ensure users and posts exist
  if (!user1Id || !user2Id || !posts || posts.length === 0) {
      throw new Error("Cannot create saves: missing user or post data.");
  }
  // Use existing post variables
  const saveData = [
      { userId: user1Id, postId: post3.id }, // seeduser saves post-3
      { userId: user2Id, postId: post1.id }, // anotheruser saves post-1
  ];
  const { error: saveInsertError } = await supabase
      .from('Save') // Use PascalCase table name
      .insert(saveData);
  if (saveInsertError) {
      if (saveInsertError.code === '23505') {
          console.warn('Save relationship already exists, skipping insertion.');
      } else {
          console.error('Error inserting save data:', saveInsertError);
      }
  } else {
      console.log(`${saveData.length} saves processed.`);
  }


  console.log('✅ Seeding finished successfully.');

  } catch (e) { // Catch block for the main try
    console.error('Error during seeding process:', e);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // No disconnect needed for Supabase client
    console.log('Seeding script finished.');
  });
