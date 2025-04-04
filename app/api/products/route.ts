import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/supabase-storage';
// TODO: Import generated Supabase types if available

// 製品一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const limit = Number(searchParams.get('limit') || '20');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const from = skip;
    const to = skip + limit - 1;

    // クエリを構築
    let query = supabase
      .from('Product') // Revert to PascalCase
      .select(`
        *,
        Brand (*),
        Category (*)
      `, { count: 'exact' }) // Fetch count simultaneously
      .order('createdAt', { ascending: false }) // Revert to camelCase
      .range(from, to);

    // クエリパラメータに基づいてフィルタリング
    if (name) {
      // Use ilike for case-insensitive search (column name likely still 'name')
      query = query.ilike('name', `%${name}%`); 
    }
    if (brandId) {
      // Revert to camelCase foreign key
      query = query.eq('brandId', brandId); 
    }
    if (categoryId) {
      // Revert to camelCase foreign key
      query = query.eq('categoryId', categoryId); 
    }

    // クエリを実行
    const { data: products, error, count: total } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: '製品一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Ensure total is not null (though 'exact' count should guarantee it)
    const totalCount = total ?? 0;

    return NextResponse.json({
      products: products || [], // Return empty array if null
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
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
    await requireAuth();
    
    // リクエストボディを取得
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const brandId = formData.get('brandId') as string;
    const categoryId = formData.get('categoryId') as string;
    const image = formData.get('image') as File | null;
    
    // バリデーション
    if (!name || !brandId || !categoryId) {
      return NextResponse.json(
        { error: '製品名、ブランド、カテゴリーは必須です' },
        { status: 400 }
      );
    }

    // ブランドが存在するか確認
    const { data: brandData, error: brandError } = await supabase
      .from('Brand') // Revert to PascalCase
      .select('id')
      .eq('id', brandId)
      .maybeSingle(); // Returns null if not found, doesn't throw error

    if (brandError) {
      console.error('Error checking brand:', brandError);
      return NextResponse.json({ error: 'ブランド確認中にエラーが発生しました' }, { status: 500 });
    }
    if (!brandData) {
      return NextResponse.json(
        { error: '指定されたブランドが見つかりません' },
        { status: 404 }
      );
    }

    // カテゴリーが存在するか確認
    const { data: categoryData, error: categoryError } = await supabase
      .from('Category') // Revert to PascalCase
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();

    if (categoryError) {
      console.error('Error checking category:', categoryError);
      return NextResponse.json({ error: 'カテゴリー確認中にエラーが発生しました' }, { status: 500 });
    }
    if (!categoryData) {
      return NextResponse.json(
        { error: '指定されたカテゴリーが見つかりません' },
        { status: 404 }
      );
    }

    // 画像をアップロード（存在する場合）
    let imageUrl: string | null = null; // Explicitly type imageUrl
    if (image) {
      const uploadResult = await uploadImage(image, 'products');
      
      if ('error' in uploadResult) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 500 }
        );
      }
      
      imageUrl = uploadResult.url;
    }

    // 製品を作成
    const { data: newProduct, error: insertError } = await supabase
      .from('Product') // Revert to PascalCase
      .insert({
        name,
        description,
        price,
        imageUrl: imageUrl, // Revert to camelCase
        brandId: brandId,   // Revert to camelCase
        categoryId: categoryId, // Revert to camelCase
      })
      .select(`
        *,
        Brand (*),
        Category (*)
      `) // Fetch the created product with relations
      .single(); // Expect a single row back

    if (insertError) {
      // Handle potential column name mismatch errors if needed
      console.error('Error creating product:', insertError);
      return NextResponse.json(
        { error: '製品の作成に失敗しました' },
        { status: 500 }
      );
    }

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
