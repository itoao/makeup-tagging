/**
 * Supabaseストレージ機能のユニットテスト
 * 画像のアップロードと削除機能のテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImage, deleteImage } from './supabase-storage';

// Supabaseクライアントをモック
vi.mock('./supabase', () => ({
  default: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
      })),
    },
  },
}));

import supabase from './supabase';

describe('supabase-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockStorageFrom = vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' }
        }),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await uploadImage(mockFile);

      expect(result).toEqual({ url: 'https://example.com/test.jpg' });
      expect(mockStorageFrom).toHaveBeenCalledWith('images');
    });

    it('should handle upload error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockStorageFrom = vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ 
          error: { message: 'Upload failed' } 
        }),
        getPublicUrl: vi.fn(),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await uploadImage(mockFile);

      expect(result).toEqual({ error: 'Upload failed' });
    });

    it('should handle exception during upload', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockStorageFrom = vi.fn(() => ({
        upload: vi.fn().mockRejectedValue(new Error('Network error')),
        getPublicUrl: vi.fn(),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await uploadImage(mockFile);

      expect(result).toEqual({ error: 'ファイルのアップロードに失敗しました' });
    });

    it('should use custom bucket and path', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockStorageFrom = vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/custom/test.png' }
        }),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await uploadImage(mockFile, 'custom-bucket', 'custom/path');

      expect(result).toEqual({ url: 'https://example.com/custom/test.png' });
      expect(mockStorageFrom).toHaveBeenCalledWith('custom-bucket');
    });

    it('should generate unique filename', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockStorageFrom = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' }
        }),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      await uploadImage(mockFile);

      expect(mockUpload).toHaveBeenCalledWith(
        '1234567890-h.jpg',
        mockFile
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const mockUrl = 'https://example.com/storage/v1/object/public/images/test.jpg';
      const mockStorageFrom = vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await deleteImage(mockUrl);

      expect(result).toEqual({ success: true });
      expect(mockStorageFrom).toHaveBeenCalledWith('images');
    });

    it('should handle delete error', async () => {
      const mockUrl = 'https://example.com/storage/v1/object/public/images/test.jpg';
      const mockStorageFrom = vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ 
          error: { message: 'Delete failed' } 
        }),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await deleteImage(mockUrl);

      expect(result).toEqual({ error: 'Delete failed' });
    });

    it('should handle invalid URL', async () => {
      const mockUrl = 'https://invalid-url.com/test.jpg';

      const result = await deleteImage(mockUrl);

      expect(result).toEqual({ error: '無効な画像URLです' });
    });

    it('should handle exception during delete', async () => {
      const mockUrl = 'https://example.com/storage/v1/object/public/images/test.jpg';
      const mockStorageFrom = vi.fn(() => ({
        remove: vi.fn().mockRejectedValue(new Error('Network error')),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await deleteImage(mockUrl);

      expect(result).toEqual({ error: '画像の削除に失敗しました' });
    });

    it('should use custom bucket', async () => {
      const mockUrl = 'https://example.com/storage/v1/object/public/custom-bucket/test.jpg';
      const mockStorageFrom = vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      const result = await deleteImage(mockUrl, 'custom-bucket');

      expect(result).toEqual({ success: true });
      expect(mockStorageFrom).toHaveBeenCalledWith('custom-bucket');
    });

    it('should extract correct path from URL', async () => {
      const mockUrl = 'https://example.com/storage/v1/object/public/images/folder/test.jpg';
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockStorageFrom = vi.fn(() => ({
        remove: mockRemove,
      }));
      
      (supabase.storage.from as any) = mockStorageFrom;

      await deleteImage(mockUrl);

      expect(mockRemove).toHaveBeenCalledWith(['folder/test.jpg']);
    });
  });
});