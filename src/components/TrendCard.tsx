import { useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Flame, Play, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { Trend } from '../constants';

interface TrendCardProps {
  trend: Trend;
  rank: number;
  onSelect: (trend: Trend) => void;
  onAnalyze: (trend: Trend) => void;
}

export default function TrendCard({ trend, rank, onSelect, onAnalyze }: TrendCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const playWithSound = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    setIsMuted(false);
    video.play().then(() => setIsPlaying(true)).catch(() => {
      video.muted = true;
      setIsMuted(true);
      video.play().then(() => setIsPlaying(true)).catch(() => undefined);
    });
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  };

  const toggleMuted = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onMouseEnter={playWithSound}
      onMouseLeave={stopPreview}
      className="overflow-hidden rounded-[24px] border border-white/10 bg-black"
    >
      <div className="grid grid-cols-[126px_1fr]">
        <button onClick={playWithSound} className="relative aspect-[3/4] overflow-hidden bg-zinc-900 text-left">
          <video
            ref={videoRef}
            src={trend.videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/62 p-3 text-white backdrop-blur">
                <Play size={19} fill="currentColor" />
              </div>
            </div>
          )}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black text-black">
            <Flame size={11} />
            TOP {rank}
          </div>
          <button
            onClick={toggleMuted}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
            title={isMuted ? '打开声音' : '关闭声音'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </button>

        <div className="flex min-w-0 flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-[10px] font-bold text-orange-300">
              <TrendingUp size={11} />
              {trend.growth}
            </span>
            <span className="text-[10px] font-bold text-zinc-500">{trend.views} 人在看</span>
          </div>

          <h3 className="line-clamp-1 text-base font-black text-white">{trend.title}</h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{trend.description}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {trend.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-white/6 px-2 py-1 text-[10px] font-bold text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-auto grid grid-cols-[0.9fr_1fr] gap-2 pt-4">
            <button
              onClick={() => onAnalyze(trend)}
              className="flex items-center justify-center gap-1 rounded-2xl bg-white/8 px-3 py-3 text-xs font-bold text-zinc-200"
            >
              <BarChart3 size={14} />
              看建议
            </button>
            <button
              onClick={() => onSelect(trend)}
              className="flex items-center justify-center gap-1 rounded-2xl bg-orange-500 px-3 py-3 text-xs font-black text-black"
            >
              <Play size={14} fill="currentColor" />
              开始拍
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
