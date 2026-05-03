import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KlingClient } from './klingClient.ts';
import type { KlingGenerationRequest } from './klingClient.ts';

const app = express();
const port = Number(process.env.KLING_PROXY_PORT ?? 8787);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referencePeopleDirName = '\u53c2\u8003\u4eba\u7269';

app.use(express.json({ limit: '10mb' }));

function getKlingClient() {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error('Please set KLING_ACCESS_KEY and KLING_SECRET_KEY in .env');
  }

  return new KlingClient({
    accessKey,
    secretKey,
    baseUrl: process.env.KLING_BASE_URL,
  });
}

function getDefaultReferenceImageBase64() {
  const configuredPath = process.env.KLING_REFERENCE_IMAGE_PATH;
  const referenceDir = path.join(rootDir, referencePeopleDirName);
  const resolvedPath =
    configuredPath && configuredPath.trim()
      ? path.resolve(rootDir, configuredPath)
      : fs
          .readdirSync(referenceDir)
          .filter((name) => /\.(png|jpe?g)$/i.test(name))
          .map((name) => ({ name, size: fs.statSync(path.join(referenceDir, name)).size }))
          .sort((a, b) => b.size - a.size)[0]?.name;

  if (!resolvedPath) throw new Error(`No reference image found in ${referenceDir}`);
  const finalPath = path.isAbsolute(resolvedPath) ? resolvedPath : path.join(referenceDir, resolvedPath);
  return fs.readFileSync(finalPath).toString('base64');
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/media/proxy', async (request, response) => {
  try {
    const url = String(request.query.url ?? '');
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      response.status(400).json({ error: 'Unsupported media URL.' });
      return;
    }

    const upstream = await fetch(parsedUrl, {
      headers: request.headers.range ? { Range: request.headers.range } : undefined,
    });
    if (!upstream.ok || !upstream.body) {
      response.status(upstream.status || 502).json({ error: 'Media fetch failed.' });
      return;
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
    response.status(upstream.status);
    for (const headerName of ['content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(headerName);
      if (value) response.setHeader(headerName, value);
    }

    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        response.write(Buffer.from(value));
      }
      response.end();
    };
    await pump();
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Media proxy failed' });
  }
});

app.post('/api/kling/generate', async (request, response) => {
  try {
    const body = request.body as KlingGenerationRequest;
    if (!body?.prompt?.trim()) {
      response.status(400).json({ error: 'Please enter a generation prompt.' });
      return;
    }

    const task = await getKlingClient().createVideoTask({
      ...body,
      endpoint: 'omni-video',
      image: body.image || getDefaultReferenceImageBase64(),
    });
    response.json(task);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Kling task submit failed' });
  }
});

app.post('/api/kling/image-guide', async (request, response) => {
  try {
    const body = request.body as KlingGenerationRequest;
    if (!body?.prompt?.trim()) {
      response.status(400).json({ error: 'Please enter a generation prompt.' });
      return;
    }

    const task = await getKlingClient().createVideoTask({
      ...body,
      endpoint: 'image2video',
      image: body.image || getDefaultReferenceImageBase64(),
    });
    response.json(task);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Kling image-to-video task submit failed' });
  }
});

app.post('/api/kling/motion-control', async (request, response) => {
  try {
    const body = request.body as KlingGenerationRequest;
    if (!body?.prompt?.trim()) {
      response.status(400).json({ error: 'Please enter a generation prompt.' });
      return;
    }
    if (!body?.referenceUrl?.trim()) {
      response.status(400).json({ error: 'Please enter a reference video URL.' });
      return;
    }

    const task = await getKlingClient().createVideoTask({
      ...body,
      endpoint: 'motion-control',
      image: body.image || getDefaultReferenceImageBase64(),
      keepOriginalSound: body.keepOriginalSound ?? 'yes',
    });
    response.json(task);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Kling motion-control task submit failed' });
  }
});

app.get('/api/kling/tasks/:taskId', async (request, response) => {
  try {
    const endpoint =
      request.query.endpoint === 'image2video' ? 'image2video' : request.query.endpoint === 'motion-control' ? 'motion-control' : 'omni-video';
    const task = await getKlingClient().getTaskStatus(request.params.taskId, endpoint);
    response.json(task);
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Kling task query failed' });
  }
});

app.listen(port, () => {
  console.log(`Kling proxy listening on http://localhost:${port}`);
});
