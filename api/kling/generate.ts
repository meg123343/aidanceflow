import { getKlingClient, getReferenceImageUrl, json, readJson } from './_shared.ts';
import type { KlingGenerationRequest } from '../../server/klingClient.ts';

export async function POST(request: Request) {
  try {
    const body = (await readJson(request)) as KlingGenerationRequest;
    if (!body.prompt?.trim()) {
      return json({ error: 'Please enter a generation prompt.' }, { status: 400 });
    }

    const task = await getKlingClient().createVideoTask({
      ...body,
      endpoint: 'omni-video',
      image: body.image || getReferenceImageUrl(request),
    });
    return json(task);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Kling task submit failed' }, { status: 500 });
  }
}
