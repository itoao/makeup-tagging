import supabase from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Product, ProductWithRelations } from '@/src/types/product';

/**
 * Supabaseから全商品を取得する関数 (ブランドとカテゴリ情報を含む)
 * @returns {Promise<{ data: Product[] | null; error: PostgrestError | null }>} 商品データの配列またはnull、エラーオブジェクト
 */
export const fetchProducts = async (): Promise<{ data: Product[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('Product') // Prismaモデル名 'Product' を使用 (Supabaseテーブル名が異なる場合は要調整)
    .select(`
      *,
      brand: Brand (*),
      category: Category (*)
    `);

  if (error) {
    console.error('Error fetching products:', error);
    return { data: null, error };
  }

  // Supabaseから取得したデータ (ProductWithRelations[]) を Product[] にキャスト可能か確認
  // brand と category がネストされたオブジェクトとして取得される想定
  // 型が一致しない場合はここでマッピング処理が必要
  const products: Product[] = data as ProductWithRelations[]; 

  return { data: products, error: null };
};

// 必要に応じて他の商品関連の関数 (fetchProductByIdなど) をここに追加
