import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/supabase-storage';
// TODO: Import generated Supabase types if available

// ブランド一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const limit = Number(searchParams.get('limit') || '50');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const from = skip;
    const to = skip + limit - 1;

    // クエリを構築
    let query = supabase
      .from('Brand') // Revert to PascalCase
      .select('*', { count: 'exact' }) // Fetch all fields and count
      .order('name', { ascending: true })
      .range(from, to);

    // クエリパラメータに基づいてフィルタリング
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }

    // クエリを実行
    const { data: brands, error, count: total } = await query;

    if (error) {
      console.error('Error fetching brands:', error);
      return NextResponse.json(
        { error: 'ブランド一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    const totalCount = total ?? 0;

    return NextResponse.json({
      brands: brands || [],
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    // Keep existing error handling
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'ブランド一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しいブランドを作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    await requireAuth();
    
    // リクエストボディを取得
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const logo = formData.get('logo') as File | null;
    
    // バリデーション
    if (!name) {
      return NextResponse.json(
        { error: 'ブランド名は必須です' },
        { status: 400 }
      );
    }

    // 同名のブランドが存在するか確認
    const { data: existingBrandData, error: checkError } = await supabase
      .from('Brand') // Revert to PascalCase
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing brand:", checkError);
      return NextResponse.json({ error: 'ブランド存在確認中にエラーが発生しました' }, { status: 500 });
    }
    if (existingBrandData) {
      return NextResponse.json(
        { error: '同名のブランドが既に存在します' },
        { status: 400 }
      );
    }

    // ロゴをアップロード（存在する場合）
    let logoUrl: string | null = null; // Explicitly type
    if (logo) {
      const uploadResult = await uploadImage(logo, 'brands');
      
      if ('error' in uploadResult) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 500 }
        );
      }
      
      logoUrl = uploadResult.url;
    }

    // ブランドを作成
    const { data: newBrand, error: insertError } = await supabase
      .from('Brand') // Revert to PascalCase
      .insert({
        name,
        logoUrl: logoUrl, // Revert to camelCase
      })
      .select() // Select the created brand data
      .single(); // Expect a single row

    if (insertError) {
       // Handle potential unique constraint violation for name
       if (insertError.code === '23505') { 
         return NextResponse.json(
           { error: '同名のブランドが既に存在します' },
           { status: 400 }
         );
       }
      console.error('Error creating brand:', insertError);
      return NextResponse.json({ error: 'ブランドの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(newBrand);
  } catch (error) {
    // Keep existing error handling
    console.error('Error creating brand:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'ブランドの作成に失敗しました' },
      { status: 500 }
    );
  }
}
