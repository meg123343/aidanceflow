export function toMediaProxyUrl(url: string, origin = typeof window === 'undefined' ? '' : window.location.origin) {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  try {
    const parsed = new URL(trimmed, origin || 'http://localhost');
    if (origin && parsed.origin === origin) return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!/^https?:$/.test(parsed.protocol)) return trimmed;
    return `/api/media/proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return trimmed;
  }
}
