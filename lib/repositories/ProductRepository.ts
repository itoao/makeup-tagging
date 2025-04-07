import supabase from '@/lib/supabase'; // Corrected import path
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/src/types/supabase'; // Import generated types
import type { Product, Brand, Category } from '@/src/types/product'; // Import application types

// Define types using generated Database types
type ProductRow = Database['public']['Tables']['Product']['Row'];
type BrandRow = Database['public']['Tables']['Brand']['Row'];
type CategoryRow = Database['public']['Tables']['Category']['Row'];

// Type for the select query result
type ProductWithRelations = ProductRow & {
  brand: Pick<BrandRow, 'id' | 'name'> | null;
  category: Pick<CategoryRow, 'id' | 'name'> | null;
};

// Helper function to map Supabase row to our Product type
const mapSupabaseRowToProductType = (p: ProductWithRelations): Product => {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    brandId: p.brandId, // Keep FKs if needed by Product type
    categoryId: p.categoryId, // Keep FKs if needed by Product type
    brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    created_at: p.created_at, // Keep timestamps if needed
    updated_at: p.updated_at, // Keep timestamps if needed
  };
};


/**
 * Supabaseから全商品を取得する関数 (ブランドとカテゴリ情報を含む)
 * @returns {Promise<{ products: Product[]; error: Error | null }>} 商品データの配列またはnull、エラーオブジェクト
 */
export const fetchProducts = async (): Promise<{ products: Product[]; error: Error | null }> => {
  // Define the select statement matching ProductWithRelations
  const selectStatement = `
      id,
      name,
      description,
      price,
      brandId,
      categoryId,
      imageUrl,
      created_at,
      updated_at,
      brand:Brand (id, name),
      category:Category (id, name)
    `;

  // Use type parameter with the query
  const { data, error } = await supabase
    .from('Product')
    .select<string, ProductWithRelations>(selectStatement); // Use type parameter

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], error: new Error(error.message) };
  }

  // Data should be typed as ProductWithRelations[] | null
  const products: Product[] = data?.map(mapSupabaseRowToProductType) || [];

  return { products, error: null };
};

// 必要に応じて他の商品関連の関数 (fetchProductByIdなど) をここに追加
