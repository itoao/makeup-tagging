import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/supabase-storage';
// Import repository functions
import { fetchProducts, createProduct } from '@/lib/repositories/ProductRepository'; // Add createProduct
// Import application types if needed for response structure
import type { PaginatedProducts } from '@/src/types/product';

// 製品一覧を取得
export async function GET(req: NextRequest) {
  try {
    // Note: Pagination and filtering logic should ideally move to the repository
    // For now, keep it here to demonstrate API route using the repository
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name'); // Keep filtering params for now
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const limit = Number(searchParams.get('limit') || '20');
    const page = Number(searchParams.get('page') || '1');

    console.log(`[API /products] Calling repository to fetch products with options:`, { page, limit, name, brandId, categoryId });

    // Call the repository function with options
    const { products, total, error } = await fetchProducts({
      page,
      limit,
      name,
      brandId,
      categoryId,
    });

    if (error) {
      console.error('[API /products] Error from repository:', error.message);
      return NextResponse.json(
        { error: '製品一覧の取得に失敗しました (repository error)', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API /products] Received ${products.length} products from repository.`);

    // Use the total count returned by the repository for pagination
    return NextResponse.json({
      products: products,
      pagination: {
        total: total, // Use total from repository
        page,
        limit,
        pages: Math.ceil(total / limit), // Calculate pages correctly
      },
    });

  } catch (error) {
    // Keep existing error handling structure
    if (error instanceof Error) {
      console.error('Error fetching products:', error.message, error.stack);
    } else {
      console.error('Error fetching products (unknown type):', error);
    }
    return NextResponse.json(
      { error: '製品一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しい製品を作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const userId = await requireAuth(); // Get user ID for potential future use (e.g., logging)

    // リクエストボディを取得
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const brandId = formData.get('brandId') as string;
    const categoryId = formData.get('categoryId') as string;
    const image = formData.get('image') as File | null;

    // --- Basic Input Validation ---
    if (!name || !brandId || !categoryId) {
      return NextResponse.json(
        { error: '製品名、ブランド、カテゴリーは必須です' },
        { status: 400 }
      );
    }

    // --- Image Upload (if provided) ---
    let imageUrl: string | null = null;
    if (image) {
      const uploadResult = await uploadImage(image, 'products');
      if ('error' in uploadResult) {
        return NextResponse.json({ error: uploadResult.error }, { status: 500 });
      }
      imageUrl = uploadResult.url;
    }

    // --- Call Repository to Create Product ---
    // Note: Brand/Category existence checks are currently not in the repository
    // They remain here for now, but could be moved.
     // ブランドが存在するか確認 (Keep check here for now)
     const { data: brandData, error: brandError } = await supabase
       .from('Brand')
       .select('id')
       .eq('id', brandId)
       .maybeSingle();

     if (brandError) {
       console.error('Error checking brand:', brandError);
       return NextResponse.json({ error: 'ブランド確認中にエラーが発生しました' }, { status: 500 });
     }
     if (!brandData) {
       return NextResponse.json({ error: '指定されたブランドが見つかりません' }, { status: 404 });
     }

     // カテゴリーが存在するか確認 (Keep check here for now)
     const { data: categoryData, error: categoryError } = await supabase
       .from('Category')
       .select('id')
       .eq('id', categoryId)
       .maybeSingle();

     if (categoryError) {
       console.error('Error checking category:', categoryError);
       return NextResponse.json({ error: 'カテゴリー確認中にエラーが発生しました' }, { status: 500 });
     }
     if (!categoryData) {
       return NextResponse.json({ error: '指定されたカテゴリーが見つかりません' }, { status: 404 });
     }
     // End of existence checks (kept in API route for now)

    console.log(`[API /products] Calling repository to create product`);
    const { product: newProduct, error: createError } = await createProduct(
      {
        name,
        description,
        price,
        brandId,
        categoryId,
      },
      imageUrl // Pass the potentially null image URL
    );

    if (createError || !newProduct) {
      console.error('[API /products] Error from createProduct repository:', createError?.message);
      return NextResponse.json(
        { error: '製品の作成に失敗しました (repository error)', details: createError?.message },
        { status: 500 }
      );
    }

    console.log(`[API /products] Successfully created product ID: ${newProduct.id} via repository.`);

    // Return the product data received from the repository
    // Note: Currently returns raw Supabase data due to temporary mapping disablement
    return NextResponse.json(newProduct);
  } catch (error) {
    // Keep existing error handling structure
    console.error('Error creating product:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '製品の作成に失敗しました' },
      { status: 500 }
    );
  }
}
