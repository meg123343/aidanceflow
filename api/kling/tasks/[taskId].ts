import { getKlingClient, json, parseEndpoint } from '../_shared';

async function handleGet(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const taskId = decodeURIComponent(pathParts[pathParts.length - 1] ?? '');
    if (!taskId || taskId === '[taskId]') {
      return json({ error: 'Missing task id.' }, { status: 400 });
    }

    const endpoint = parseEndpoint(url.searchParams.get('endpoint'));
    const task = await getKlingClient().getTaskStatus(taskId, endpoint);
    return json(task);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Kling task query failed' }, { status: 500 });
  }
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed.' }, { status: 405 });
    }
    return handleGet(request);
  },
};
