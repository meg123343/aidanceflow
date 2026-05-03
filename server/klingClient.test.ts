import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildImageToVideoPayload, buildKlingPrompt, buildMotionControlPayload, buildOmniVideoPayload, createKlingApiToken, KlingClient } from './klingClient.ts';

function decodeJwtPart(token: string, index: number) {
  const part = token.split('.')[index];
  return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

describe('createKlingApiToken', () => {
  it('creates an HS256 JWT with iss, exp and nbf required by Kling', () => {
    const token = createKlingApiToken('ak-test', 'sk-test', () => 1_700_000_000);

    assert.equal(token.split('.').length, 3);
    assert.deepEqual(decodeJwtPart(token, 0), { alg: 'HS256', typ: 'JWT' });
    assert.deepEqual(decodeJwtPart(token, 1), {
      iss: 'ak-test',
      exp: 1_700_001_800,
      nbf: 1_699_999_995,
    });
  });
});

describe('buildOmniVideoPayload', () => {
  it('builds a vertical short guide-video payload for choreography', () => {
    const payload = buildOmniVideoPayload({
      mode: 'choreography',
      prompt: '可爱元气，动作简单',
      bgmNote: '轻快卡点',
    });

    assert.equal(payload.model_name, 'kling-video-o1');
    assert.equal(payload.mode, 'pro');
    assert.equal(payload.aspect_ratio, '9:16');
    assert.equal(payload.duration, '5');
    assert.equal(payload.sound, 'on');
    assert.deepEqual(payload.watermark_info, { enabled: false });
    assert.match(String(payload.prompt), /gesture-dance guide video/);
    assert.match(String(payload.prompt), /可爱元气/);
    assert.match(String(payload.prompt), /轻快卡点/);
    assert.match(String(payload.prompt), /light rhythmic music or beat sound/);
  });

  it('uses Omni video reference mode when a reference url is supplied', () => {
    const payload = buildOmniVideoPayload({
      mode: 'reference',
      prompt: '拆成新手能跟拍的手势舞',
      referenceUrl: 'https://example.com/video',
      image: 'https://example.com/person.png',
    });

    assert.deepEqual(payload.video_list, [
      {
        video_url: 'https://example.com/video',
        refer_type: 'feature',
        keep_original_sound: 'yes',
      },
    ]);
    assert.deepEqual(payload.image_list, [{ image_url: 'https://example.com/person.png' }]);
    assert.equal(payload.sound, 'off');
    assert.match(String(payload.prompt), /Reference video URL: https:\/\/example.com\/video/);
    assert.match(String(payload.prompt), /Do not copy the person's identity or face/);
    assert.match(String(payload.prompt), /replicate the dance actions and beat timing/);
    assert.match(String(payload.prompt), /<<<image_1>>>/);
    assert.match(String(payload.prompt), /<<<video_1>>>/);
    assert.match(String(payload.prompt), /pure black-and-white minimalist line art/);
    assert.match(String(payload.prompt), /plain white or transparent empty background/);
    assert.match(String(payload.prompt), /Do not render a 3D cartoon/);
  });

  it('uses Omni video inspiration mode for free choreography from a reference video', () => {
    const payload = buildOmniVideoPayload({
      mode: 'choreography',
      prompt: 'cute easy dance',
      referenceUrl: 'https://example.com/style.mp4',
      image: 'https://example.com/person.png',
    });

    assert.deepEqual(payload.image_list, [{ image_url: 'https://example.com/person.png' }]);
    assert.match(String(payload.prompt), /Create a new gesture-dance guide inspired by video 1/);
    assert.match(String(payload.prompt), /do not copy the exact choreography/);
    assert.match(String(payload.prompt), /no realistic room/);
  });
});

describe('buildImageToVideoPayload', () => {
  it('builds an image-to-video payload for the reference character', () => {
    const payload = buildImageToVideoPayload(
      {
        mode: 'choreography',
        prompt: '让参考人物跳一个可爱手势舞',
        bgmNote: '轻快卡点',
      },
      'base64-image',
    );

    assert.equal(payload.model_name, 'kling-v2-6');
    assert.equal(payload.image, 'base64-image');
    assert.equal(payload.mode, 'pro');
    assert.equal(payload.duration, '5');
    assert.equal(payload.sound, 'on');
    assert.match(payload.prompt, /让参考人物跳一个可爱手势舞/);
    assert.match(payload.negative_prompt, /distorted limbs/);
    assert.match(payload.negative_prompt, /realistic room/);
  });
});

describe('buildMotionControlPayload', () => {
  it('builds a single-character motion-control payload for exact action extraction', () => {
    const payload = buildMotionControlPayload(
      {
        endpoint: 'motion-control',
        mode: 'reference',
        prompt: '复刻动作',
        referenceUrl: 'https://example.com/dance.mp4',
      },
      'https://example.com/line-person.png',
    );

    assert.equal(payload.model_name, 'kling-v3');
    assert.equal(payload.image_url, 'https://example.com/line-person.png');
    assert.equal(payload.video_url, 'https://example.com/dance.mp4');
    assert.equal(payload.keep_original_sound, 'yes');
    assert.equal(payload.character_orientation, 'image');
    assert.equal(payload.mode, 'pro');
    assert.match(String(payload.prompt), /motion-control source/);
    assert.match(String(payload.prompt), /exactly one line-art character/);
    assert.doesNotMatch(String(payload.prompt), /<<<video_1>>>/);
  });
});

describe('KlingClient', () => {
  it('submits Omni video tasks to the Beijing Kling endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = new KlingClient({
      accessKey: 'ak-test',
      secretKey: 'sk-test',
      now: () => 1_700_000_000,
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({ code: 0, data: { task_id: 'task-123' } });
      },
    });

    const task = await client.createVideoTask({ mode: 'choreography', prompt: 'cute dance' });

    assert.equal(task.taskId, 'task-123');
    assert.equal(calls[0].url, 'https://api-beijing.klingai.com/v1/videos/omni-video');
    assert.equal(calls[0].init.method, 'POST');
    assert.match(String((calls[0].init.headers as Record<string, string>).Authorization), /^Bearer /);
  });

  it('normalizes successful task query responses with a generated video url', async () => {
    const client = new KlingClient({
      accessKey: 'ak-test',
      secretKey: 'sk-test',
      fetchImpl: async () =>
        Response.json({
          code: 0,
          data: {
            task_id: 'task-123',
            task_status: 'succeed',
            task_result: { videos: [{ url: 'https://cdn.example.com/guide.mp4' }] },
          },
        }),
    });

    const status = await client.getTaskStatus('task-123');

    assert.equal(status.status, 'succeed');
    assert.equal(status.videoUrl, 'https://cdn.example.com/guide.mp4');
  });

  it('submits image-to-video tasks to the image2video endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = new KlingClient({
      accessKey: 'ak-test',
      secretKey: 'sk-test',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({ code: 0, data: { task_id: 'task-image-123' } });
      },
    });

    const task = await client.createVideoTask({
      endpoint: 'image2video',
      mode: 'choreography',
      prompt: '线稿人物跳舞',
      image: 'base64-image',
    });

    assert.equal(task.taskId, 'task-image-123');
    assert.equal(calls[0].url, 'https://api-beijing.klingai.com/v1/videos/image2video');
    assert.match(String(calls[0].init.body), /base64-image/);
  });

  it('submits motion-control tasks to the motion-control endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = new KlingClient({
      accessKey: 'ak-test',
      secretKey: 'sk-test',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({ code: 0, data: { task_id: 'task-motion-123' } });
      },
    });

    const task = await client.createVideoTask({
      endpoint: 'motion-control',
      mode: 'reference',
      prompt: 'replicate',
      referenceUrl: 'https://example.com/dance.mp4',
      image: 'https://example.com/person.png',
    });

    assert.equal(task.taskId, 'task-motion-123');
    assert.equal(calls[0].url, 'https://api-beijing.klingai.com/v1/videos/motion-control');
    assert.match(String(calls[0].init.body), /character_orientation/);
  });
});
