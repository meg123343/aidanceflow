import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import DanceStudio from './components/DanceStudio';
import TrendAnalysis from './components/TrendAnalysis';
import TrendDashboard from './components/TrendDashboard';
import UploadModal from './components/UploadModal';
import { GENERATED_DANCE, Trend } from './constants';
import { createGeneratedTrend } from './lib/klingApi';
import { waitForMinimumDuration } from './lib/timing';

const PREPARING_TREND_MIN_MS = 3000;

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'studio'>('dashboard');
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [analyzingTrend, setAnalyzingTrend] = useState<Trend | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingTrend, setPendingTrend] = useState<Trend | null>(null);
  const [isPreparingTrend, setIsPreparingTrend] = useState(false);

  const handleSelectTrend = (trend: Trend) => {
    setPendingTrend(trend);
    setIsPreparingTrend(true);
    waitForMinimumDuration(performance.now(), PREPARING_TREND_MIN_MS).then(() => {
      setIsPreparingTrend(false);
    });
  };

  const startPreparedTrend = () => {
    if (!pendingTrend) return;
    setSelectedTrend(pendingTrend);
    setPendingTrend(null);
    setCurrentView('studio');
  };

  const handleCustomAnalysis = (videoUrl?: string, sourceAudioUrl?: string) => {
    setSelectedTrend(videoUrl ? createGeneratedTrend(videoUrl, 'AI 领拍内容', sourceAudioUrl) : GENERATED_DANCE);
    setCurrentView('studio');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30">
      {currentView === 'dashboard' ? (
        <TrendDashboard
          onSelectTrend={handleSelectTrend}
          onAnalyzeTrend={setAnalyzingTrend}
          onOpenUpload={() => setIsUploadModalOpen(true)}
        />
      ) : (
        <DanceStudio
          key={selectedTrend?.id ?? GENERATED_DANCE.id}
          trend={selectedTrend ?? GENERATED_DANCE}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {analyzingTrend && (
        <TrendAnalysis
          trend={analyzingTrend}
          onClose={() => setAnalyzingTrend(null)}
          onStart={() => {
            setSelectedTrend(analyzingTrend);
            setAnalyzingTrend(null);
            setCurrentView('studio');
          }}
        />
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalyze={handleCustomAnalysis}
      />

      <AnimatePresence>
        {pendingTrend && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/82 p-0 backdrop-blur-md sm:items-center sm:p-5">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="w-full max-w-[430px] overflow-hidden rounded-t-[32px] border border-white/10 bg-zinc-950 shadow-2xl sm:rounded-[32px]"
            >
              <div className="grid grid-cols-[0.9fr_1fr]">
                <div className="relative bg-black">
                  <video
                    src={pendingTrend.guideUrl}
                    className="aspect-[9/16] h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute right-3 top-3 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-xl">
                    <video src={pendingTrend.videoUrl} className="h-24 w-16 object-cover" autoPlay muted loop playsInline />
                    <div className="px-2 py-1 text-[9px] font-black text-orange-300">原片</div>
                  </div>
                  {isPreparingTrend && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/42">
                      <Loader2 className="animate-spin text-orange-500" size={42} />
                    </div>
                  )}
                </div>
                <div className="flex min-h-[360px] flex-col p-5">
                  {isPreparingTrend ? (
                    <>
                      <p className="text-sm font-black text-orange-400">领拍 Agent</p>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-white">正在生成你的跟拍参考</h3>
                      <div className="mt-5 space-y-2">
                        {['同源作品解析中', '动作解析中', '去噪中', '清晰化中'].map((item, index) => (
                          <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black p-3 text-xs font-bold text-zinc-200">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-black">0{index + 1}</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="flex items-center gap-2 text-sm font-black text-green-400">
                        <CheckCircle2 size={17} />
                        领拍内容已准备好
                      </p>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-white">{pendingTrend.title}</h3>
                      <p className="mt-4 text-sm leading-6 text-zinc-400">
                        已匹配对应的热门原片、动作参考和卡点音乐。下一步会进入相机页，跟着参考动作录制成片。
                      </p>
                      <button
                        onClick={startPreparedTrend}
                        className="mt-auto rounded-2xl bg-orange-500 px-5 py-4 font-black text-black transition hover:bg-orange-400"
                      >
                        开始拍
                      </button>
                      <button
                        onClick={() => setPendingTrend(null)}
                        className="mt-3 rounded-2xl bg-white/10 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/15"
                      >
                        先不拍
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
