import crypto from 'node:crypto';

export type KlingGenerationMode = 'reference' | 'choreography';
export type KlingEndpoint = 'omni-video' | 'image2video' | 'motion-control';
export type KlingQualityMode = 'std' | 'pro' | '4k';
export type KlingDuration = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15';
export type KlingSoundMode = 'on' | 'off';
export type KlingReferenceIntent = 'replicate' | 'inspire';

export interface KlingGenerationRequest {
  mode: KlingGenerationMode;
  prompt: string;
  endpoint?: KlingEndpoint;
  referenceUrl?: string;
  referenceNote?: string;
  referenceIntent?: KlingReferenceIntent;
  bgmNote?: string;
  modelName?: 'kling-video-o1' | 'kling-v3-omni' | 'kling-v2-6' | 'kling-v3';
  qualityMode?: KlingQualityMode;
  duration?: KlingDuration;
  sound?: KlingSoundMode;
  keepOriginalSound?: 'yes' | 'no';
  image?: string;
  imageTail?: string;
  negativePrompt?: string;
}

export interface KlingTaskStatus {
  taskId: string;
  status: 'submitted' | 'processing' | 'succeed' | 'failed';
  endpoint?: KlingEndpoint;
  message?: string;
  videoUrl?: string;
  raw?: unknown;
}

export interface KlingClientOptions {
  accessKey: string;
  secretKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const DEFAULT_BASE_URL = 'https://api-beijing.klingai.com';
const OMNI_VIDEO_PATH = '/v1/videos/omni-video';
const IMAGE_TO_VIDEO_PATH = '/v1/videos/image2video';
const MOTION_CONTROL_PATH = '/v1/videos/motion-control';

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function createKlingApiToken(accessKey: string, secretKey: string, now = () => Math.floor(Date.now() / 1000)) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const currentTime = now();
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: accessKey,
      exp: currentTime + 1800,
      nbf: currentTime - 5,
    }),
  );
  const signature = crypto.createHmac('sha256', secretKey).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${base64UrlEncode(signature)}`;
}

export function buildKlingPrompt(request: KlingGenerationRequest) {
  const hasImage = Boolean(request.image?.trim());
  const hasReferenceVideo = Boolean(request.referenceUrl?.trim());
  const isMotionControl = request.endpoint === 'motion-control';
  const styleGuard =
    'Visual style must be pure black-and-white minimalist line art: thin clean black outline strokes on a plain white or transparent empty background, no color fills except black lines, no shading, no 3D render, no realistic room, no furniture, no floor, no wall texture, no photographic background. Do not render a 3D cartoon, anime doll, real person, hotel room, bedroom, hallway, or any filled scene. Preserve the reference image style as a simple line-drawing guide, not a volumetric character. ';
  const characterRef = hasImage && !isMotionControl ? 'Use <<<image_1>>> only as the line-art guide character identity and silhouette. ' : '';
  const videoRef = hasReferenceVideo && !isMotionControl ? 'Use <<<video_1>>> as the reference video. ' : '';
  const base =
    isMotionControl
      ? `${styleGuard}Use the input image_url as the only character and visual style source. Use the input video_url only as the motion-control source. Generate exactly one line-art character, not two people. The character should follow the reference video's dance action, hand motion, pose timing, facial expression beats, and music beat points as closely as possible.`
      : request.mode === 'reference'
      ? `${styleGuard}${characterRef}${videoRef}Make the line-art character in image 1 replicate the dance actions and beat timing in video 1. Keep the choreography, hand gestures, pose timing, facial expression beats, and music card-points as close to the reference video as possible.`
      : hasReferenceVideo
        ? `${styleGuard}${characterRef}${videoRef}Create a new gesture-dance guide inspired by video 1. Learn only the rhythm, mood, gesture density, camera energy, and trend feeling from the reference video; do not copy the exact choreography.`
        : `${styleGuard}${characterRef}Create a vertical 9:16 gesture-dance guide video. The dance should be simple, cute, easy to follow, with clear hand gestures, facial expression beats, and a clean ending pose.`;

  const parts = [base, `User request: ${request.prompt.trim()}`];
  if (request.referenceUrl?.trim()) {
    parts.push(
      `Reference video URL: ${request.referenceUrl.trim()}. Copy only motion and timing information. Do not copy the original person's identity, face, outfit, colors, second person, scene, room, lighting, camera background, or environment.`,
    );
  }
  if (request.referenceNote?.trim()) parts.push(`Reference notes: ${request.referenceNote.trim()}`);
  if (request.bgmNote?.trim()) parts.push(`BGM or rhythm notes: ${request.bgmNote.trim()}`);
  parts.push(
    'Output requirements: 9:16 vertical video, continuous visible dance motion from the first second to the last second, smooth motion with no stutter, clear hands, expressive face, pure white or transparent empty background for easy cutout, black line strokes only, no filled background, no realistic interior, no 3D body volume, no colored clothes, no skin color, no frozen frame, no still-image slideshow, no spoken dialogue, no subtitles, no watermark, light rhythmic music or beat sound if supported, the character visible as a full-body or half-body guide, suitable as a small guide window in a camera UI.',
  );
  parts.push('There must be exactly one character on screen. No duplicate character, no extra person, no partner, no mirror clone, no split body.');
  return parts.join('\n');
}

