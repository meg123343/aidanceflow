const fallbackMessages = {
  submit: '可灵任务提交失败',
  query: '可灵任务查询失败',
  generate: '可灵生成失败，请换一个参考视频再试',
};

export function formatKlingErrorMessage(message: unknown, fallback = fallbackMessages.generate) {
  const raw = typeof message === 'string' ? message.trim() : '';
  const normalized = raw.toLowerCase();

  if (normalized.includes('no complete upper body') || normalized.includes('upper body')) {
    return '动作控制没有识别到完整上半身。请换一个 3-10 秒单人片段：头、肩、双臂和双手都在画面内，人物居中且无遮挡，尽量不要切镜或快速运镜。';
  }

  if (normalized.includes('video duration') && normalized.includes('longer than 10')) {
    return '这段参考视频超过动作控制上限。请先裁成 10 秒内的单人片段再试。';
  }

  if (normalized.includes('video duration') && normalized.includes('longer than 30')) {
    return '这段参考视频超过动作控制上限。请先裁成 30 秒内的单人片段再试。';
  }

  if (normalized.includes('duration') && normalized.includes('shorter than 3')) {
    return '这段参考视频太短。请换成 3 秒以上、动作连续的片段。';
  }

  if (
    normalized.includes('account balance not enough') ||
    normalized.includes('insufficient balance') ||
    normalized.includes('not enough credit') ||
    normalized.includes('resource package') ||
    normalized.includes('账户欠费') ||
    normalized.includes('余额不足') ||
    normalized.includes('资源包')
  ) {
    return '可灵账号余额或资源包不足。请先在可灵控制台充值/购买资源包，或者切到标准模式后再试。';
  }

  if (normalized.includes('multiple') || normalized.includes('2 people') || normalized.includes('two people')) {
    return '动作控制更适合单人片段。请换成画面里只有一个主要人物、动作完整清楚的视频。';
  }

  if (normalized.includes('input was rejected')) {
    return `参考视频没有通过动作检测。请换成单人、头肩双手完整入镜、动作连续清楚的 3-10 秒片段。${raw ? `原始提示：${raw}` : ''}`;
  }

  return raw || fallback;
}

export const klingErrorFallbacks = fallbackMessages;
