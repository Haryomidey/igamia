import React, { useEffect, useRef, useState } from 'react';
import {
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

type CommunityVideoPlayerProps = {
  src: string;
  className?: string;
  autoPlay?: boolean;
  mutedByDefault?: boolean;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CommunityVideoPlayer({
  src,
  className = '',
  autoPlay = false,
  mutedByDefault = false,
}: CommunityVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(mutedByDefault);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = mutedByDefault;
  }, [mutedByDefault]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextTime = Number(event.target.value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await video.requestFullscreen();
  };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-black/40 ${className}`}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        autoPlay={autoPlay}
        className="h-full w-full bg-black/40 object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (!video) {
            return;
          }

          setDuration(video.duration || 0);
          setCurrentTime(video.currentTime || 0);
          setIsMuted(video.muted);
          setIsReady(true);
        }}
        onTimeUpdate={() => {
          const video = videoRef.current;
          if (!video) {
            return;
          }

          setCurrentTime(video.currentTime);
        }}
      />

      <button
        type="button"
        onClick={() => void togglePlayback()}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/35 via-transparent to-transparent"
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition-transform hover:scale-105">
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </span>
      </button>

      <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-[#09070f] via-[#09070f]/85 to-transparent px-4 pb-4 pt-12">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          disabled={!isReady || duration <= 0}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-brand-primary disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void togglePlayback()}
              className="rounded-full border border-white/10 bg-white/10 p-2.5 transition-colors hover:bg-white/15"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full border border-white/10 bg-white/10 p-2.5 transition-colors hover:bg-white/15"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleFullscreen()}
            className="rounded-full border border-white/10 bg-white/10 p-2.5 transition-colors hover:bg-white/15"
            aria-label="Toggle fullscreen"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