export function buildOmniVideoPayload(request: KlingGenerationRequest) {
  const hasReferenceVideo = Boolean(request.referenceUrl?.trim());
  const payload: Record<string, unknown> = {
    model_name: request.modelName ?? 'kling-video-o1',
    prompt: buildKlingPrompt(request),
    mode: request.qualityMode ?? 'pro',
    duration: request.duration ?? '5',
    aspect_ratio: '9:16',
    sound: hasReferenceVideo ? 'off' : request.sound ?? 'on',
    watermark_info: { enabled: false },
  };

  if (hasReferenceVideo) {
    payload.video_list = [
      {
        video_url: request.referenceUrl.trim(),
        refer_type: 'feature',
        keep_original_sound: request.keepOriginalSound ?? 'yes',
      },
    ];
  }

  if (request.image?.trim()) {
    payload.image_list = [{ image_url: request.image.trim() }];
  }

  return payload;
}

export function buildImageToVideoPayload(request: KlingGenerationRequest, image: string) {
  return {
    model_name: request.modelName ?? 'kling-v2-6',
    image,
    image_tail: request.imageTail,
    prompt: buildKlingPrompt(request),
    negative_prompt:
      request.negativePrompt ??
      'low quality, distorted limbs, extra fingers, deformed face, messy background, blocked hands, too fast motion, shaky camera, static frame, frozen image, no motion, still photo, slideshow, 3d cartoon, anime doll, realistic room, hotel room, bedroom, hallway, furniture, floor, wall, colored background, skin color, filled clothes, shading, photorealistic',
    duration: request.duration ?? '5',
    mode: request.qualityMode ?? 'pro',
    sound: request.sound ?? 'on',
    watermark_info: { enabled: false },
  };
}

export function buildMotionControlPayload(request: KlingGenerationRequest, imageUrl: string) {
  if (!request.referenceUrl?.trim()) {
    throw new Error('Motion control requires a reference video URL');
  }

  return {
    model_name: request.modelName ?? 'kling-v3',
    image_url: imageUrl,
    video_url: request.referenceUrl.trim(),
    prompt: buildKlingPrompt(request),
    keep_original_sound: request.keepOriginalSound ?? 'yes',
    character_orientation: 'image',
    mode: request.qualityMode ?? 'pro',
    watermark_info: { enabled: false },
  };
}

function pickTaskId(data: any) {
  return data?.data?.task_id ?? data?.data?.taskId ?? data?.task_id ?? data?.taskId ?? data?.id;
}

function pickVideoUrl(data: any) {
  const videos = data?.data?.task_result?.videos ?? data?.data?.videos ?? data?.videos;
  return videos?.[0]?.url ?? videos?.[0]?.video_url ?? data?.data?.video_url ?? data?.video_url;
}

function normalizeTaskStatus(data: any): KlingTaskStatus {
  const statusText = String(data?.data?.task_status ?? data?.task_status ?? data?.status ?? '').toLowerCase();
  const taskId = pickTaskId(data) ?? '';
  const message = data?.data?.task_status_msg ?? data?.message ?? data?.msg;
  const videoUrl = pickVideoUrl(data);

  if (videoUrl || ['succeed', 'success', 'completed', 'complete'].includes(statusText)) {
    return { taskId, status: 'succeed', message, videoUrl, raw: data };
  }
  if (['failed', 'fail', 'error'].includes(statusText)) {
    return { taskId, status: 'failed', message: message || 'Kling generation failed', raw: data };
  }
  if (['submitted', 'created', 'queued'].includes(statusText)) {
    return { taskId, status: 'submitted', message, raw: data };
  }
  return { taskId, status: 'processing', message, raw: data };
}

export class KlingClient {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(options: KlingClientOptions) {
    this.accessKey = options.accessKey;
    this.secretKey = options.secretKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000));
  }

  private headers() {
    return {
      Authorization: `Bearer ${createKlingApiToken(this.accessKey, this.secretKey, this.now)}`,
      'Content-Type': 'application/json',
    };
  }

  async createVideoTask(request: KlingGenerationRequest): Promise<KlingTaskStatus> {
    const endpoint: KlingEndpoint =
      request.endpoint === 'image2video' ? 'image2video' : request.endpoint === 'motion-control' ? 'motion-control' : 'omni-video';
    const path = endpoint === 'image2video' ? IMAGE_TO_VIDEO_PATH : endpoint === 'motion-control' ? MOTION_CONTROL_PATH : OMNI_VIDEO_PATH;
    const body =
      endpoint === 'image2video'
        ? buildImageToVideoPayload(request, request.image ?? '')
        : endpoint === 'motion-control'
          ? buildMotionControlPayload(request, request.image ?? '')
          : buildOmniVideoPayload(request);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || (data?.code !== undefined && data.code !== 0)) {
      throw new Error(data?.message || data?.msg || `Kling task submit failed: HTTP ${response.status}`);
    }

    const taskId = pickTaskId(data);
    if (!taskId) throw new Error('Kling task was submitted, but the response did not include task_id');

    return { taskId, endpoint, status: 'submitted', message: data?.message, raw: data };
  }

  async getTaskStatus(taskId: string, endpoint: KlingEndpoint = 'omni-video'): Promise<KlingTaskStatus> {
    const path = endpoint === 'image2video' ? IMAGE_TO_VIDEO_PATH : endpoint === 'motion-control' ? MOTION_CONTROL_PATH : OMNI_VIDEO_PATH;
    const response = await this.fetchImpl(`${this.baseUrl}${path}/${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: this.headers(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || (data?.code !== undefined && data.code !== 0)) {
      throw new Error(data?.message || data?.msg || `Kling task query failed: HTTP ${response.status}`);
    }

    const status = normalizeTaskStatus(data);
    return { ...status, endpoint, taskId: status.taskId || taskId };
  }
}

export const buildTextToVideoPayload = buildOmniVideoPayload;
