import { describe, expect, it } from 'vitest';
import {
  createUniqueSlug,
  formatBookmark,
  normalizeUrl,
  parseStoredBookmarks,
} from './bookmarks';

describe('normalizeUrl', () => {
  it('normalizes URLs with and without https:// to the same value', () => {
    expect(normalizeUrl('www.example.com')).toBe(normalizeUrl('https://www.example.com'));
  });
});

describe('createUniqueSlug', () => {
  it('generates a four-character base62 slug with the mona- prefix', () => {
    expect(createUniqueSlug([], () => new Uint8Array([7, 15, 20, 2]))).toBe('mona-7fk2');
  });
});

describe('parseStoredBookmarks', () => {
  it.each([
    ['empty storage', null],
    ['an empty string', ''],
    ['corrupted JSON', '{"url":'],
    ['a legacy array', '["https://www.example.com"]'],
    ['a non-array value', '{"url":"https://www.example.com/","slug":"mona-7fk2"}'],
  ])('recovers from %s', (_name, storedValue) => {
    expect(() => parseStoredBookmarks(storedValue)).not.toThrow();
    expect(parseStoredBookmarks(storedValue)).toEqual([]);
  });

  it('drops malformed entries while retaining valid bookmarks', () => {
    const validBookmark = {
      url: 'https://www.example.com/',
      slug: 'mona-7fk2',
    };
    const storedValue = JSON.stringify([
      validBookmark,
      { url: 'not a URL', slug: 'mona-abcd' },
      { url: validBookmark.url },
      null,
    ]);

    expect(parseStoredBookmarks(storedValue)).toEqual([validBookmark]);
  });
});

describe('formatBookmark', () => {
  it('uses the exact visible separator', () => {
    expect(formatBookmark({
      url: 'https://www.example.com/',
      slug: 'mona-7fk2',
    })).toBe('https://www.example.com/ :: mona-7fk2');
  });
});
