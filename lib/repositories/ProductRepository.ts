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
    .from('Product') // Revert to PascalCase table name
    .select(`
      *,
      Brand (*), 
      Category (*) 
    `);
    // Assuming relation names match PascalCase model names

  if (error) {
    console.error('Error fetching products:', error);
    return { data: null, error };
  }

  // TODO: Replace this assertion with proper type mapping or use generated Supabase types.
  // The fetched data structure from Supabase needs to align with the Product type definition.
  // Ensure the select query (`Brand (*), Category (*)`) correctly populates `brand` and `category` fields in the Product type.
  const products: Product[] = data as Product[]; // Use Product type for assertion

  return { data: products, error: null };
};

// 必要に応じて他の商品関連の関数 (fetchProductByIdなど) をここに追加
