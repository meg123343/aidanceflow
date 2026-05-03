import { getKlingClient, getReferenceImageUrl, json, readJson } from './_shared';
import type { KlingGenerationRequest } from '../../server/klingClient';

async function handlePost(request: Request) {
  try {
    const body = (await readJson(request)) as KlingGenerationRequest;
    if (!body.prompt?.trim()) {
      return json({ error: 'Please enter a generation prompt.' }, { status: 400 });
    }
    if (!body.referenceUrl?.trim()) {
      return json({ error: 'Please enter a reference video URL.' }, { status: 400 });
    }

    const task = await getKlingClient().createVideoTask({
      ...body,
      endpoint: 'motion-control',
      image: body.image || getReferenceImageUrl(request),
      keepOriginalSound: body.keepOriginalSound ?? 'yes',
    });
    return json(task);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Kling motion-control task submit failed' }, { status: 500 });
  }
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, { status: 405 });
    }
    return handlePost(request);
  },
};
