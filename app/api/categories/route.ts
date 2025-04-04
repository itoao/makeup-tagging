import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase'; // Import Supabase client
import { requireAuth } from '@/lib/auth';
// TODO: Import generated Supabase types if available

// カテゴリー一覧を取得
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
      .from('Category') // Revert to PascalCase
      .select('*', { count: 'exact' }) // Fetch all fields and count
      .order('name', { ascending: true })
      .range(from, to);

    // クエリパラメータに基づいてフィルタリング
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }

    // クエリを実行
    const { data: categories, error, count: total } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'カテゴリー一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    const totalCount = total ?? 0;

    return NextResponse.json({
      categories: categories || [],
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    // Keep existing error handling
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'カテゴリー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しいカテゴリーを作成
export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    await requireAuth();
    
    // リクエストボディを取得
    const body = await req.json();
    const { name } = body;
    
    // バリデーション
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'カテゴリー名は必須です' },
        { status: 400 }
      );
    }

    // 同名のカテゴリーが存在するか確認
    const { data: existingCategoryData, error: checkError } = await supabase
      .from('Category') // Revert to PascalCase
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing category:", checkError);
      return NextResponse.json({ error: 'カテゴリー存在確認中にエラーが発生しました' }, { status: 500 });
    }
    if (existingCategoryData) {
      return NextResponse.json(
        { error: '同名のカテゴリーが既に存在します' },
        { status: 400 }
      );
    }

    // カテゴリーを作成
    const { data: newCategory, error: insertError } = await supabase
      .from('Category') // Revert to PascalCase
      .insert({ name })
      .select() // Select the created category data
      .single(); // Expect a single row

    if (insertError) {
       // Handle potential unique constraint violation for name
       if (insertError.code === '23505') { 
         return NextResponse.json(
           { error: '同名のカテゴリーが既に存在します' },
           { status: 400 }
         );
       }
      console.error('Error creating category:', insertError);
      return NextResponse.json({ error: 'カテゴリーの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(newCategory);
  } catch (error) {
    // Keep existing error handling
    console.error('Error creating category:', error);
    
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'カテゴリーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
