export interface Bookmark {
  url: string;
  slug: string;
}

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SLUG_LENGTH = 4;
const SLUG_PATTERN = /^mona-[0-9A-Za-z]{4}$/;

export function normalizeUrl(value: string): string {
  const input = value.trim();
  if (!input) {
    throw new TypeError('Enter a URL to bookmark.');
  }

  const withProtocol = input.startsWith('//')
    ? `https:${input}`
    : /^[a-z][a-z\d+.-]*:\/\//i.test(input)
      ? input
      : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new TypeError('Enter a valid web URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('Enter a valid HTTP or HTTPS URL.');
  }

  return url.href;
}

export function parseStoredBookmarks(rawValue: string | null): Bookmark[] {
  if (!rawValue) {
    return [];
  }

  let value: unknown;
  try {
    value = JSON.parse(rawValue);
  } catch {
    return [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isBookmark);
}

export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url} :: ${bookmark.slug}`;
}

export function createUniqueSlug(
  bookmarks: readonly Bookmark[],
  randomBytes: (length: number) => Uint8Array,
): string {
  const existingSlugs = new Set(bookmarks.map(({ slug }) => slug));

  for (let attempt = 0; attempt < 128; attempt += 1) {
    const bytes = randomBytes(SLUG_LENGTH);
    if (bytes.length < SLUG_LENGTH) {
      throw new TypeError(`Expected at least ${SLUG_LENGTH} random bytes.`);
    }

    let slug = 'mona-';
    for (let index = 0; index < SLUG_LENGTH; index += 1) {
      slug += BASE62[bytes[index] % BASE62.length];
    }

    if (!existingSlugs.has(slug)) {
      return slug;
    }
  }

  throw new Error('Could not generate a unique bookmark slug.');
}

function isBookmark(value: unknown): value is Bookmark {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const bookmark = value as Record<string, unknown>;
  if (
    typeof bookmark.url !== 'string'
    || typeof bookmark.slug !== 'string'
    || !SLUG_PATTERN.test(bookmark.slug)
  ) {
    return false;
  }

  try {
    return normalizeUrl(bookmark.url) === bookmark.url;
  } catch {
    return false;
  }
}
