import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should handle false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-4 py-2', 'px-8');
      expect(result).toBe('py-2 px-8'); // tailwind-merge overrides px-4 with px-8
    });

    it('should handle arrays of classes', () => {
      const result = cn(['text-sm', 'font-bold'], 'text-lg');
      expect(result).toBe('font-bold text-lg'); // text-lg overrides text-sm
    });

    it('should handle object syntax', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'font-bold': true,
      });
      expect(result).toBe('text-red-500 font-bold');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'another-class');
      expect(result).toBe('base-class another-class');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'valid-class', '');
      expect(result).toBe('valid-class');
    });

    it('should deduplicate classes', () => {
      const result = cn('text-red-500', 'text-red-500', 'bg-blue-500');
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle complex tailwind merging', () => {
      const result = cn(
        'text-xs text-red-500 p-4',
        'text-sm text-blue-500 px-8'
      );
      expect(result).toBe('p-4 text-sm text-blue-500 px-8');
    });

    it('should preserve non-conflicting classes', () => {
      const result = cn(
        'rounded-lg shadow-md',
        'border border-gray-200',
        'hover:shadow-lg'
      );
      expect(result).toBe('rounded-lg shadow-md border border-gray-200 hover:shadow-lg');
    });

    it('should handle nested arrays', () => {
      const result = cn([
        'base',
        ['nested-1', 'nested-2'],
        'final'
      ]);
      expect(result).toBe('base nested-1 nested-2 final');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'string-class',
        ['array-class-1', 'array-class-2'],
        {
          'object-class-true': true,
          'object-class-false': false,
        },
        true && 'conditional-true',
        false && 'conditional-false'
      );
      expect(result).toBe('string-class array-class-1 array-class-2 object-class-true conditional-true');
    });
  });
});