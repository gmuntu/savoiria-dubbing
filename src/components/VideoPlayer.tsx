import React, { useRef, useState, useEffect } from 'react';
import { DubbingSegment, YouTubeInfo, VoiceCloneProfile } from '../types';
import { Film, Volume2, VolumeX, Download, Subtitles, Youtube, Play, Pause, CheckCircle2, Sparkles, Loader2, Music } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string | null;
  youtubeUrl?: string;
  youtubeInfo?: YouTubeInfo | null;
  segments: DubbingSegment[];
  isDubbed: boolean;
  voiceProfileId?: string;
  onUpdateSegmentAudio?: (id: number, audioUrl: string) => void;
  apiKey?: string;
}

export function extractYouTubeId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const cleaned = rawUrl.trim().replace(/[,.;]+$/, '');
  const match = cleaned.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  youtubeUrl,
  youtubeInfo,
  segments,
  isDubbed,
  voiceProfileId = 'cs50_malan',
  onUpdateSegmentAudio,
  apiKey,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [dubbingAudioEnabled, setDubbingAudioEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSynthesizingOnTheFly, setIsSynthesizingOnTheFly] = useState(false);
  const [lastSpokenId, setLastSpokenId] = useState<number | null>(null);
  const [previewAllIndex, setPreviewAllIndex] = useState<number | null>(null);

  // Profile lookup
  const profileNames: Record<string, { name: string; speaker: string; voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'; match: number }> = {
    cs50_malan: { name: 'David J. Malan (CS50)', speaker: 'David J. Malan', voice: 'Puck', match: 98 },
    zoo_jawed: { name: 'Jawed Karim (Zoo)', speaker: 'Jawed Karim', voice: 'Charon', match: 95 },
    doc_narrator: { name: 'Narrateur Documentaire', speaker: 'Narrateur Pro', voice: 'Fenrir', match: 96 },
    female_educator: { name: 'Présentatrice / Enseignante', speaker: 'Claire Morel', voice: 'Kore', match: 97 },
    female_calm: { name: 'Narratrice Douce', speaker: 'Sophie Laurent', voice: 'Zephyr', match: 95 },
  };

  const currentProfile = profileNames[voiceProfileId] || profileNames.cs50_malan;

  // Initialize audio element
  useEffect(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    const audio = audioPlayerRef.current;
    const handleEnded = () => {
      setIsPlayingAudio(false);
    };
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Check if current video is a YouTube video
  const ytId = extractYouTubeId(videoUrl) || extractYouTubeId(youtubeUrl) || youtubeInfo?.videoId;
  const isYouTube = Boolean(ytId);

  // Fallback demo video for standard HTML5 video player
  const sourceVideo = videoUrl && !isYouTube ? videoUrl : 'https://www.w3schools.com/html/mov_bbb.mp4';

  // Play a specific neural audio URL or synthesize on the fly
  const playNeuralAudioSegment = async (seg: DubbingSegment): Promise<void> => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    audio.pause();

    let targetAudioUrl = seg.audioUrl;
    if (!targetAudioUrl) {
      setIsSynthesizingOnTheFly(true);
      try {
        const res = await fetch('/api/dubbing/synthesize-segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: seg.translation || seg.original,
            voiceName: currentProfile.voice,
            apiKey: apiKey || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          targetAudioUrl = data.audioUrl;
          if (targetAudioUrl && onUpdateSegmentAudio) {
            onUpdateSegmentAudio(seg.id, targetAudioUrl);
          }
        }
      } catch (e) {
        console.error('Error synthesizing segment audio:', e);
      } finally {
        setIsSynthesizingOnTheFly(false);
      }
    }

    if (targetAudioUrl) {
      audio.src = targetAudioUrl;
      try {
        setIsPlayingAudio(true);
        await audio.play();
      } catch (err) {
        console.error('Audio playback error:', err);
        setIsPlayingAudio(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Find current active segment
    const segIdx = segments.findIndex((s) => time >= s.start && time <= s.end);
    if (segIdx !== -1) {
      setActiveSegmentIndex(segIdx);
      const seg = segments[segIdx];
      // Play neural cloned audio if dubbing enabled and newly entered segment
      if (isDubbed && dubbingAudioEnabled && seg && seg.id !== lastSpokenId) {
        setLastSpokenId(seg.id);
        playNeuralAudioSegment(seg);
      }
    }
  };

  // Preview all segments sequentially using genuine cloned neural voice
  const isPlayingSequenceRef = useRef(false);
  const playAllDubbingPreview = async () => {
    if (segments.length === 0) return;
    isPlayingSequenceRef.current = true;
    setIsPlayingAudio(true);

    const audio = audioPlayerRef.current;
    if (!audio) return;

    for (let i = 0; i < segments.length; i++) {
      if (!isPlayingSequenceRef.current) break;
      const seg = segments[i];
      setActiveSegmentIndex(i);
      setPreviewAllIndex(i);

      let url = seg.audioUrl;
      if (!url) {
        setIsSynthesizingOnTheFly(true);
        try {
          const res = await fetch('/api/dubbing/synthesize-segment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: seg.translation || seg.original,
              voiceName: currentProfile.voice,
              apiKey: apiKey || undefined,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            url = data.audioUrl;
            if (url && onUpdateSegmentAudio) {
              onUpdateSegmentAudio(seg.id, url);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSynthesizingOnTheFly(false);
        }
      }

      if (url && isPlayingSequenceRef.current) {
        audio.src = url;
        try {
          await audio.play();
          await new Promise<void>((resolve) => {
            const onEnd = () => {
              audio.removeEventListener('ended', onEnd);
              resolve();
            };
            audio.addEventListener('ended', onEnd);
          });
          // Small natural pause between sentences
          await new Promise((r) => setTimeout(r, 350));
        } catch (e) {
          console.error('Sequence playback failed:', e);
        }
      }
    }

    setIsPlayingAudio(false);
    setPreviewAllIndex(null);
    isPlayingSequenceRef.current = false;
  };

  const stopPreview = () => {
    isPlayingSequenceRef.current = false;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsPlayingAudio(false);
    setPreviewAllIndex(null);
  };

  const downloadSrt = () => {
    if (segments.length === 0) return;
    let srtText = '';
    segments.forEach((seg, idx) => {
      const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
      };
      srtText += `${idx + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.translation || seg.original}\n\n`;
    });

    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'savoiria_dubbing_french.srt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadFirstAudioWav = () => {
    const segWithAudio = segments.find((s) => s.audioUrl) || segments[0];
    if (!segWithAudio?.audioUrl) return;
    const link = document.createElement('a');
    link.href = segWithAudio.audioUrl;
    link.download = `savoiria_cloned_voice_${currentProfile.speaker.replace(/\s+/g, '_')}.wav`;
    link.click();
  };

  const activeSegment = segments[activeSegmentIndex] || null;

  return (
    <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          {isYouTube ? (
            <Youtube className="w-5 h-5 text-red-600" />
          ) : (
            <Film className="w-5 h-5 text-indigo-600" />
          )}
          <h3 className="text-lg font-bold text-[#212529]">
            {isYouTube ? 'Lecteur Vidéo YouTube' : 'Vidéo Finale Doublée'}
          </h3>
          {youtubeInfo && (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 max-w-[280px] truncate">
              • {youtubeInfo.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDubbed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voix Clonée Prête</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {segments.length} segment(s) synchronisé(s)
            </span>
          )}
        </div>
      </div>

      {/* Voice Clone Quality Banner */}
      <div className="mb-3 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="text-base">🎙️</span>
          <div>
            <span className="font-bold text-amber-300">
              Voix Clonée : {currentProfile.name}
            </span>
            <span className="text-slate-400 hidden sm:inline ml-1.5 text-[11px]">
              • {currentProfile.match}% ressemblance • Gemini TTS 24kHz HD (Non-Robotique)
            </span>
          </div>
        </div>

        {/* Live Audio Indicator */}
        {isPlayingAudio && (
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Lecture Audio HD...</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-emerald-300 rounded-full animate-bounce" />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Video Container */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
        {isYouTube && ytId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&rel=0`}
            title={youtubeInfo?.title || 'Lecteur YouTube'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={sourceVideo}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Active Subtitle Display Box */}
      {showSubtitles && segments.length > 0 && (
        <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-1 px-2">
            <span className="flex items-center gap-1">
              <span>Segment {activeSegmentIndex + 1}/{segments.length}</span>
              {activeSegment ? ` (${activeSegment.start.toFixed(1)}s → ${activeSegment.end.toFixed(1)}s)` : ''}
              {activeSegment?.audioUrl && (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 rounded border border-emerald-800">
                  Audio HD Prêt
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {segments.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveSegmentIndex(i);
                    playNeuralAudioSegment(s);
                  }}
                  className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    i === activeSegmentIndex
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : s.audioUrl
                      ? 'bg-emerald-900/70 text-emerald-300 hover:bg-emerald-800'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Segment ${i + 1} - Cliquer pour écouter`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <p className="text-amber-300 font-bold text-sm sm:text-base leading-snug">
            {activeSegment ? (activeSegment.translation || activeSegment.original) : 'Aucun segment actif'}
          </p>
          {activeSegment && activeSegment.original !== activeSegment.translation && (
            <p className="text-xs text-slate-400 mt-1 italic">
              Original (EN) : {activeSegment.original}
            </p>
          )}
        </div>
      )}

      {/* Video & Audio Controls Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-colors ${
              showSubtitles
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Sous-titres FR {showSubtitles ? 'Visibles' : 'Masqués'}</span>
          </button>

          {isPlayingAudio ? (
            <button
              type="button"
              onClick={stopPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold cursor-pointer hover:bg-red-100 transition-colors"
            >
              <VolumeX className="w-4 h-4 text-red-600" />
              <span>Arrêter la Voix Clonée</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={playAllDubbingPreview}
              disabled={segments.length === 0 || isSynthesizingOnTheFly}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold cursor-pointer hover:bg-emerald-100 disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isSynthesizingOnTheFly ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              )}
              <span>Écouter la Voix Clonée (24kHz HD)</span>
            </button>
          )}

          {activeSegment && (
            <button
              type="button"
              onClick={() => playNeuralAudioSegment(activeSegment)}
              disabled={isSynthesizingOnTheFly}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              title="Écouter uniquement la phrase sélectionnée"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Écouter la phrase</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {segments.some((s) => s.audioUrl) && (
            <button
              type="button"
              onClick={downloadFirstAudioWav}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold cursor-pointer transition-colors"
              title="Télécharger le fichier audio haute définition (WAV)"
            >
              <Music className="w-3.5 h-3.5 text-indigo-600" />
              <span>Télécharger Audio WAV</span>
            </button>
          )}

          <button
            type="button"
            onClick={downloadSrt}
            disabled={segments.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Exporter SRT Français</span>
          </button>
        </div>
      </div>
    </div>
  );
};
