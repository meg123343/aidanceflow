import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Clock3, FileVideo, Link as LinkIcon, Loader2, Play, Sparkles, TrendingUp, Upload, X } from 'lucide-react';
import { GENERATED_DANCE } from '../constants';
import { generateKlingGuide, KlingGenerationResult } from '../lib/klingApi';
import { withMinimumDuration } from '../lib/timing';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (videoUrl?: string, sourceAudioUrl?: string) => void;
}

type Stage = 'input' | 'analyzing' | 'ready';

const analyzingSteps = ['识别人物动作', '对齐音乐卡点', '生成领拍参考'];
const ANALYZING_MIN_MS = 3000;

export default function UploadModal({ isOpen, onClose, onAnalyze }: UploadModalProps) {
  const [url, setUrl] = useState('');
  const [referenceNote, setReferenceNote] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<KlingGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStage('input');
      setUrl('');
      setReferenceNote('');
      setSelectedFileName('');
      setGeneratedVideoUrl(null);
      setTaskStatus(null);
      setError(null);
    }
  }, [isOpen]);

  const handleAnalyze = async () => {
    const referenceUrl = url.trim();
    const hasReferenceUrl = referenceUrl.length > 0;

    setStage('analyzing');
    setError(null);
    setTaskStatus(null);
    setGeneratedVideoUrl(null);

    try {
      const videoUrl = await withMinimumDuration(
        () =>
          generateKlingGuide(
            {
              mode: hasReferenceUrl ? 'reference' : 'choreography',
              endpoint: hasReferenceUrl ? 'motion-control' : 'image2video',
              prompt:
                referenceNote ||
                (hasReferenceUrl
                  ? '让参考人物复刻视频中的动作、节奏、手部细节和表情变化，生成一版可以直接跟拍的竖屏动作参考。'
                  : '生成一版适合直接跟拍的竖屏手势舞动作参考，动作清楚、节奏稳定、表情明确。'),
              referenceUrl: hasReferenceUrl ? referenceUrl : undefined,
              referenceIntent: hasReferenceUrl ? 'replicate' : undefined,
              referenceNote: selectedFileName ? `用户选择的参考视频文件名：${selectedFileName}。` : undefined,
              duration: '10',
              qualityMode: 'std',
            },
            setTaskStatus,
          ),
        ANALYZING_MIN_MS,
      );
      setGeneratedVideoUrl(videoUrl);
      setStage('ready');
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : '线上生成暂时没有成功，先用示例内容继续。');
      setStage('ready');
    }
  };

  const handleStart = () => {
    onAnalyze(generatedVideoUrl ?? undefined, generatedVideoUrl ? url.trim() || undefined : undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="flex max-h-[92vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-zinc-950 shadow-2xl sm:rounded-[32px]"
          >
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-black">
                  <Sparkles size={21} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">导入想拍的作品</h2>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500">领拍 Agent</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {stage === 'input' && (
                <div className="p-5">
                <label className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400">
                  <LinkIcon size={14} />
                  视频号 / 小红书 / 抖音作品链接
                </label>
                <div className="rounded-2xl border border-white/10 bg-black p-2">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="粘贴视频号 / 小红书 / 抖音里想拍的短视频链接"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      className="min-w-0 rounded-xl bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                    <button
                      onClick={handleAnalyze}
                      className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
                    >
                      一键提取并开始拍
                    </button>
                  </div>
                  <p className="px-4 pb-2 pt-2 text-xs leading-5 text-zinc-500">
                    建议使用 3-10 秒、单人、头肩和双手清楚入镜的视频，动作越清楚，生成越稳。
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <textarea
                    value={referenceNote}
                    onChange={(event) => setReferenceNote(event.target.value)}
                    placeholder="可选：补充你想要的效果，比如动作更慢、保留原声、手部更清楚。"
                    className="min-h-24 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                  />
                  <label className="flex min-h-20 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-orange-500/35 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-200 transition hover:bg-orange-500 hover:text-black">
                    <span className="flex items-center gap-2">
                      <Upload size={19} />
                      {selectedFileName || '也可以选择本地视频'}
                    </span>
                    <span className="text-[11px] font-medium opacity-70">演示优先走链接</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')}
                    />
                  </label>
                </div>

                <button
                  onClick={handleAnalyze}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-orange-500/35 bg-orange-500/10 px-5 py-5 text-sm font-bold text-orange-200 transition hover:bg-orange-500 hover:text-black"
                >
                  <FileVideo size={18} />
                  没有链接？先用示例开始拍
                </button>
                </div>
              )}

              {stage === 'analyzing' && (
                <div className="grid gap-6 p-5">
                <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-[26px] border border-white/10 bg-black">
                  <video src={GENERATED_DANCE.videoUrl} className="aspect-[9/16] w-full object-cover opacity-80" autoPlay muted loop playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Loader2 className="animate-spin text-orange-500" size={42} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-orange-400">正在生成领拍内容</p>
                  <h3 className="mt-2 text-3xl font-black text-white">把这条视频变成你的成片参考</h3>
                  {taskStatus?.taskId && (
                    <p className="mt-3 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-zinc-300">任务：{taskStatus.taskId}</p>
                  )}
                  <div className="mt-6 space-y-3">
                    {analyzingSteps.map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-black">
                          {index + 1}
                        </div>
                        <span className="text-sm font-bold text-zinc-200">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              )}

              {stage === 'ready' && (
                <div className="grid gap-6 p-5">
                <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black">
                  <video
                    key={generatedVideoUrl ?? GENERATED_DANCE.guideUrl}
                    src={generatedVideoUrl ?? GENERATED_DANCE.guideUrl}
                    className="aspect-[9/16] w-full object-cover"
                    autoPlay={!generatedVideoUrl}
                    muted={!generatedVideoUrl}
                    loop={!generatedVideoUrl}
                    controls={Boolean(generatedVideoUrl)}
                    playsInline
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-black text-black">
                    {generatedVideoUrl ? '已生成' : '示例方案'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className={`flex items-center gap-2 text-sm font-black ${error ? 'text-orange-300' : 'text-green-400'}`}>
                    <CheckCircle2 size={18} />
                    {error ? '先用示例继续' : '可以开始拍了'}
                  </div>
                  <h3 className="mt-2 text-3xl font-black text-white">{error ? '线上生成没赶上，先走演示内容' : '领拍内容已准备好'}</h3>
                  {error && <p className="mt-3 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3 text-sm leading-6 text-orange-100">{error}</p>}
                  <div className="mt-5 space-y-3">
                    <PlanItem icon={<TrendingUp size={17} />} title="爆点" desc="开头 2 秒先给表情或手势记忆点，让观众知道这条值得看完。" />
                    <PlanItem icon={<Clock3 size={17} />} title="发布时间" desc="晚间 19:30-21:30 更适合这类轻互动内容，发布后先盯前 30 分钟评论。" />
                    <PlanItem icon={<Sparkles size={17} />} title="互动" desc="结尾留一句问题，引导观众选下一条想看的风格。" />
                  </div>
                  <button
                    onClick={handleStart}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-black text-black transition hover:bg-orange-400"
                  >
                    <Play size={18} fill="currentColor" />
                    开始拍
                  </button>
                </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PlanItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-widest text-orange-400">
        {icon}
        {title}
      </div>
      <p className="text-sm leading-6 text-zinc-300">{desc}</p>
    </div>
  );
}
