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
}
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
 * Supabaseから商品を取得する関数 (ブランドとカテゴリ情報を含む)
 * @param options - フィルタリングとページネーションのオプション
 * @returns {Promise<{ products: Product[]; total: number; error: Error | null }>} 商品データの配列、総件数、エラーオブジェクト
 */
export const fetchProducts = async (
  options: {
    page?: number;
    limit?: number;
    name?: string | null;
    brandId?: string | null;
    categoryId?: string | null;
  } = {} // Default to empty options object
): Promise<{ products: Product[]; total: number; error: Error | null }> => {
  const { page = 1, limit = 20, name, brandId, categoryId } = options; // Default limit
  const skip = (page - 1) * limit;
  const from = skip;
  const to = skip + limit - 1;

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

  // Build query with potential filters and pagination
  let query = supabase
    .from('Product')
    .select<string, ProductWithRelations>(selectStatement, { count: 'exact' }) // Fetch count
    .order('created_at', { ascending: false }) // Default sort
    .range(from, to);

  // Apply filters
  if (name) {
    query = query.ilike('name', `%${name}%`);
  }
  if (brandId) {
    query = query.eq('brandId', brandId);
  }
  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0, error: new Error(error.message) };
  }

  // Data should be typed as ProductWithRelations[] | null
  const products: Product[] = data?.map(mapSupabaseRowToProductType) || [];
  const totalCount = count ?? 0;

  return { products, total: totalCount, error: null };
};

/**
 * Creates a new product.
 * @param productData - Data for the new product (excluding image URL).
 * @param imageUrl - Optional URL of the uploaded image.
 * @returns The newly created product data (raw Supabase structure) or null if failed.
 */
export const createProduct = async (
  productData: {
    name: string;
    description: string | null;
    price: number | null;
    brandId: string;
    categoryId: string;
  },
  imageUrl: string | null
// Return type changed to reflect raw data return
): Promise<{ product: any | null; error: Error | null }> => {

  // TODO: Consider moving brand/category existence checks here from the API route
  // for better encapsulation, though it might involve extra DB calls.

  // Use generated types for insert data
  const insertData: Database['public']['Tables']['Product']['Insert'] = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    brandId: productData.brandId,
    categoryId: productData.categoryId,
     imageUrl: imageUrl,
   };

   // Step 1: Insert the product and select only the ID
  const { data: insertResult, error: insertError } = await supabase
    .from('Product')
    .insert(insertData)
    .select('id') // Select only the ID
    .single();

  if (insertError) {
    console.error('Error inserting product (repository):', insertError);
    return { product: null, error: new Error(insertError.message) };
  }

   if (!insertResult) {
     console.error('Insert operation did not return the new product ID.');
     return { product: null, error: new Error('Failed to get created product ID.') };
   }

   const newProductId = insertResult.id;

   // Step 2: Fetch the newly created product with relations using its ID
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
   const { data: fetchedProduct, error: fetchError } = await supabase
     .from('Product')
     .select<string, ProductWithRelations>(selectStatement) // Use the defined type
     .eq('id', newProductId)
     .single();

   if (fetchError) {
     console.error('Error fetching created product (repository):', fetchError);
     // Even if fetch fails, the product was created. Return null or handle differently?
     return { product: null, error: new Error(fetchError.message) };
   }

   if (!fetchedProduct) {
      console.error('Failed to fetch created product after insert (ID: ${newProductId}).');
      return { product: null, error: new Error('Failed to fetch created product.') };
   }

  // Step 3: Mapping is commented out again due to persistent type errors.
  /*
  const mappedProduct: Product = {
     id: fetchedProduct.id, // Error persists here
     name: fetchedProduct.name,
     description: fetchedProduct.description,
     price: fetchedProduct.price,
     imageUrl: fetchedProduct.imageUrl,
     brandId: fetchedProduct.brandId,
     categoryId: fetchedProduct.categoryId,
     brand: fetchedProduct.brand ? { id: fetchedProduct.brand.id, name: fetchedProduct.brand.name } : null,
     category: fetchedProduct.category ? { id: fetchedProduct.category.id, name: fetchedProduct.category.name } : null,
     created_at: fetchedProduct.created_at,
     updated_at: fetchedProduct.updated_at,
  };
  */

  console.warn('[ProductRepository] createProduct returning raw data due to persistent mapping type errors.');
  return { product: fetchedProduct as any, error: null }; // Return raw data (casted to any)
};


// 必要に応じて他の商品関連の関数 (fetchProductByIdなど) をここに追加
