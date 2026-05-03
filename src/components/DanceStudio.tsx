import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Download,
  FastForward,
  FlipHorizontal,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Square,
} from 'lucide-react';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Trend } from '../constants';
import { cn } from '../lib/utils';

interface DanceStudioProps {
  trend: Trend;
  onBack: () => void;
}

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 720;
const RECORDING_WIDTH = 720;
const RECORDING_HEIGHT = 1280;
const GUIDE_MIN_WIDTH = 96;
const GUIDE_MAX_WIDTH = 260;
const GUIDE_TOP_SAFE = 78;
const GUIDE_BOTTOM_SAFE = 118;

type DragMode = 'move' | 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export default function DanceStudio({ trend, onBack }: DanceStudioProps) {
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
  const guideVideoRef = useRef<HTMLVideoElement>(null);
  const audioVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dragRef = useRef({
    dragging: false,
    mode: 'move' as DragMode,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const isRecordingRef = useRef(false);
  const isMirroredRef = useRef(true);
  const showSkeletonRef = useRef(false);
  const playbackSpeedRef = useRef(1);
  const discardRecordingRef = useRef(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isGuidePlaying, setIsGuidePlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [guideBox, setGuideBox] = useState({ x: 18, y: 138, width: 132 });
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isSoundPreviewing, setIsSoundPreviewing] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const shareText = useMemo(
    () => `我用 AIDanceFlow 拍了「${trend.title}」，动作、节奏和发布时间都准备好了。`,
    [trend.title],
  );

  useEffect(() => {
    isMirroredRef.current = isMirrored;
  }, [isMirrored]);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
  }, [showSkeleton]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
    if (!isRecordingRef.current) {
      if (guideVideoRef.current) guideVideoRef.current.playbackRate = playbackSpeed;
      if (audioVideoRef.current) audioVideoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    stopAllPlayback(true);
    setPlaybackSpeed(1);
    setShowResult(false);
    setRecordedVideoUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return null;
    });
    setGuideBox({ x: 18, y: 138, width: 132 });

    if (guideVideoRef.current) {
      guideVideoRef.current.load();
    }
    if (audioVideoRef.current) {
      audioVideoRef.current.load();
    }
  }, [trend.id]);

  useEffect(() => {
    if (!cameraVideoRef.current || !previewCanvasRef.current) return;

    let camera: MediaPipeCamera | null = null;
    let cancelled = false;
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: Results) => {
      const canvas = previewCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!results.poseLandmarks) return;

      const leftWrist = results.poseLandmarks[15]?.visibility ?? 0;
      const rightWrist = results.poseLandmarks[16]?.visibility ?? 0;
      setMatchScore(Math.min(99, Math.round(((leftWrist + rightWrist) / 2) * 100)));

      if (showSkeletonRef.current) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: 'rgba(255,255,255,0.86)',
          lineWidth: 2,
        });
        drawLandmarks(ctx, results.poseLandmarks, {
          color: '#f97316',
          lineWidth: 1,
          radius: 3,
        });
      }
    });

    camera = new MediaPipeCamera(cameraVideoRef.current, {
      onFrame: async () => {
        if (cameraVideoRef.current && !cancelled) {
          await pose.send({ image: cameraVideoRef.current });
        }
      },
      width: 1280,
      height: 720,
    });

    camera
      .start()
      .then(() => {
        if (!cancelled) setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setRecordingError('摄像头启动失败，请确认浏览器已允许相机权限。');
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
      camera?.stop();
      pose.close();
      activeStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const audio = audioVideoRef.current;
    if (!audio) return;

    const stopWhenAudioEnds = () => {
      setIsSoundPreviewing(false);
      setRecordProgress(1);
      if (isRecordingRef.current) handleStopRecording(true);
    };
    const updateProgress = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return;
      setRecordProgress(Math.min(1, audio.currentTime / audio.duration));
    };

    audio.addEventListener('ended', stopWhenAudioEnds);
    audio.addEventListener('timeupdate', updateProgress);
    return () => {
      audio.removeEventListener('ended', stopWhenAudioEnds);
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    };
  }, [recordedVideoUrl]);

  const drawRecordingFrame = () => {
    const video = cameraVideoRef.current;
    const canvas = recordingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!video || !canvas || !ctx) return;

    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    const videoRatio = videoWidth / videoHeight;
    const targetRatio = canvas.width / canvas.height;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (videoRatio > targetRatio) {
      sourceWidth = videoHeight * targetRatio;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      sourceHeight = videoWidth / targetRatio;
      sourceY = (videoHeight - sourceHeight) / 2;
    }

    if (isMirroredRef.current) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    try {
      ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    if (isRecordingRef.current) requestAnimationFrame(drawRecordingFrame);
  };

  const createRecordingStream = () => {
    const canvas = recordingCanvasRef.current;
    const audioVideo = audioVideoRef.current;
    if (!canvas) return null;

    const canvasStream = canvas.captureStream(30);
    let audioTracks: MediaStreamTrack[] = [];

    try {
      const audioStream =
        audioVideo && 'captureStream' in audioVideo
          ? (audioVideo as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream()
          : null;
      audioTracks = audioStream?.getAudioTracks() ?? [];
    } catch {
      audioTracks = [];
    }

    if (audioTracks.length === 0 && audioVideo) {
      try {
        const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          const audioContext = audioContextRef.current ?? new AudioContextCtor();
          audioContextRef.current = audioContext;
          const destination = audioDestinationRef.current ?? audioContext.createMediaStreamDestination();
          audioDestinationRef.current = destination;
          const source = audioSourceRef.current ?? audioContext.createMediaElementSource(audioVideo);
          audioSourceRef.current = source;
          source.connect(destination);
          source.connect(audioContext.destination);
          void audioContext.resume().catch(() => undefined);
          audioTracks = destination.stream.getAudioTracks();
        }
      } catch {
        audioTracks = [];
      }
    }

    return new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
  };

  const syncFromStart = async (withSound: boolean, rate: number) => {
    const guide = guideVideoRef.current;
    const audio = audioVideoRef.current;

    if (guide) {
      guide.loop = true;
      guide.currentTime = 0;
      guide.muted = true;
      guide.playbackRate = rate;
      setIsGuidePlaying(true);
    }

    if (audio) {
      audio.loop = false;
      audio.currentTime = 0;
      audio.muted = !withSound;
      audio.playbackRate = rate;
    }

    await Promise.all([guide?.play().catch(() => undefined), withSound ? audio?.play().catch(() => undefined) : undefined]);
  };

  const handleStartRecording = async () => {
    setRecordingError(null);
    setShowResult(false);
    setRecordProgress(0);
    stopAllPlayback(true);

    const canvas = recordingCanvasRef.current;
    if (!cameraVideoRef.current || !canvas) return;

    canvas.width = RECORDING_WIDTH;
    canvas.height = RECORDING_HEIGHT;
    setPlaybackSpeed(1);
    playbackSpeedRef.current = 1;
    discardRecordingRef.current = false;
    isRecordingRef.current = true;
    setIsRecording(true);

    drawRecordingFrame();
    requestAnimationFrame(drawRecordingFrame);
    await syncFromStart(true, 1);

    const stream = createRecordingStream();
    if (!stream) {
      setRecordingError('当前浏览器不支持录制画布，请换用 Chrome 或 Edge。');
      isRecordingRef.current = false;
      setIsRecording(false);
      return;
    }

    activeStreamRef.current = stream;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      const videoOnlyStream = new MediaStream(stream.getVideoTracks());
      activeStreamRef.current = videoOnlyStream;
      recorder = new MediaRecorder(videoOnlyStream, { mimeType });
      setRecordingError('外部音频暂时不能写入成片，已先保留画面录制。');
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
      mediaRecorderRef.current = null;

      if (discardRecordingRef.current) {
        chunksRef.current = [];
        discardRecordingRef.current = false;
        setRecordProgress(0);
        return;
      }

      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      if (blob.size === 0) {
        setRecordingError('这次录制没有生成画面，请重新拍一次。');
        return;
      }

      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return url;
      });
      setShowResult(true);
      setPlaybackSpeed(1);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
  };

  const handleStopRecording = (fromAudioEnd = false, discard = false) => {
    discardRecordingRef.current = discard;
    isRecordingRef.current = false;
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.stop();
    } else {
      activeStreamRef.current?.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    if (!fromAudioEnd) audioVideoRef.current?.pause();
    guideVideoRef.current?.pause();
    audioDestinationRef.current?.stream.getTracks().forEach((track) => track.stop());
    audioDestinationRef.current = null;
    setIsGuidePlaying(false);
    setIsSoundPreviewing(false);
  };

  const stopAllPlayback = (reset = true) => {
    guideVideoRef.current?.pause();
    audioVideoRef.current?.pause();
    if (reset) {
      if (guideVideoRef.current) guideVideoRef.current.currentTime = 0;
      if (audioVideoRef.current) audioVideoRef.current.currentTime = 0;
      setRecordProgress(0);
    }
    setIsGuidePlaying(false);
    setIsSoundPreviewing(false);
  };

  const resetTake = () => {
    if (isRecordingRef.current) {
      handleStopRecording(false, true);
      stopAllPlayback(true);
      return;
    }
    stopAllPlayback(true);
  };

  const toggleRecording = () => {
    if (isRecordingRef.current) handleStopRecording();
    else void handleStartRecording();
  };

  const togglePreview = async () => {
    if (isRecordingRef.current) return;
    const guide = guideVideoRef.current;
    const audio = audioVideoRef.current;
    if (!guide || !audio) return;

    if (isSoundPreviewing) {
      stopAllPlayback(false);
      return;
    }

    const currentTime = Math.min(guide.currentTime || audio.currentTime || 0, Math.max(0, (audio.duration || 0) - 0.2));
    guide.muted = true;
    audio.muted = false;
    guide.playbackRate = playbackSpeedRef.current;
    audio.playbackRate = playbackSpeedRef.current;
    guide.currentTime = currentTime;
    audio.currentTime = currentTime;
    await Promise.all([guide.play().catch(() => undefined), audio.play().catch(() => undefined)]);
    setIsGuidePlaying(true);
    setIsSoundPreviewing(true);
  };

  const onGuidePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    beginGuideDrag(event, 'move');
  };

  const beginGuideDrag = (event: ReactPointerEvent<HTMLElement>, mode: DragMode) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const height = guideBox.width * (16 / 9);
    dragRef.current = {
      dragging: true,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: guideBox.x,
      y: guideBox.y,
      width: guideBox.width,
      height,
    };
  };

  const onGuidePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    const mode = dragRef.current.mode;

    if (mode === 'move') {
      const width = dragRef.current.width;
      const height = width * (16 / 9);
      setGuideBox({
        x: clamp(dragRef.current.x + dx, 8, PHONE_WIDTH - width - 8),
        y: clamp(dragRef.current.y + dy, GUIDE_TOP_SAFE, PHONE_HEIGHT - height - GUIDE_BOTTOM_SAFE),
        width,
      });
      return;
    }

    const horizontalDelta = mode.includes('w') ? -dx : mode.includes('e') ? dx : 0;
    const verticalDelta = mode.includes('n') ? -dy * (9 / 16) : mode.includes('s') ? dy * (9 / 16) : 0;
    const rawWidth = dragRef.current.width + (Math.abs(horizontalDelta) > Math.abs(verticalDelta) ? horizontalDelta : verticalDelta);
    const maxWidthByPosition = PHONE_WIDTH - 16;
    const nextWidth = clamp(rawWidth, GUIDE_MIN_WIDTH, Math.min(GUIDE_MAX_WIDTH, maxWidthByPosition));
    const nextHeight = nextWidth * (16 / 9);
    const widthChange = nextWidth - dragRef.current.width;

    let nextX = dragRef.current.x;
    let nextY = dragRef.current.y;
    if (mode.includes('w')) nextX = dragRef.current.x - widthChange;
    if (mode.includes('n')) nextY = dragRef.current.y - widthChange * (16 / 9);

    setGuideBox({
      x: clamp(nextX, 8, PHONE_WIDTH - nextWidth - 8),
      y: clamp(nextY, GUIDE_TOP_SAFE, PHONE_HEIGHT - nextHeight - GUIDE_BOTTOM_SAFE),
      width: nextWidth,
    });
  };

  const onGuidePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    } else if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.dragging = false;
  };

  const cycleSpeed = () => {
    if (isRecordingRef.current) return;
    setPlaybackSpeed((speed) => (speed === 0.5 ? 0.75 : speed === 0.75 ? 1 : speed === 1 ? 1.25 : 0.5));
  };

  const downloadRecording = () => {
    if (!recordedVideoUrl) return;
    const link = document.createElement('a');
    link.href = recordedVideoUrl;
    link.download = `aidanceflow-${trend.id}.webm`;
    link.click();
  };

  const shareRecording = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'AIDanceFlow 跟拍作品', text: shareText }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(shareText).catch(() => undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-0 md:p-6">
        <div className="relative h-screen w-full overflow-hidden bg-black shadow-2xl md:h-[min(92vh,820px)] md:w-[min(100vw,445px)] md:rounded-[38px] md:border md:border-white/15">
          {!isLoaded && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/90">
              <Loader2 className="animate-spin text-orange-500" size={42} />
            </div>
          )}

          <video
            ref={cameraVideoRef}
            className={cn('absolute inset-0 h-full w-full object-cover', isMirrored && '-scale-x-100')}
            playsInline
            muted
          />
          <canvas
            ref={previewCanvasRef}
            className={cn('pointer-events-none absolute inset-0 h-full w-full object-cover', isMirrored && '-scale-x-100')}
            width={640}
            height={480}
          />
          <canvas ref={recordingCanvasRef} className="hidden" />
          <video key={`audio-${trend.id}`} ref={audioVideoRef} src={trend.videoUrl} className="hidden" playsInline preload="auto" />

          <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-4">
            <div className="mx-auto h-6 w-28 rounded-full bg-black md:hidden" />
            <div className="mt-3 flex items-center justify-between">
              <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
                <ChevronLeft size={24} />
              </button>
              <div className="max-w-[230px] rounded-full bg-black/45 px-4 py-2 text-center text-xs font-bold backdrop-blur">{trend.title}</div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur" title="音乐">
                <ChevronDown size={22} />
              </button>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${recordProgress * 100}%` }} />
            </div>
          </div>

          <div className="absolute right-3 top-28 z-20 flex flex-col gap-3">
            <SideButton label={`${playbackSpeed}x`} onClick={cycleSpeed}>
              <FastForward size={20} />
            </SideButton>
            <SideButton label={isMirrored ? '镜像' : '正向'} onClick={() => setIsMirrored((value) => !value)}>
              <FlipHorizontal size={20} />
            </SideButton>
            <SideButton label="骨架" active={showSkeleton} onClick={() => setShowSkeleton((value) => !value)}>
              <Maximize2 size={20} />
            </SideButton>
            <SideButton label={isSoundPreviewing ? '暂停' : '试听'} active={isSoundPreviewing} onClick={togglePreview}>
              {isSoundPreviewing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </SideButton>
          </div>

          {showSkeleton && (
            <div className="absolute right-20 top-28 z-20 rounded-2xl bg-black/50 px-3 py-2 text-right backdrop-blur">
              <p className="text-[10px] font-bold tracking-widest text-zinc-300">匹配</p>
              <p className="text-2xl font-black italic text-orange-500">{matchScore}%</p>
            </div>
          )}

          <motion.div
            className="absolute z-30 touch-none overflow-hidden rounded-[18px] border-2 border-white bg-black shadow-2xl"
            style={{ left: guideBox.x, top: guideBox.y, width: guideBox.width }}
            onPointerDown={onGuidePointerDown}
            onPointerMove={onGuidePointerMove}
            onPointerUp={onGuidePointerUp}
            onPointerCancel={onGuidePointerUp}
          >
            <video key={`guide-${trend.id}`} ref={guideVideoRef} src={trend.guideUrl} className="aspect-[9/16] w-full object-cover" loop playsInline muted />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/85 to-transparent p-2">
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black text-black">动作</span>
              <button
                onPointerDown={(event) => event.stopPropagation()}
                onClick={togglePreview}
                className="rounded-full bg-black/55 p-1 text-white"
                title={isGuidePlaying ? '暂停动作' : '播放动作'}
              >
                {isGuidePlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
              </button>
            </div>
            <ResizeHandle mode="n" className="left-4 right-4 top-0 h-3 cursor-ns-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="s" className="bottom-0 left-4 right-4 h-3 cursor-ns-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="w" className="bottom-4 left-0 top-4 w-3 cursor-ew-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="e" className="bottom-4 right-0 top-4 w-3 cursor-ew-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="nw" className="left-0 top-0 h-5 w-5 cursor-nwse-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="ne" className="right-0 top-0 h-5 w-5 cursor-nesw-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="sw" className="bottom-0 left-0 h-5 w-5 cursor-nesw-resize" onPointerDown={beginGuideDrag} />
            <ResizeHandle mode="se" className="bottom-0 right-0 h-6 w-6 cursor-nwse-resize" onPointerDown={beginGuideDrag} showGrip />
          </motion.div>

          <div className="absolute inset-x-4 bottom-0 z-20 bg-gradient-to-t from-black via-black/82 to-transparent pb-5 pt-24">
            {recordingError && (
              <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">{recordingError}</div>
            )}

            <div className="mb-4 flex justify-center gap-8 text-sm font-bold">
              <span className="text-zinc-400">分段拍</span>
              <span className="rounded-full bg-white px-5 py-1 text-black">视频</span>
              <span className="text-zinc-400">照片</span>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button onClick={resetTake} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur" title="重来">
                <RotateCcw size={22} />
              </button>
              <button
                onClick={toggleRecording}
                className={cn(
                  'relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition active:scale-95',
                  isRecording ? 'bg-white' : 'bg-red-600',
                )}
                title={isRecording ? '结束录制' : '开始录制'}
              >
                {isRecording ? <Square className="text-red-600" size={28} fill="currentColor" /> : <span className="h-14 w-14 rounded-full bg-red-600" />}
              </button>
              <button onClick={togglePreview} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur" title="播放动作参考">
                {isSoundPreviewing ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showResult && recordedVideoUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="grid max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[30px] border border-white/10 bg-zinc-950 shadow-2xl md:grid-cols-[minmax(0,1fr)_330px]"
            >
              <div className="relative flex min-h-[520px] items-center justify-center bg-black">
                <video src={recordedVideoUrl} className="h-full max-h-[88vh] aspect-[9/16] object-contain" controls autoPlay loop playsInline />
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-green-500 px-3 py-1 text-[11px] font-black text-black">
                  <CheckCircle2 size={13} />
                  竖屏作品已生成
                </div>
              </div>
              <div className="flex flex-col p-7">
                <h2 className="text-3xl font-black">作品已生成</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  先看一遍成片，再保存或重拍。觉得节奏不对，可以回到拍摄页再来一次。
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-xs font-bold tracking-widest text-zinc-500">发布文案</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-200">{shareText}</p>
                </div>

                <div className="mt-6 space-y-3">
                  <button onClick={downloadRecording} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-black text-black transition hover:bg-orange-400">
                    <Download size={20} />
                    保存作品
                  </button>
                  <button onClick={shareRecording} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-4 font-bold text-white transition hover:bg-white/15">
                    <Share2 size={20} />
                    一键分享
                  </button>
                </div>

                <div className="mt-auto space-y-3 pt-8">
                  <button onClick={() => setShowResult(false)} className="flex w-full items-center justify-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white">
                    <RotateCcw size={16} />
                    重新挑战
                  </button>
                  <button
                    onClick={() => {
                      setShowResult(false);
                      onBack();
                    }}
                    className="w-full rounded-2xl bg-zinc-800 py-4 font-bold text-white transition hover:bg-zinc-700"
                  >
                    返回热点库
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideButton({ label, onClick, children, active = false }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-white">
      <span className={cn('flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur', active && 'bg-orange-500 text-black')}>
        {children}
      </span>
      <span className="text-[10px] font-bold drop-shadow">{label}</span>
    </button>
  );
}

function ResizeHandle({
  mode,
  className,
  onPointerDown,
  showGrip = false,
}: {
  mode: DragMode;
  className: string;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, mode: DragMode) => void;
  showGrip?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="调整动作窗口大小"
      className={cn('absolute z-20 bg-transparent', className)}
      onPointerDown={(event) => onPointerDown(event, mode)}
    >
      {showGrip && (
        <span className="absolute bottom-1 right-1 block h-3 w-3 rounded-br-[10px] border-b-2 border-r-2 border-white/80" />
      )}
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
