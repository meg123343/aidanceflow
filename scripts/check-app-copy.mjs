import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const uiFiles = [
  'src/App.tsx',
  'src/components/TrendDashboard.tsx',
  'src/components/TrendCard.tsx',
  'src/components/TrendAnalysis.tsx',
  'src/components/UploadModal.tsx',
  'src/components/DanceStudio.tsx',
  'src/lib/klingApi.ts',
];

const combined = uiFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
const blockedWords = ['KOC', '模板', '引导小人', '小人', 'AI 拆解方案', 'AI 开拍 Agent', '开拍方案', '数字人复刻', '练习页', '练习', '电脑', '网页'];

for (const word of blockedWords) {
  assert.equal(combined.includes(word), false, `UI copy should not include "${word}"`);
}

assert.match(combined, /领拍 Agent/);
assert.match(combined, /开始拍/);
assert.match(combined, /成片/);
assert.match(combined, /你的 Dance Flow Agent/);
assert.match(combined, /数字人/);
assert.match(combined, /手势舞/);
assert.match(combined, /不会跳，我教你/);
assert.match(combined, /数字人教学/);
assert.match(combined, /同源作品解析中/);
assert.match(combined, /去噪中/);
assert.match(combined, /清晰化中/);
assert.match(combined, /按综合推荐分排序/);
assert.match(combined, /动作解析中/);

const trendCard = readFileSync('src/components/TrendCard.tsx', 'utf8');
assert.match(trendCard, /onMouseEnter/);
assert.match(trendCard, /onMouseLeave/);
assert.match(trendCard, /muted = false/);

const dashboard = readFileSync('src/components/TrendDashboard.tsx', 'utf8');
assert.equal(dashboard.includes('agentActions'), false, 'Static hero cards should be removed because they look clickable');
assert.match(dashboard, /heroTrend\.guideUrl/);
assert.match(dashboard, /heroTrend\.videoUrl/);
assert.match(dashboard, /setActiveNav/);
assert.match(dashboard, /趋势雷达/);
assert.match(dashboard, /音源卡点/);
assert.match(dashboard, /成片库/);

const app = readFileSync('src/App.tsx', 'utf8');
assert.match(app, /pendingTrend/);
assert.match(app, /startPreparedTrend/);

const uploadModal = readFileSync('src/components/UploadModal.tsx', 'utf8');
const platformOrder = uploadModal.indexOf('视频号 / 小红书 / 抖音');
assert.notEqual(platformOrder, -1, 'Upload entry should list 视频号 before 小红书 and 抖音');

const constants = readFileSync('src/constants.ts', 'utf8');
const scores = [...constants.matchAll(/opportunityScore:\s*(\d+)/g)].slice(0, 3).map((match) => Number(match[1]));
assert.ok(scores[0] > scores[1] && scores[1] > scores[2], `Trend scores should match TOP order: ${scores.join(', ')}`);

const views = [...constants.matchAll(/views:\s*'([\d.]+)/g)].slice(0, 3).map((match) => Number(match[1]));
assert.ok(views[0] > views[1] && views[1] > views[2], `Trend views should match TOP order: ${views.join(', ')}`);

const growths = [...constants.matchAll(/growth:\s*'\+(\d+)%'/g)].slice(0, 3).map((match) => Number(match[1]));
assert.ok(growths[0] > growths[1] && growths[1] > growths[2], `Trend growth should match TOP order: ${growths.join(', ')}`);

console.log('app copy ok');
