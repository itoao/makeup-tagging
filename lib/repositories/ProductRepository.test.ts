import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProducts, createProduct } from './ProductRepository';
import type { Product } from '@/src/types/product';

// Mock the supabase module
vi.mock('@/lib/supabase', () => {
  const mockQuery = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
  };

  // Make each method return the query object for chaining
  Object.keys(mockQuery).forEach(key => {
    mockQuery[key as keyof typeof mockQuery].mockReturnValue(mockQuery);
  });

  return { 
    default: mockQuery
  };
});

// Import the mocked supabase client after vi.mock
import supabase from '@/lib/supabase';
const mockSupabaseClient = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

// Test helper functions
const createMockProductData = (id: string, name: string, price: number) => ({
  id,
  name,
  description: 'Test product description',
  price,
  imageUrl: 'https://example.com/product.jpg',
  brandId: 'brand-123',
  categoryId: 'category-456',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  brand: { id: 'brand-123', name: 'Test Brand' },
  category: { id: 'category-456', name: 'Test Category' },
});

const createExpectedProduct = (productData: ReturnType<typeof createMockProductData>): Product => ({
  id: productData.id,
  name: productData.name,
  description: productData.description,
  price: productData.price,
  imageUrl: productData.imageUrl,
  brandId: productData.brandId,
  categoryId: productData.categoryId,
  brand: productData.brand,
  category: productData.category,
  created_at: productData.created_at,
  updated_at: productData.updated_at,
});

