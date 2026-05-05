import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  Bell,
  Bot,
  Camera,
  ChevronRight,
  Home,
  Link as LinkIcon,
  Loader2,
  Music2,
  Play,
  PlusCircle,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Wand2,
  X,
} from 'lucide-react';
import { GENERATED_DANCE, TRENDS, Trend } from '../constants';
import { createGeneratedTrend, generateKlingGuide, KlingGenerationResult } from '../lib/klingApi';
import { withMinimumDuration } from '../lib/timing';
import TrendCard from './TrendCard';

interface TrendDashboardProps {
  onSelectTrend: (trend: Trend) => void;
  onAnalyzeTrend: (trend: Trend) => void;
  onOpenUpload: () => void;
}

const QUICK_FALLBACK_MS = 900;
const API_FALLBACK_MS = 10_000;
const GENERATION_REVIEW_MIN_MS = 3000;

const navPanels = {
  灵感: {
    title: '灵感首页',
    desc: '继续刷今天适合拍的手势舞和热门动作。',
  },
  趋势雷达: {
    title: '趋势雷达',
    desc: '这里会展示同音源热度、近期涨幅和适合你拍的原因，Demo 中先用热榜卡片模拟。',
  },
  音源卡点: {
    title: '音源卡点',
    desc: '这里会整理 BGM 节拍、前 3 秒钩子和动作落点，帮助你拍得更准。',
  },
  成片库: {
    title: '成片库',
    desc: '这里会收纳已生成和已拍摄的成片，方便二次发布或重拍。',
  },
};

type NavPanelKey = keyof typeof navPanels;

