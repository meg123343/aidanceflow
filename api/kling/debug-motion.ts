import { getReferenceImageUrl, json, readJson } from './_shared';
import { buildMotionControlPayload } from '../../server/klingClient';
import type { KlingGenerationRequest } from '../../server/klingClient';

function summarizeUrl(value: string) {
  try {
    const url = new URL(value);
    return {
      ok: true,
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname,
      looksLikeVideo: /\.(mp4|mov)(?:$|\?)/i.test(url.pathname + url.search),
    };
  } catch {
    return {
      ok: false,
      protocol: '',
      host: '',
      pathname: '',
      looksLikeVideo: false,
    };
  }
}

async function handlePost(request: Request) {
  const body = (await readJson(request)) as KlingGenerationRequest;
  return buildDebugResponse(request, body);
}

function buildDebugResponse(request: Request, body: KlingGenerationRequest) {
  const imageUrl = body.image || getReferenceImageUrl(request);
  const payload = buildMotionControlPayload(
    {
      ...body,
      endpoint: 'motion-control',
      prompt: body.prompt || '生成一版可以直接跟拍的竖屏动作参考。',
      qualityMode: body.qualityMode === 'std' ? 'std' : 'pro',
    },
    imageUrl,
  );

  return json({
    ok: true,
    hasAccessKey: Boolean(process.env.KLING_ACCESS_KEY?.trim()),
    hasSecretKey: Boolean(process.env.KLING_SECRET_KEY?.trim()),
    baseUrl: process.env.KLING_BASE_URL || 'https://api-beijing.klingai.com',
    imageUrl,
    imageUrlCheck: summarizeUrl(imageUrl),
    referenceUrl: body.referenceUrl,
    referenceUrlCheck: summarizeUrl(body.referenceUrl || ''),
    payload,
  });
}

export default {
  async fetch(request: Request) {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      return buildDebugResponse(request, {
        mode: 'reference',
        endpoint: 'motion-control',
        prompt: url.searchParams.get('prompt') || '生成一版可以直接跟拍的竖屏动作参考。',
        referenceUrl: url.searchParams.get('video') || '',
        qualityMode: 'std',
      });
    }
    if (request.method === 'POST') return handlePost(request);
    return json({ error: 'Method not allowed.' }, { status: 405 });
  },
};
