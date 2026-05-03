import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock3, Lightbulb, MessageCircle, Sparkles, Target, Video, X } from 'lucide-react';
import { Trend } from '../constants';

interface TrendAnalysisProps {
  trend: Trend;
  onClose: () => void;
  onStart: () => void;
}

export default function TrendAnalysis({ trend, onClose, onStart }: TrendAnalysisProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/72 p-0 backdrop-blur-md sm:items-center sm:p-5">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          className="relative w-full max-w-[430px] overflow-hidden rounded-t-[32px] border border-white/10 bg-zinc-950 shadow-2xl sm:rounded-[32px]"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-orange-500" size={20} />
              <div>
                <h2 className="text-xl font-black text-white">拍前看一眼</h2>
                <p className="mt-1 text-xs text-zinc-500">{trend.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
            <Insight icon={<Target size={17} />} title="爆点在哪里" text={trend.hook} />
            <Insight icon={<Lightbulb size={17} />} title="光线怎么打" text={trend.lightTip} />
            <Insight icon={<Video size={17} />} title="镜头怎么摆" text={trend.shootingTip} />
            <Insight icon={<Clock3 size={17} />} title="什么时候发" text={trend.publishTip} />
            <Insight icon={<MessageCircle size={17} />} title="评论区怎么接" text={trend.interactionTip} />
          </div>

          <div className="border-t border-white/10 bg-black/70 p-5">
            <button
              onClick={onStart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-black text-black transition hover:bg-orange-400 active:scale-95"
            >
              开始拍
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Insight({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-widest text-orange-400">
        {icon}
        {title}
      </div>
      <p className="text-sm leading-7 text-zinc-300">{text}</p>
    </div>
  );
}
