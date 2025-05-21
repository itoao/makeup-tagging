import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conflicting class names with tailwind-merge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle conditional class names with clsx', () => {
    expect(cn('base', { 'conditional-class': true, 'another-class': false })).toBe('base conditional-class');
    expect(cn({ 'conditional-class': true, 'another-class': true })).toBe('conditional-class another-class');
  });

  it('should handle mixed arguments (strings, objects, arrays)', () => {
    expect(cn('p-4', ['m-2', 'rounded'], { 'hover:bg-gray-200': true })).toBe('p-4 m-2 rounded hover:bg-gray-200');
  });

  it('should handle empty, null, and undefined inputs gracefully', () => {
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
    expect(cn('text-red-500', null, 'p-4', undefined, { 'hover:bg-blue-500': true })).toBe('text-red-500 p-4 hover:bg-blue-500');
    expect(cn(null, undefined, '', [])).toBe('');
  });

  it('should handle complex tailwind-merge scenarios', () => {
    expect(cn('px-2 py-1 bg-red hover:bg-dark-red', 'p-3 bg-[#B91C1C]')).toBe('hover:bg-dark-red p-3 bg-[#B91C1C]');
  });

  it('should handle conditional classes with falsy values correctly', () => {
    expect(cn({ 'class-a': true, 'class-b': false, 'class-c': null, 'class-d': undefined })).toBe('class-a');
  });

  it('should handle arrays of conditional classes', () => {
    expect(cn(['foo', { bar: true, duck: false }], 'baz', { quux: true })).toBe('foo bar baz quux');
  });
});
