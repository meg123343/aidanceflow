import { getKlingClient, json, parseEndpoint } from '../../server/klingRuntime.js';

export default {
  async fetch(request: Request) {
    try {
      const url = new URL(request.url);
      const taskId = url.searchParams.get('taskId') || '';
      if (!taskId) {
        return json({ error: 'Missing taskId query parameter.' }, { status: 400 });
      }

      const endpoint = parseEndpoint(url.searchParams.get('endpoint'));
      const task = await getKlingClient().getTaskStatus(taskId, endpoint);
      return json({ ok: true, task });
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : 'Task debug failed' }, { status: 500 });
    }
  },
};
