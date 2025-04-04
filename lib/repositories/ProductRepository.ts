import supabase from '../supabase';
import type { PostgrestError } from '@supabase/supabase-js';
// Import only the existing Product type
import type { Product } from '@/src/types/product';

/**
 * Supabaseから全商品を取得する関数 (ブランドとカテゴリ情報を含む)
 * @returns {Promise<{ data: Product[] | null; error: PostgrestError | null }>} 商品データの配列またはnull、エラーオブジェクト
 */
export const fetchProducts = async (): Promise<{ data: Product[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('Product')
    .select(`
      id, 
      name, 
      description, 
      price, 
      brandId,  
      categoryId, 
      imageUrl, 
      created_at, 
      updated_at,
      brand: Brand (id, name),
      category: Category (id, name)
    `); // Use correct column names (camelCase for FKs, snake_case for timestamps)

  if (error) {
    console.error('Error fetching products:', error);
    return { data: null, error };
  }

  // Map the data explicitly to the Product type
  const products: Product[] = data.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    brandId: item.brandId,
    categoryId: item.categoryId,
    imageUrl: item.imageUrl,
    created_at: item.created_at,
    updated_at: item.updated_at,
    // Handle potential array for brand/category due to Supabase typing quirks
    brand: Array.isArray(item.brand) ? item.brand[0] ?? null : item.brand ?? null,
    category: Array.isArray(item.category) ? item.category[0] ?? null : item.category ?? null,
  }));


  return { data: products, error: null };
};

// 必要に応じて他の商品関連の関数 (fetchProductByIdなど) をここに追加
