import { Activity, Camera, Menu, Sparkles, User, Zap } from 'lucide-react';

export default function Header() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-black">
            <Zap size={21} fill="currentColor" />
          </div>
          <span className="text-lg font-black uppercase tracking-wide text-white md:text-xl">
            AI<span className="text-orange-500">Dance</span>Flow
          </span>
        </div>

        <div className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 md:flex">
          <a href="#trends" className="text-white transition-colors hover:text-orange-500">
            今日热榜
          </a>
          <a href="#coach" className="transition-colors hover:text-orange-500">
            领拍 Agent
          </a>
          <a href="#generate" className="transition-colors hover:text-orange-500">
            随机灵感
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:text-white sm:flex"
            title="趋势热度"
          >
            <Activity size={18} />
          </button>
          <button className="flex h-10 items-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-bold text-black transition-transform hover:scale-105">
            <Camera size={16} />
            <span className="hidden sm:inline">开始</span>
          </button>
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:text-white sm:flex"
            title="创作账号"
          >
            <User size={18} />
          </button>
          <button className="text-zinc-300 md:hidden" title="菜单">
            <Menu size={24} />
          </button>
          <Sparkles className="hidden text-orange-400 lg:block" size={16} />
        </div>
      </div>
    </nav>
  );
}
