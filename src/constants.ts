export type Difficulty = '新手友好' | '进阶挑战' | '爆款挑战';

export interface DanceStep {
  time: string;
  title: string;
  detail: string;
}

export interface Trend {
  id: string;
  title: string;
  author: string;
  views: string;
  growth: string;
  opportunityScore: number;
  description: string;
  difficulty: Difficulty;
  thumbnail: string;
  videoUrl: string;
  guideUrl: string;
  tags: string[];
  hook: string;
  lightTip: string;
  shootingTip: string;
  publishTip: string;
  interactionTip: string;
  steps: DanceStep[];
}

const videoAssets = {
  gesture1: new URL('../example/手势舞1.mp4', import.meta.url).href,
  gesture2: new URL('../example/手势舞2.mp4', import.meta.url).href,
  gesture3: new URL('../example/手势舞3.mp4', import.meta.url).href,
  dance1: new URL('../example/舞蹈1.mp4', import.meta.url).href,
  dance2: new URL('../example/舞蹈2.mp4', import.meta.url).href,
  dance3: new URL('../example/舞蹈3.mp4', import.meta.url).href,
  dance4: new URL('../example/舞蹈4.mp4', import.meta.url).href,
  dance5: new URL('../example/舞蹈5.mp4', import.meta.url).href,
};

export const TRENDS: Trend[] = [
  {
    id: 'gesture-1',
    title: '甜妹比心卡点舞',
    author: '@视频号热榜',
    views: '312.9万',
    growth: '+689%',
    opportunityScore: 97,
    description: '低门槛高互动，适合用表情特写和手势记忆点快速完成第一条挑战内容。',
    difficulty: '新手友好',
    thumbnail: videoAssets.gesture1,
    videoUrl: videoAssets.gesture1,
    guideUrl: videoAssets.dance1,
    tags: ['甜妹风', '比心', '卡点'],
    hook: '爆点在前 2 秒的表情反差和第三拍的比心动作，观众一眼能学会，评论区容易出现“求教程”和“我也试试”。',
    lightTip: '用正面柔光，脸部亮度比背景高一档；避免顶光，否则比心动作会挡住表情。',
    shootingTip: '前 2 秒靠近镜头建立亲近感，随后退半步露出上半身，手势始终保持在胸口到脸颊之间。',
    publishTip: '建议 19:30-21:30 发布，配合晚间碎片时间；标题突出“今天这条我也能试一次”。',
    interactionTip: '置顶评论引导用户选下一条风格：“甜妹、元气、反差，你想看哪种拆法？”',
    steps: [
      { time: '0s-2s', title: '镜头确认', detail: '脸部靠近镜头，右手轻点脸颊，先给观众一个记忆点。' },
      { time: '2s-5s', title: '双手比心', detail: '跟随动作参考在胸前完成两次比心，动作幅度保持小而准。' },
      { time: '5s-8s', title: '定格收尾', detail: '最后一拍看向镜头微笑，方便截成封面。' },
    ],
  },
  {
    id: 'gesture-2',
    title: '元气摆手挑战',
    author: '@小红书趋势',
    views: '188.4万',
    growth: '+486%',
    opportunityScore: 92,
    description: '适合日常穿搭、校园和自拍场景，用轻动作制造亲近感，不依赖专业舞感。',
    difficulty: '进阶挑战',
    thumbnail: videoAssets.gesture2,
    videoUrl: videoAssets.gesture2,
    guideUrl: videoAssets.dance2,
    tags: ['元气', '摆手', '日常感'],
    hook: '内容卖点不是舞蹈难度，而是“像朋友随手拍”。真实、轻松、不要太用力，反而更容易让人想跟着试。',
    lightTip: '选择窗边侧前方自然光，背景保持干净，衣服颜色和背景拉开对比。',
    shootingTip: '镜头固定，人物站在画面中线偏左 10%；摆手时保持手腕先动，肩膀放松。',
    publishTip: '建议午休 12:00-13:30 或晚间 20:00 发布，标题强调“今天也要元气满满”。',
    interactionTip: '评论区发起“交作业”挑战，鼓励粉丝用同款动作拍自己的日常场景。',
    steps: [
      { time: '0s-3s', title: '左右摆手', detail: '手腕先动，手肘放松，避免动作看起来太僵。' },
      { time: '3s-6s', title: '肩部律动', detail: '肩膀跟着音乐轻点，脚步保持原地即可。' },
      { time: '6s-9s', title: '靠近镜头', detail: '收尾向镜头轻轻前进，增加互动感。' },
    ],
  },
  {
    id: 'gesture-3',
    title: '反差表情手势舞',
    author: '@抖音挑战榜',
    views: '128.6万',
    growth: '+412%',
    opportunityScore: 86,
    description: '动作简单但表情变化明显，适合做“第一次挑战也能出片”的涨粉内容。',
    difficulty: '爆款挑战',
    thumbnail: videoAssets.gesture3,
    videoUrl: videoAssets.gesture3,
    guideUrl: videoAssets.dance3,
    tags: ['反差感', '表情管理', '挑战'],
    hook: '爆点在表情反转：前半段冷脸，后半段突然笑起来。它让用户关注“你怎么变脸”，而不是纠结舞蹈难度。',
    lightTip: '用稳定正面光，避免强阴影；反差表情需要眼神和嘴角都清楚。',
    shootingTip: '前半段保持半身构图，最后一拍向镜头靠近，制造“被点名”的互动感。',
    publishTip: '建议 18:00-20:00 发布，标题加入“第 1 次拍竟然成了”，制造挑战感。',
    interactionTip: '结尾字幕提问“你能忍住不笑吗？”评论区更容易出现二创和模仿。',
    steps: [
      { time: '0s-2s', title: '冷脸开场', detail: '前两秒保持淡表情，制造反差。' },
      { time: '2s-6s', title: '手势切换', detail: '跟随动作参考完成上指、比心、摆手三连。' },
      { time: '6s-10s', title: '表情反转', detail: '最后一拍突然笑起来，形成短视频记忆点。' },
    ],
  },
];

