function handleGet(request: Request) {
  const configuredReferenceImageUrl = process.env.KLING_REFERENCE_IMAGE_URL;
  return Response.json({
    ok: true,
    runtime: 'vercel',
    hasAccessKey: Boolean(process.env.KLING_ACCESS_KEY?.trim()),
    hasSecretKey: Boolean(process.env.KLING_SECRET_KEY?.trim()),
    baseUrl: process.env.KLING_BASE_URL || 'https://api-beijing.klingai.com',
    referenceImageUrl: configuredReferenceImageUrl?.trim() || new URL('/reference-character.png', request.url).toString(),
  });
}

export default {
  fetch(request: Request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    }
    return handleGet(request);
  },
};
