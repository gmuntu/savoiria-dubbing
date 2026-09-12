import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MetricsGrid } from './components/MetricsGrid';
import { SourceForm } from './components/SourceForm';
import { SegmentsTable } from './components/SegmentsTable';
import { VideoPlayer } from './components/VideoPlayer';
import { TelemetryConsole } from './components/TelemetryConsole';
import { DubbingSegment, YouTubeInfo, VoiceCloneProfile } from './types';

// Helper to extract YouTube video ID
function cleanYouTubeId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const cleaned = rawUrl.trim().replace(/[,.;]+$/, '');
  const match = cleaned.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// Safe JSON response parser that prevents "Unexpected token 'u', upstream request timeout" crashes
async function parseResponseSafe<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    if (text.includes('upstream') || text.includes('timeout') || res.status === 504) {
      throw new Error('Délai d\'attente serveur dépassé (504 Gateway Timeout). Le traitement a été optimisé pour le prochain essai.');
    }
    if (res.status === 502) {
      throw new Error('Passerelle temporairement indisponible (502 Bad Gateway).');
    }
    try {
      const errJson = JSON.parse(text);
      if (errJson.error) throw new Error(errJson.error);
    } catch {
      // not json
    }
    throw new Error(`Erreur HTTP ${res.status}: ${text.slice(0, 120)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.includes('upstream') || text.includes('timeout')) {
      throw new Error('Délai réseau dépassé lors de la communication avec le serveur.');
    }
    throw new Error(`Réponse inattendue du serveur: ${text.slice(0, 100)}`);
  }
}

export const App: React.FC = () => {
  // Input states
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=HJP0a6vKvlo&list=PLhQjrBD2T380hlTqAU8HfvVepCcjCqTg6&index=1&pp=iAQB');
  const [youtubeInfo, setYoutubeInfo] = useState<YouTubeInfo | null>(null);
  const [isDetectingYouTube, setIsDetectingYouTube] = useState<boolean>(false);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [srtFileName, setSrtFileName] = useState<string | null>(null);
  const [engineChoice, setEngineChoice] = useState<'gemini' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState<string>('');

  // Performance, translation & voice cloning options
  const [speedMode, setSpeedMode] = useState<'turbo' | 'standard'>('turbo');
  const [toneStyle, setToneStyle] = useState<'natural' | 'compact' | 'tech'>('natural');
  const [voiceProfileId, setVoiceProfileId] = useState<string>('cs50_malan');
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceCloneProfile[]>([]);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [isRetranslatingAll, setIsRetranslatingAll] = useState(false);

  // Pipeline states
  const [segments, setSegments] = useState<DubbingSegment[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDubbed, setIsDubbed] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    'ℹ️ SavoirIA Dubbing initialisé avec le pipeline de clonage vocal neuronal HD.',
    '🎙️ Zéro voix robotique : Synthèse naturelle 24kHz (Linear PCM) calibrée sur le locuteur original.',
    '⚡ Mode Turbo actif : Optimisé pour une traduction instantanée par JSON structuré et cache mémoire.',
    '📺 Détection automatique des flux YouTube (playlists & paramètres &list= supportés).',
    '👉 Cliquez sur "1. Analyser & Traduire" pour lancer le doublage.'
  ]);

  // Load voice profiles from server
  useEffect(() => {
    fetch('/api/dubbing/voice-profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVoiceProfiles(data);
        } else if (data.profiles && Array.isArray(data.profiles)) {
          setVoiceProfiles(data.profiles);
        }
      })
      .catch(() => {
        // use fallback profiles
      });
  }, []);

  // Loading states
  const [isLoadingStep1, setIsLoadingStep1] = useState(false);
  const [isLoadingStep2, setIsLoadingStep2] = useState(false);
  const [isLoadingExpress, setIsLoadingExpress] = useState(false);

  const appendLogs = (newLogs: string[]) => {
    setLogs((prev) => [...prev, ...newLogs]);
  };

  // Debounced detection of YouTube video metadata
  const lastDetectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const videoId = cleanYouTubeId(youtubeUrl);
    if (!videoId) {
      setYoutubeInfo(null);
      return;
    }

    if (videoId === lastDetectedIdRef.current) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsDetectingYouTube(true);
      try {
        const res = await fetch(`/api/dubbing/youtube-info?url=${encodeURIComponent(youtubeUrl)}`);
        const data: YouTubeInfo = await parseResponseSafe<YouTubeInfo>(res);
        if (!isCancelled) {
            lastDetectedIdRef.current = data.videoId;
            setYoutubeInfo(data);
            setVideoUrl(`https://www.youtube.com/watch?v=${data.videoId}`);
            
            // Auto-detect best voice clone profile based on video
            const lowerTitle = (data.title || '').toLowerCase();
            const lowerAuthor = (data.author || '').toLowerCase();
            if (data.videoId === 'jNQXAC9IVRw' || lowerTitle.includes('zoo') || lowerAuthor.includes('jawed')) {
              setVoiceProfileId('zoo_jawed');
            } else if (data.videoId === 'HJP0a6vKvlo' || lowerTitle.includes('cs50') || lowerTitle.includes('malan') || lowerAuthor.includes('cs50')) {
              setVoiceProfileId('cs50_malan');
            }

            appendLogs([
              `📺 [YouTube Détecté] ID : ${data.videoId}`,
              `   🎬 Titre : "${data.title}"`,
              `   👤 Chaîne : ${data.author}`,
              `   ⚡ Source validée et profil vocal configuré !`
            ]);
          }
      } catch (e) {
        // ignore fetch error
      } finally {
        if (!isCancelled) setIsDetectingYouTube(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [youtubeUrl]);

  // 1. Step 1: Analyze & Translate
  const handleStep1 = async () => {
    setIsLoadingStep1(true);
    setIsDubbed(false);

    const videoId = cleanYouTubeId(youtubeUrl);
    const videoLabel = youtubeInfo?.title ? `"${youtubeInfo.title}"` : (videoId ? `YouTube ID ${videoId}` : 'Fichier');

    // Immediate log so user NEVER sees an empty terminal
    appendLogs([
      `🚀 [Étape 1] Lancement du traitement pour : ${videoLabel}...`,
      `⏳ Connexion au serveur d'analyse et extraction audio en cours...`
    ]);

    try {
      const res = await fetch('/api/dubbing/step1-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl,
          srtContent,
          engine: engineChoice,
          apiKey: apiKey.trim() || undefined,
          speedMode,
          toneStyle,
        }),
      });

      const data = await parseResponseSafe<any>(res);
      if (data.logs) {
        appendLogs(data.logs);
      }
      if (data.segments) {
        setSegments(data.segments);
      }
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      }
      if (data.youtubeInfo) {
        setYoutubeInfo(data.youtubeInfo);
      }
      if (data.durationMs) {
        setLastDurationMs(data.durationMs);
      }
    } catch (err: any) {
      appendLogs([`❌ Erreur lors de l'Étape 1 : ${err.message || err}`]);
    } finally {
      setIsLoadingStep1(false);
    }
  };

  // Fast single-segment retranslation
  const handleFastTranslateSegment = async (id: number, original: string, tone: 'natural' | 'compact' | 'tech') => {
    appendLogs([`⚡ [Traduction Rapide] Retraduction du segment #${id + 1} (Style: ${tone})...`]);
    try {
      const res = await fetch('/api/dubbing/fast-translate-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original,
          tone,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await parseResponseSafe<any>(res);
      if (data.translation) {
        setSegments((prev) =>
          prev.map((seg) => (seg.id === id ? { ...seg, translation: data.translation } : seg))
        );
        const timing = data.durationMs ? `en ${data.durationMs}ms` : '';
        const source = data.cached ? '(depuis le cache)' : '';
        appendLogs([`   ✅ Segment #${id + 1} retraduit ${timing} ${source}: "${data.translation}"`]);
      } else if (data.error) {
        appendLogs([`   ⚠️ Erreur traduction rapide : ${data.error}`]);
      }
    } catch (err: any) {
      appendLogs([`   ❌ Erreur traduction rapide : ${err.message || err}`]);
    }
  };

  // Retranslate all segments with current style
  const handleRetranslateAll = async () => {
    if (segments.length === 0) return;
    setIsRetranslatingAll(true);
    appendLogs([`🔄 [Retraduction Rapide] Retraduction des ${segments.length} segments avec style "${toneStyle}"...`]);
    try {
      let srt = '';
      segments.forEach((seg, idx) => {
        const formatTime = (sec: number) => {
          const h = Math.floor(sec / 3600).toString().padStart(2, '0');
          const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
          const s = Math.floor(sec % 60).toString().padStart(2, '0');
          const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
          return `${h}:${m}:${s},${ms}`;
        };
        srt += `${idx + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.original}\n\n`;
      });

      const res = await fetch('/api/dubbing/step1-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl,
          srtContent: srt,
          engine: engineChoice,
          apiKey: apiKey.trim() || undefined,
          speedMode,
          toneStyle,
        }),
      });

      const data = await parseResponseSafe<any>(res);
      if (data.logs) appendLogs(data.logs);
      if (data.segments) setSegments(data.segments);
      if (data.durationMs) setLastDurationMs(data.durationMs);
    } catch (err: any) {
      appendLogs([`❌ Erreur retraduction : ${err.message || err}`]);
    } finally {
      setIsRetranslatingAll(false);
    }
  };

  // 2. Step 2: Synthesize & Assemble
  const handleStep2 = async () => {
    if (segments.length === 0) {
      appendLogs(['❌ Aucun tableau de segments disponible. Veuillez d\'abord lancer l\'Étape 1.']);
      return;
    }

    setIsLoadingStep2(true);
    appendLogs([
      '🎙️ [Étape 2] Démarrage du clonage vocal neuronal HD...',
      `🧬 Profil sélectionné : ${voiceProfileId} (Gemini Neural TTS Studio 24kHz)...`,
      '⏳ Synthèse vocale sans voix robotique en cours...'
    ]);

    try {
      const res = await fetch('/api/dubbing/step2-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments,
          videoUrl,
          voiceProfileId,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await parseResponseSafe<any>(res);
      if (data.logs) {
        appendLogs(data.logs);
      }
      if (data.segments) {
        setSegments(data.segments);
      }
      if (data.success) {
        setIsDubbed(true);
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
        }
      }
    } catch (err: any) {
      appendLogs([`❌ Erreur réseau lors de l'Étape 2 : ${err.message || err}`]);
    } finally {
      setIsLoadingStep2(false);
    }
  };

  // 3. Express Workflow (All-in-One)
  const handleExpress = async () => {
    setIsLoadingExpress(true);
    setIsDubbed(false);
    try {
      appendLogs([
        '🚀 LANCEMENT DU WORKFLOW TOUT-EN-UN EXPRESS (SANS PAUSE)...',
        '⏳ Étape 1 : Analyse & Traduction automatique en cours...'
      ]);

      // Step 1
      const res1 = await fetch('/api/dubbing/step1-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl,
          srtContent,
          engine: engineChoice,
          apiKey: apiKey.trim() || undefined,
          speedMode,
          toneStyle,
        }),
      });

      const data1 = await parseResponseSafe<any>(res1);
      if (data1.logs) appendLogs(data1.logs);
      if (data1.segments) setSegments(data1.segments);
      if (data1.videoUrl) setVideoUrl(data1.videoUrl);
      if (data1.youtubeInfo) setYoutubeInfo(data1.youtubeInfo);
      if (data1.durationMs) setLastDurationMs(data1.durationMs);

      const analyzedSegments = data1.segments || [];
      if (analyzedSegments.length === 0) {
        appendLogs(['⚠️ Aucun segment n\'a pu être extrait. Fin de la séquence Express.']);
        return;
      }

      appendLogs([
        '🎙️ Étape 2 : Synthèse vocale neuronale immédiate...',
        `🧬 Profil de clonage : ${voiceProfileId} (24kHz HD, Zéro Robotique)`
      ]);

      // Step 2 directly
      const res2 = await fetch('/api/dubbing/step2-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: analyzedSegments,
          videoUrl: data1.videoUrl || videoUrl,
          voiceProfileId,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data2 = await parseResponseSafe<any>(res2);
      if (data2.logs) appendLogs(data2.logs);
      if (data2.segments) setSegments(data2.segments);
      if (data2.success) {
        setIsDubbed(true);
        if (data2.videoUrl) setVideoUrl(data2.videoUrl);
      }
    } catch (err: any) {
      appendLogs([`❌ Erreur lors du workflow Express : ${err.message || err}`]);
    } finally {
      setIsLoadingExpress(false);
    }
  };

  // Segment Table modifications
  const handleUpdateSegment = (id: number, field: keyof DubbingSegment, value: any) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, [field]: value } : seg))
    );
  };

  const handleAddSegment = () => {
    const nextId = segments.length > 0 ? Math.max(...segments.map((s) => s.id)) + 1 : 0;
    const lastSeg = segments[segments.length - 1];
    const nextStart = lastSeg ? Math.round((lastSeg.end + 0.5) * 10) / 10 : 0.0;
    const nextEnd = Math.round((nextStart + 3.0) * 10) / 10;

    const newSeg: DubbingSegment = {
      id: nextId,
      start: nextStart,
      end: nextEnd,
      original: 'New dialogue line',
      translation: 'Nouvelle ligne de dialogue'
    };

    setSegments((prev) => [...prev, newSeg]);
    appendLogs([`➕ Segment manuel #${nextId + 1} ajouté (${nextStart}s → ${nextEnd}s).`]);
  };

  const handleDeleteSegment = (id: number) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id));
    appendLogs([`🗑️ Segment #${id + 1} supprimé.`]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529] font-sans pb-12">
      {/* 1. Navbar */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 2. Titre & Badge */}
        <HeroSection />

        {/* 3. Statistiques & Pipeline avec Graphique de Répartition Temporelle Recharts */}
        <MetricsGrid
          segments={segments}
          onSelectSegment={(id) => {
            const el = document.getElementById(`segment-row-${id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('bg-amber-100/70');
              setTimeout(() => el.classList.remove('bg-amber-100/70'), 1800);
            }
          }}
        />

        {/* 4. Zone Principale : 2 colonnes asymétriques */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne Gauche : Configuration & Actions (scale 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            <SourceForm
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              youtubeInfo={youtubeInfo}
              isDetectingYouTube={isDetectingYouTube}
              videoFileName={videoFileName}
              setVideoFileName={setVideoFileName}
              srtContent={srtContent}
              setSrtContent={setSrtContent}
              srtFileName={srtFileName}
              setSrtFileName={setSrtFileName}
              engineChoice={engineChoice}
              setEngineChoice={setEngineChoice}
              apiKey={apiKey}
              setApiKey={setApiKey}
              speedMode={speedMode}
              setSpeedMode={setSpeedMode}
              toneStyle={toneStyle}
              setToneStyle={setToneStyle}
              voiceProfileId={voiceProfileId}
              setVoiceProfileId={setVoiceProfileId}
              voiceProfiles={voiceProfiles}
              lastDurationMs={lastDurationMs}
              onStep1={handleStep1}
              onStep2={handleStep2}
              onExpress={handleExpress}
              isLoadingStep1={isLoadingStep1}
              isLoadingStep2={isLoadingStep2}
              isLoadingExpress={isLoadingExpress}
              hasSegments={segments.length > 0}
            />
          </div>

          {/* Colonne Droite : Édition Manuelle & Résultat (scale 7/12) */}
          <div className="lg:col-span-7 space-y-6">
            <SegmentsTable
              segments={segments}
              onUpdateSegment={handleUpdateSegment}
              onAddSegment={handleAddSegment}
              onDeleteSegment={handleDeleteSegment}
              onFastTranslateSegment={handleFastTranslateSegment}
              onRetranslateAll={handleRetranslateAll}
              isRetranslatingAll={isRetranslatingAll}
              voiceProfileId={voiceProfileId}
              apiKey={apiKey}
            />

            <VideoPlayer
              videoUrl={videoUrl}
              youtubeUrl={youtubeUrl}
              youtubeInfo={youtubeInfo}
              segments={segments}
              isDubbed={isDubbed}
              voiceProfileId={voiceProfileId}
              onUpdateSegmentAudio={(id, audioUrl) => handleUpdateSegment(id, 'audioUrl', audioUrl)}
              apiKey={apiKey}
            />
          </div>
        </div>

        {/* 5. Console de Télémétrie */}
        <TelemetryConsole
          logs={logs}
          onClear={() => setLogs(['Journal effacé.'])}
        />

        <footer className="mt-8 text-center text-xs text-slate-400 font-medium pb-6">
          SavoirIA Dubbing — Créé par Ghislain Muntu • Alimenté par Gemini 3.8 Flash, Whisper & F5-TTS
        </footer>
      </div>
    </div>
  );
};

export default App;
