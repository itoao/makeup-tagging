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
      "brandId", 
      "categoryId", 
      "imageUrl", 
      created_at, 
      updated_at,
      brand: Brand (id, name),  // Select specific columns from Brand
      category: Category (id, name) // Select specific columns from Category
    `);

  if (error) {
    console.error('Error fetching products:', error);
    return { data: null, error };
  }

  // Type assertion: Assuming the fetched data structure now correctly matches the Product type
  // including the nested 'brand' and 'category' objects due to the corrected select query.
  // For robust applications, consider using Supabase generated types or Zod validation.
  const products: Product[] = data as Product[];

  return { data: products, error: null };
};

// 必要に応じて他の商品関連の関数 (fetchProductByIdなど) をここに追加