export const GENERATED_DANCE: Trend = {
  id: 'generated-cute',
  title: '元气甜妹领拍内容',
  author: '@AIDanceFlow',
  views: '演示方案',
  growth: 'Ready',
  opportunityScore: 89,
  description: '根据账号风格快速给出动作、节奏和发布建议，适合在演示中稳定进入拍摄流程。',
  difficulty: '新手友好',
  thumbnail: videoAssets.dance4,
  videoUrl: videoAssets.dance4,
  guideUrl: videoAssets.dance4,
  tags: ['元气风', '轻动作', '评论互动'],
  hook: '用一句想拍的感觉就能得到可执行的拍摄建议，从“想拍什么”直接进入“怎么拍”。',
  lightTip: '建议使用正面柔光或窗边光，背景保持白墙/浅色，突出人物表情。',
  shootingTip: '先给 1 秒表情特写，再进入小幅度手势，最后定格留封面。',
  publishTip: '建议作为系列挑战发布，让用户在评论区点下一条风格。',
  interactionTip: '置顶评论：“下一条想看甜酷、校园还是通勤风？”',
  steps: [
    { time: '0s-3s', title: '风格确认', detail: '先展示可爱风表情和轻动作，让观众知道视频调性。' },
    { time: '3s-7s', title: '动作段', detail: '用小幅度手势连接音乐节拍，降低学习难度。' },
    { time: '7s-10s', title: '封面动作', detail: '结尾保留一个可截图的定格姿势。' },
  ],
};

export const LINK_FALLBACK_DANCE: Trend = {
  ...GENERATED_DANCE,
  id: 'link-fallback-dance',
  title: '链接兜底领拍内容',
  views: '本地兜底',
  thumbnail: videoAssets.dance5,
  videoUrl: videoAssets.dance5,
  guideUrl: videoAssets.dance5,
  description: '链接解析或线上生成较慢时，先展示这版可直接跟拍的本地兜底内容，保证演示流程不断档。',
};
