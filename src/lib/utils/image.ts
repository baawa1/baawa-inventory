export function normalizeImageUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed === '') return undefined;

  // Already absolute
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Supabase storage relative path e.g. "product-images/..."
  if (trimmed.startsWith('product-images/')) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) {
      // Fallback: return as-is with leading slash so Next/Image doesn't 400
      return `/${trimmed}`;
    }
    return `${base}/storage/v1/object/public/${trimmed}`;
  }

  // Ensure leading slash for public assets
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }

  return trimmed;
}