describe('ProductRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to return the query object for chaining
    Object.keys(mockSupabaseClient).forEach(key => {
      const method = mockSupabaseClient[key as keyof typeof mockSupabaseClient];
      if (typeof method.mockReturnValue === 'function') {
        method.mockReturnValue(mockSupabaseClient);
      }
    });

    // Set default resolved values for async methods
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.range.mockResolvedValue({ data: [], error: null, count: 0 });
  });

  describe('fetchProducts', () => {
    const mockProducts = [
      createMockProductData('product-1', 'Product 1', 1000),
      createMockProductData('product-2', 'Product 2', 2000),
    ];

    it('should fetch products with default pagination', async () => {
      const mockResponse = { data: mockProducts, error: null, count: 2 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(result.error).toBeNull();
      expect(result.total).toBe(2);
      expect(result.products).toHaveLength(2);
      expect(result.products[0]).toEqual(createExpectedProduct(mockProducts[0]));
      expect(result.products[1]).toEqual(createExpectedProduct(mockProducts[1]));

      // Verify query chain
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Product');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.any(String), { count: 'exact' });
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 19); // Default: page 1, limit 20
    });

    it('should fetch products with custom pagination', async () => {
      const mockResponse = { data: mockProducts, error: null, count: 50 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts({ page: 3, limit: 10 });

      expect(result.error).toBeNull();
      expect(result.total).toBe(50);
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(20, 29); // Page 3 with limit 10
    });

    it('should filter products by name', async () => {
      const mockResponse = { data: [mockProducts[0]], error: null, count: 1 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts({ name: 'Product 1' });

      expect(result.error).toBeNull();
      expect(result.products).toHaveLength(1);
      expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('name', '%Product 1%');
    });

    it('should filter products by brandId', async () => {
      const mockResponse = { data: mockProducts, error: null, count: 2 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts({ brandId: 'brand-123' });

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('brandId', 'brand-123');
    });

    it('should filter products by categoryId', async () => {
      const mockResponse = { data: mockProducts, error: null, count: 2 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts({ categoryId: 'category-456' });

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('categoryId', 'category-456');
    });

    it('should apply multiple filters', async () => {
      const mockResponse = { data: [mockProducts[0]], error: null, count: 1 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts({
        name: 'Product',
        brandId: 'brand-123',
        categoryId: 'category-456',
      });

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('name', '%Product%');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('brandId', 'brand-123');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('categoryId', 'category-456');
    });

    it('should handle empty results', async () => {
      const mockResponse = { data: [], error: null, count: 0 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(result.error).toBeNull();
      expect(result.total).toBe(0);
      expect(result.products).toEqual([]);
    });

    it('should handle null data', async () => {
      const mockResponse = { data: null, error: null, count: 0 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(result.error).toBeNull();
      expect(result.total).toBe(0);
      expect(result.products).toEqual([]);
    });

    it('should return error if Supabase fetch fails', async () => {
      const mockError = { message: 'Database error' };
      const mockResponse = { data: null, error: mockError, count: null };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(result.error).toEqual(new Error('Database error'));
      expect(result.total).toBe(0);
      expect(result.products).toEqual([]);
    });

    it('should handle null count in response', async () => {
      const mockResponse = { data: mockProducts, error: null, count: null };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(result.error).toBeNull();
      expect(result.total).toBe(0); // Defaults to 0 when count is null
      expect(result.products).toHaveLength(2);
    });

    it('should handle products without brand or category', async () => {
      const productWithoutRelations = {
        ...mockProducts[0],
        brand: null,
        category: null,
      };
      const mockResponse = { data: [productWithoutRelations], error: null, count: 1 };
      mockSupabaseClient.range.mockResolvedValue(mockResponse);

      const result = await fetchProducts();

      expect(result.error).toBeNull();
      expect(result.products[0].brand).toBeNull();
      expect(result.products[0].category).toBeNull();
    });
  });

  describe('createProduct', () => {
    const newProductData = {
      name: 'New Product',
      description: 'New product description',
      price: 1500,
      brandId: 'brand-123',
      categoryId: 'category-456',
    };

    const mockCreatedProduct = createMockProductData('new-product-id', newProductData.name, newProductData.price);

    it('should create a product successfully', async () => {
      // Mock insert response (returns only ID)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-product-id' },
        error: null,
      });

      // Mock fetch response (returns full product with relations)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockCreatedProduct,
        error: null,
      });

      const result = await createProduct(newProductData, 'https://example.com/new-product.jpg');

      expect(result.error).toBeNull();
      expect(result.product).toEqual(mockCreatedProduct);

      // Verify insert call
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Product');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        name: newProductData.name,
        description: newProductData.description,
        price: newProductData.price,
        brandId: newProductData.brandId,
        categoryId: newProductData.categoryId,
        imageUrl: 'https://example.com/new-product.jpg',
      });
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id');

      // Verify fetch call
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'new-product-id');
    });

    it('should create a product with null image URL', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-product-id' },
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...mockCreatedProduct, imageUrl: null },
        error: null,
      });

      const result = await createProduct(newProductData, null);

      expect(result.error).toBeNull();
      expect(result.product.imageUrl).toBeNull();
    });

    it('should return error if insert fails', async () => {
      const mockError = { message: 'Insert failed' };
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      const result = await createProduct(newProductData, null);

      expect(result.error).toEqual(new Error('Insert failed'));
      expect(result.product).toBeNull();
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should return error if insert returns no data', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await createProduct(newProductData, null);

      expect(result.error).toEqual(new Error('Failed to get created product ID.'));
      expect(result.product).toBeNull();
    });

    it('should return error if fetch after insert fails', async () => {
      // Insert succeeds
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-product-id' },
        error: null,
      });

      // Fetch fails
      const mockError = { message: 'Fetch failed' };
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      const result = await createProduct(newProductData, null);

      expect(result.error).toEqual(new Error('Fetch failed'));
      expect(result.product).toBeNull();
    });

    it('should return error if fetch returns no data', async () => {
      // Insert succeeds
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-product-id' },
        error: null,
      });

      // Fetch returns null data
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await createProduct(newProductData, null);

      expect(result.error).toEqual(new Error('Failed to fetch created product.'));
      expect(result.product).toBeNull();
    });

    it('should handle product data with null description and price', async () => {
      const productDataWithNulls = {
        ...newProductData,
        description: null,
        price: null,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-product-id' },
        error: null,
      });

      const mockProductWithNulls = {
        ...mockCreatedProduct,
        description: null,
        price: null,
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockProductWithNulls,
        error: null,
      });

      const result = await createProduct(productDataWithNulls, null);

      expect(result.error).toBeNull();
      expect(result.product.description).toBeNull();
      expect(result.product.price).toBeNull();
    });
  });
});