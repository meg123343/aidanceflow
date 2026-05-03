import { GENERATED_DANCE, Trend } from '../constants';
import { formatKlingErrorMessage, klingErrorFallbacks } from './klingErrors';
import { toMediaProxyUrl } from './mediaProxy';

export type KlingGenerationMode = 'reference' | 'choreography';
export type KlingDuration = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15';

export interface KlingGenerationInput {
  mode: KlingGenerationMode;
  prompt: string;
  referenceUrl?: string;
  referenceNote?: string;
  referenceIntent?: 'replicate' | 'inspire';
  bgmNote?: string;
  endpoint?: 'omni-video' | 'image2video' | 'motion-control';
  sound?: 'on' | 'off';
  duration?: KlingDuration;
  qualityMode?: 'std' | 'pro' | '4k';
}

export interface KlingGenerationResult {
  taskId: string;
  status: 'submitted' | 'processing' | 'succeed' | 'failed';
  endpoint?: 'omni-video' | 'image2video' | 'motion-control';
  message?: string;
  videoUrl?: string;
  sourceAudioUrl?: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60;

function getStaticHostApiMessage() {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
    return '当前打开的是 GitHub Pages 静态演示页，这里没有后端 API。请打开 Vercel 链接测试可灵生成；GitHub Pages 只用于无 API 展示。';
  }
  return '';
}

async function readApiResponse(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => '');
  const staticHostMessage = getStaticHostApiMessage();
  return {
    error:
      staticHostMessage ||
      (text.includes('<!DOCTYPE html>') || text.includes('<html')
        ? '线上 API 路由没有响应。请确认现在打开的是 Vercel 链接，并且 Vercel 已经重新部署成功。'
        : text.trim() || fallback),
  };
}

export async function createKlingTask(input: KlingGenerationInput): Promise<KlingGenerationResult> {
  const endpointPath =
    input.endpoint === 'image2video' ? '/api/kling/image-guide' : input.endpoint === 'motion-control' ? '/api/kling/motion-control' : '/api/kling/generate';
  const response = await fetch(endpointPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).catch((error: unknown) => {
    throw new Error(formatKlingErrorMessage(error instanceof Error ? error.message : '', klingErrorFallbacks.submit));
  });
  const data = await readApiResponse(response, klingErrorFallbacks.submit);
  if (!response.ok) throw new Error(formatKlingErrorMessage(data?.error, klingErrorFallbacks.submit));
  return data;
}

export async function getKlingTask(taskId: string, endpoint?: KlingGenerationResult['endpoint']): Promise<KlingGenerationResult> {
  const query = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : '';
  const response = await fetch(`/api/kling/tasks/${encodeURIComponent(taskId)}${query}`).catch((error: unknown) => {
    throw new Error(formatKlingErrorMessage(error instanceof Error ? error.message : '', klingErrorFallbacks.query));
  });
  const data = await readApiResponse(response, klingErrorFallbacks.query);
  if (!response.ok) throw new Error(formatKlingErrorMessage(data?.error, klingErrorFallbacks.query));
  return data;
}

export async function waitForKlingVideo(taskId: string, endpoint?: KlingGenerationResult['endpoint'], onStatus?: (status: KlingGenerationResult) => void) {
  for (let index = 0; index < MAX_POLLS; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
    const status = await getKlingTask(taskId, endpoint);
    onStatus?.(status);

    if (status.status === 'succeed') {
      if (!status.videoUrl) throw new Error('可灵任务已完成，但没有返回视频地址');
      return status.videoUrl;
    }
    if (status.status === 'failed') {
      throw new Error(formatKlingErrorMessage(status.message, klingErrorFallbacks.generate));
    }
  }

  throw new Error('可灵生成还在排队，请稍后到任务记录里查看');
}

export async function generateKlingGuide(input: KlingGenerationInput, onStatus?: (status: KlingGenerationResult) => void) {
  const task = await createKlingTask(input);
  onStatus?.(task);
  return waitForKlingVideo(task.taskId, task.endpoint ?? input.endpoint, onStatus);
}

export function createGeneratedTrend(videoUrl: string, title = '我的领拍内容', sourceAudioUrl?: string): Trend {
  const proxiedAudioUrl = sourceAudioUrl ? toMediaProxyUrl(sourceAudioUrl) : undefined;
  return {
    ...GENERATED_DANCE,
    id: `kling-${Date.now()}`,
    title,
    author: '@AIDanceFlow',
    views: '刚刚生成',
    growth: 'Ready',
    thumbnail: videoUrl,
    videoUrl: proxiedAudioUrl || videoUrl,
    guideUrl: videoUrl,
    description: '根据你给的内容准备好的动作、音乐节奏和拍摄建议，可以直接进入相机开始拍。',
    tags: ['新动作', '卡点参考', '拍摄建议'],
  };
}
