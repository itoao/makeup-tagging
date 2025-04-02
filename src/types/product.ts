import type { Brand as PrismaBrand, Category as PrismaCategory, Product as PrismaProduct } from '@prisma/client';

// 表示に必要な最小限の Brand 型
export interface Brand extends Pick<PrismaBrand, 'id' | 'name'> {}

// 表示に必要な最小限の Category 型
export interface Category extends Pick<PrismaCategory, 'id' | 'name'> {}

// Product 型 (リレーションを含む)
export interface Product extends Omit<PrismaProduct, 'brandId' | 'categoryId'> {
  brand: Brand;
  category: Category;
}

// Supabase から取得する際の型 (リレーションを展開)
export interface ProductWithRelations extends PrismaProduct {
    brand: PrismaBrand;
    category: PrismaCategory;
}