export default function TrendDashboard({ onSelectTrend, onAnalyzeTrend, onOpenUpload }: TrendDashboardProps) {
  const heroTrend = TRENDS[0];
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReady, setGeneratedReady] = useState(false);
  const [stylePrompt, setStylePrompt] = useState('甜酷一点，动作简单，适合自拍');
  const [bgmNote, setBgmNote] = useState('');
  const [referenceNote, setReferenceNote] = useState('');
  const [referenceVideoUrl, setReferenceVideoUrl] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavPanelKey>('灵感');
  const [, setTaskStatus] = useState<KlingGenerationResult | null>(null);

  const startGenerate = async () => {
    setIsGenerating(true);
    setGeneratedReady(false);
    setGeneratedVideoUrl(null);
    setTaskStatus(null);

    try {
      await withMinimumDuration(async () => {
        const trimmedReferenceVideoUrl = referenceVideoUrl.trim();
        const userStyle = stylePrompt.trim() || '动作简单，适合自拍';

        if (!trimmedReferenceVideoUrl) {
          await new Promise((resolve) => window.setTimeout(resolve, QUICK_FALLBACK_MS));
          return;
        }

        const videoUrl = await Promise.race<string | null>([
          generateKlingGuide(
            {
              mode: 'choreography',
              endpoint: 'omni-video',
              prompt: `${userStyle}。生成一版可以直接跟拍的短视频动作参考：动作清楚、表情明确、卡点稳定，适合竖屏自拍成片。`,
              referenceUrl: trimmedReferenceVideoUrl,
              referenceIntent: 'inspire',
              referenceNote,
              bgmNote,
              sound: 'on',
              duration: '10',
            },
            setTaskStatus,
          ),
          new Promise((resolve) => window.setTimeout(() => resolve(null), API_FALLBACK_MS)),
        ]);

        if (videoUrl) setGeneratedVideoUrl(videoUrl);
      }, GENERATION_REVIEW_MIN_MS);
    } catch {
      setGeneratedVideoUrl(null);
    } finally {
      setIsGenerating(false);
      setGeneratedReady(true);
    }
  };

  const startGeneratedDance = () => {
    setGeneratedReady(false);
    onSelectTrend(generatedVideoUrl ? createGeneratedTrend(generatedVideoUrl, 'AI 即兴领拍', referenceVideoUrl.trim() || undefined) : GENERATED_DANCE);
  };

  return (
    <main className="min-h-screen bg-black text-white sm:bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_34%),#020202]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-zinc-950 shadow-2xl sm:my-6 sm:min-h-[860px] sm:rounded-[38px] sm:border sm:border-white/10">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/92 px-4 pb-3 pt-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-orange-400">你的 Dance Flow Agent</p>
              <h1 className="mt-1 text-xl font-black">领拍</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-zinc-200">
                <Search size={18} />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-zinc-200">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-5 px-4 pb-24 pt-4">
          <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black">
            <video src={heroTrend.guideUrl} className="h-[470px] w-full object-cover opacity-90" autoPlay muted loop playsInline />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/52 to-transparent" />
            <div className="absolute right-4 top-4 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
              <video src={heroTrend.videoUrl} className="h-28 w-20 object-cover opacity-90" autoPlay muted loop playsInline />
              <div className="px-2 py-1 text-[10px] font-black text-orange-300">热门原片</div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-black text-black">
                <Bot size={14} />
                数字人手势舞
              </div>
              <h2 className="max-w-[310px] text-5xl font-black leading-[0.92]">
                领拍
                <span className="mt-1 block text-2xl text-orange-400">你的 Dance Flow Agent</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                <span className="block text-lg font-black text-white">不会跳，我教你</span>
                <span className="block text-lg font-black text-white">没想法，我帮你编</span>
                <span className="mt-2 block">刷到喜欢的手势舞，导入后先看动作、卡点和拍摄建议，再开始拍。</span>
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['数字人教学', '手势舞卡点', '原声跟拍'].map((tag) => (
                  <div key={tag} className="rounded-2xl bg-white/10 px-3 py-2 text-center text-[11px] font-black text-white backdrop-blur">
                    {tag}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-[1fr_0.82fr] gap-3">
                <button
                  onClick={onOpenUpload}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-4 text-sm font-black text-black active:scale-95"
                >
                  <LinkIcon size={18} />
                  粘贴链接
                </button>
                <button
                  onClick={() => onSelectTrend(heroTrend)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black text-black active:scale-95"
                >
                  <Camera size={18} />
                  开始拍
                </button>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {activeNav !== '灵感' && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="rounded-[24px] border border-white/10 bg-black p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black tracking-[0.18em] text-orange-400">DEMO</p>
                    <h3 className="mt-1 text-xl font-black text-white">{navPanels[activeNav].title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{navPanels[activeNav].desc}</p>
                  </div>
                  <button onClick={() => setActiveNav('灵感')} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-zinc-300">
                    返回
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="rounded-[24px] border border-orange-500/25 bg-orange-500/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-black text-orange-300">
                  <Wand2 size={17} />
                  一句话领拍
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">不知道拍什么，就让 Agent 先给你一版。</p>
              </div>
              <button onClick={startGenerate} className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-black">
                生成
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={stylePrompt}
                onChange={(event) => setStylePrompt(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
              />
              <input
                type="text"
                value={referenceVideoUrl}
                onChange={(event) => setReferenceVideoUrl(event.target.value)}
                placeholder="可选：粘贴参考视频链接"
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(event) => setReferenceNote(event.target.value)}
                  placeholder="动作偏好"
                  className="min-w-0 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                />
                <input
                  type="text"
                  value={bgmNote}
                  onChange={(event) => setBgmNote(event.target.value)}
                  placeholder="BGM / 节奏"
                  className="min-w-0 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] text-orange-400">HOT NOW</p>
                <h2 className="mt-1 text-2xl font-black">今日可拍</h2>
                <p className="mt-1 text-[11px] font-bold text-zinc-500">按综合推荐分排序</p>
              </div>
              <button onClick={onOpenUpload} className="flex items-center gap-1 text-xs font-bold text-zinc-400">
                自己找一条
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="space-y-3">
              {TRENDS.map((trend, index) => (
                <TrendCard key={trend.id} trend={trend} rank={index + 1} onSelect={onSelectTrend} onAnalyze={onAnalyzeTrend} />
              ))}
            </div>
          </section>
        </div>

        <nav className="sticky bottom-0 z-40 border-t border-white/10 bg-black/90 px-5 pb-4 pt-3 backdrop-blur-xl">
          <div className="grid grid-cols-5 items-center text-[10px] font-bold text-zinc-500">
            <NavItem active={activeNav === '灵感'} icon={<Home size={20} />} label="灵感" onClick={() => setActiveNav('灵感')} />
            <NavItem active={activeNav === '趋势雷达'} icon={<BarChart3 size={20} />} label="趋势" onClick={() => setActiveNav('趋势雷达')} />
            <button
              onClick={() => onSelectTrend(heroTrend)}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-black shadow-[0_0_32px_rgba(249,115,22,0.45)] active:scale-95"
              title="开始拍"
            >
              <PlusCircle size={28} />
            </button>
            <NavItem active={activeNav === '音源卡点'} icon={<Music2 size={20} />} label="音源" onClick={() => setActiveNav('音源卡点')} />
            <NavItem active={activeNav === '成片库'} icon={<Radio size={20} />} label="成片" onClick={() => setActiveNav('成片库')} />
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {(isGenerating || generatedReady) && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/78 p-0 backdrop-blur-md sm:items-center sm:p-5">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="relative max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-[32px] border border-white/10 bg-zinc-950 shadow-2xl sm:rounded-[32px]"
            >
              {!isGenerating && (
                <button
                  onClick={() => setGeneratedReady(false)}
                  className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-zinc-300 backdrop-blur transition hover:bg-white/10 hover:text-white"
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              )}
              <div className="grid grid-cols-[0.9fr_1fr] gap-0">
                <div className="relative bg-black">
                  <video
                    key={generatedVideoUrl ?? GENERATED_DANCE.guideUrl}
                    src={generatedVideoUrl ?? GENERATED_DANCE.guideUrl}
                    className="aspect-[9/16] h-full w-full object-cover"
                    autoPlay={isGenerating || !generatedVideoUrl}
                    muted={isGenerating || !generatedVideoUrl}
                    loop={isGenerating || !generatedVideoUrl}
                    controls={!isGenerating}
                    playsInline
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <Loader2 className="animate-spin text-orange-500" size={42} />
                    </div>
                  )}
                </div>
                <div className="flex min-h-[360px] flex-col p-5">
                  {isGenerating ? (
                    <>
                      <p className="text-sm font-black text-orange-400">正在准备领拍内容</p>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-white">动作、卡点和镜头建议马上就好</h3>
                      <div className="mt-5 space-y-2">
                        {['同源作品解析中', '动作解析中', '去噪中', '清晰化中'].map((item, index) => (
                          <div key={item} className="rounded-2xl border border-white/10 bg-black p-3 text-xs font-bold text-zinc-200">
                            0{index + 1} / {item}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black text-green-400">领拍内容已生成</p>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-white">先看一眼效果，再开始拍</h3>
                      <p className="mt-4 text-sm leading-6 text-zinc-400">这一版会进入相机拍摄页，你可以跟着动作和音乐录制自己的成片。</p>
                      <button
                        onClick={startGeneratedDance}
                        className="mt-auto rounded-2xl bg-orange-500 px-5 py-4 font-black text-black transition hover:bg-orange-400"
                      >
                        开始拍
                      </button>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          onClick={startGenerate}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                        >
                          <RefreshCw size={16} />
                          再来一版
                        </button>
                        <button
                          onClick={() => setGeneratedReady(false)}
                          className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                        >
                          改要求
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-orange-400' : ''}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
