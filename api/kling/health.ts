import { getReferenceImageUrl, json } from './_shared.ts';

export function GET(request: Request) {
  return json({
    ok: true,
    runtime: 'vercel',
    hasAccessKey: Boolean(process.env.KLING_ACCESS_KEY?.trim()),
    hasSecretKey: Boolean(process.env.KLING_SECRET_KEY?.trim()),
    baseUrl: process.env.KLING_BASE_URL || 'https://api-beijing.klingai.com',
    referenceImageUrl: getReferenceImageUrl(request),
  });
}
