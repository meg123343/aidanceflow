import { getReferenceImageUrl, json } from './_shared.ts';

function handleGet(request: Request) {
  return json({
    ok: true,
    runtime: 'vercel',
    hasAccessKey: Boolean(process.env.KLING_ACCESS_KEY?.trim()),
    hasSecretKey: Boolean(process.env.KLING_SECRET_KEY?.trim()),
    baseUrl: process.env.KLING_BASE_URL || 'https://api-beijing.klingai.com',
    referenceImageUrl: getReferenceImageUrl(request),
  });
}

export default {
  fetch(request: Request) {
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed.' }, { status: 405 });
    }
    return handleGet(request);
  },
};
