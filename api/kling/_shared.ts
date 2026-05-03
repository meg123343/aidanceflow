import { KlingClient } from '../../server/klingClient.ts';
import type { KlingEndpoint, KlingGenerationRequest } from '../../server/klingClient.ts';

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Partial<KlingGenerationRequest>;
  } catch {
    return {};
  }
}

export function getKlingClient() {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error('Please set KLING_ACCESS_KEY and KLING_SECRET_KEY in Vercel Environment Variables.');
  }

  return new KlingClient({
    accessKey,
    secretKey,
    baseUrl: process.env.KLING_BASE_URL,
  });
}

export function getReferenceImageUrl(request: Request) {
  const configured = process.env.KLING_REFERENCE_IMAGE_URL;
  if (configured?.trim()) return configured.trim();
  return new URL('/reference-character.png', request.url).toString();
}

export function parseEndpoint(value: string | null): KlingEndpoint {
  return value === 'image2video' ? 'image2video' : value === 'motion-control' ? 'motion-control' : 'omni-video';
}
