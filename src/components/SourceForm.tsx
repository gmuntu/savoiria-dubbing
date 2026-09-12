import React, { useRef, useState } from 'react';
import { Upload, Youtube, FileText, Key, Play, Sparkles, Wand2, Zap, Clock, Bookmark, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { YouTubeInfo, VoiceCloneProfile } from '../types';

interface SourceFormProps {
  youtubeUrl: string;
  setYoutubeUrl: (val: string) => void;
  youtubeInfo?: YouTubeInfo | null;
  isDetectingYouTube?: boolean;
  videoFileName: string | null;
  setVideoFileName: (val: string | null) => void;
  srtContent: string;
  setSrtContent: (val: string) => void;
  srtFileName: string | null;
  setSrtFileName: (val: string | null) => void;
  engineChoice: 'gemini' | 'ollama';
  setEngineChoice: (val: 'gemini' | 'ollama') => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  speedMode: 'turbo' | 'standard';
  setSpeedMode: (val: 'turbo' | 'standard') => void;
  toneStyle: 'natural' | 'compact' | 'tech';
  setToneStyle: (val: 'natural' | 'compact' | 'tech') => void;
  voiceProfileId: string;
  setVoiceProfileId: (val: string) => void;
  voiceProfiles?: VoiceCloneProfile[];
  lastDurationMs: number | null;
  onStep1: () => void;
  onStep2: () => void;
  onExpress: () => void;
  isLoadingStep1: boolean;
  isLoadingStep2: boolean;
  isLoadingExpress: boolean;
  hasSegments: boolean;
}

export const SourceForm: React.FC<SourceFormProps> = ({
  youtubeUrl,
  setYoutubeUrl,
  youtubeInfo,
  isDetectingYouTube = false,
  videoFileName,
  setVideoFileName,
  srtContent,
  setSrtContent,
  srtFileName,
  setSrtFileName,
  engineChoice,
  setEngineChoice,
  apiKey,
  setApiKey,
  speedMode,
  setSpeedMode,
  toneStyle,
  setToneStyle,
  voiceProfileId,
  setVoiceProfileId,
  voiceProfiles,
  lastDurationMs,
  onStep1,
  onStep2,
  onExpress,
  isLoadingStep1,
  isLoadingStep2,
  isLoadingExpress,
  hasSegments,
}) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const [dragOverVideo, setDragOverVideo] = useState(false);
  const [showDirectPaste, setShowDirectPaste] = useState(false);

  const availableProfiles: VoiceCloneProfile[] = (voiceProfiles && voiceProfiles.length > 0) ? voiceProfiles : [
    {
      id: 'cs50_malan',
      name: 'David J. Malan (CS50)',
      speaker: 'David J. Malan',
      gender: 'male',
      geminiVoice: 'Puck',
      description: 'Voix masculine énergique, vive, articulée et dynamique (Harvard CS50)',
      matchScore: 98
    },
    {
      id: 'zoo_jawed',
      name: 'Jawed Karim (Zoo)',
      speaker: 'Jawed Karim',
      gender: 'male',
      geminiVoice: 'Charon',
      description: 'Voix masculine jeune, posée, détendue et conversationnelle',
      matchScore: 95
    },
    {
      id: 'doc_narrator',
      name: 'Narrateur Documentaire',
      speaker: 'Narrateur Pro',
      gender: 'male',
      geminiVoice: 'Fenrir',
      description: 'Voix masculine grave, chaleureuse, immersive et posée',
      matchScore: 96
    },
    {
      id: 'female_educator',
      name: 'Présentatrice / Enseignante',
      speaker: 'Claire Morel',
      gender: 'female',
      geminiVoice: 'Kore',
      description: 'Voix féminine naturelle, claire, expressive et pédagogique',
      matchScore: 97
    },
    {
      id: 'female_calm',
      name: 'Narratrice Douce',
      speaker: 'Sophie Laurent',
      gender: 'female',
      geminiVoice: 'Zephyr',
      description: 'Voix féminine apaisante, limpide et fluide',
      matchScore: 95
    }
  ];

  const currentProfile = availableProfiles.find(p => p.id === voiceProfileId) || availableProfiles[0];

  const handleVideoUpload = (file: File) => {
    setVideoFileName(file.name);
  };

  const handleSrtUpload = (file: File) => {
    setSrtFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setSrtContent(text);
    };
    reader.readAsText(file);
  };

  const loadPreset = (name: string, url: string, srt: string) => {
    setYoutubeUrl(url);
    setSrtContent(srt);
    setSrtFileName(`${name}.srt`);
  };

  return (
    <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-xs">
      {/* 1. Presets Rapides */}
      <div className="mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Exemples de Test Rapide</span>
          </span>
          {lastDurationMs !== null && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              <span>{lastDurationMs} ms</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => loadPreset(
              'cs50_harvard',
              'https://www.youtube.com/watch?v=HJP0a6vKvlo&list=PLhQjrBD2T380hlTqAU8HfvVepCcjCqTg6&index=1&pp=iAQB',
              `1\n00:00:01,000 --> 00:00:05,200\nThis is CS50x, Harvard University's introduction to the intellectual enterprises of computer science.\n\n2\n00:00:05,800 --> 00:00:10,500\nAnd the art of programming for majors and non-majors alike, with or without prior programming experience.\n\n3\n00:00:11,000 --> 00:00:16,400\nAn entry-level course taught by David J. Malan, CS50x teaches students how to think algorithmically.\n\n4\n00:00:17,000 --> 00:00:22,000\nAnd solve problems efficiently using languages like C, Python, SQL, plus HTML, CSS, and JavaScript.`
            )}
            className="text-[11px] font-bold py-1.5 px-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 transition-colors truncate text-center cursor-pointer"
          >
            🎓 CS50x Harvard
          </button>
          <button
            type="button"
            onClick={() => loadPreset(
              'zoo',
              'https://www.youtube.com/watch?v=jNQXAC9IVRw',
              `1\n00:00:01,100 --> 00:00:04,800\nAll right, so here we are in front of the elephants.\n\n2\n00:00:05,000 --> 00:00:09,600\nThe cool thing about these guys is that they have really, really, really long trunks.\n\n3\n00:00:10,200 --> 00:00:14,100\nAnd that's, that's cool. And that's pretty much all there is to say.`
            )}
            className="text-[11px] font-semibold py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-colors truncate text-center cursor-pointer"
          >
            🐘 Zoo (Classique)
          </button>
          <button
            type="button"
            onClick={() => loadPreset(
              'tech_ai',
              'https://www.youtube.com/watch?v=sample_ai',
              `1\n00:00:00,500 --> 00:00:03,800\nWelcome to this quick tutorial on artificial intelligence models.\n\n2\n00:00:04,000 --> 00:00:08,200\nToday we are going to learn how neural networks process natural language in real time.\n\n3\n00:00:08,500 --> 00:00:12,000\nLet's get started and run our first deep learning inference.`
            )}
            className="text-[11px] font-semibold py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-colors truncate text-center cursor-pointer"
          >
            💻 Tuto Tech & IA
          </button>
          <button
            type="button"
            onClick={() => loadPreset(
              'nature_doc',
              'https://www.youtube.com/watch?v=sample_nature',
              `1\n00:00:01,000 --> 00:00:04,500\nDeep in the rainforest, creatures awake at the dawn of a new day.\n\n2\n00:00:05,000 --> 00:00:09,000\nThe canopy provides shelter for thousands of unique and rare species.\n\n3\n00:00:09,500 --> 00:00:13,200\nEvery sound here is part of a complex and ancient ecosystem.`
            )}
            className="text-[11px] font-semibold py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-colors truncate text-center cursor-pointer"
          >
            🌿 Documentaire
          </button>
        </div>
      </div>

      {/* 2. Source Vidéo */}
      <h3 className="text-lg font-bold text-[#212529] mb-2 flex items-center gap-2">
        <Youtube className="w-5 h-5 text-red-600" />
        <span>Source Vidéo</span>
      </h3>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lien YouTube (playlists & paramètres supportés)
            </label>
            {isDetectingYouTube && (
              <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Analyse du lien...</span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-white text-slate-800 border-1.5 border-[#dee2e6] focus:border-[#3b5bdb] rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-100"
            />
          </div>

          {/* YouTube Video Detected Badge & Card */}
          {youtubeInfo && (
            <div className="mt-2.5 p-2.5 bg-gradient-to-r from-red-50/70 via-indigo-50/40 to-slate-50 border border-red-200/80 rounded-xl flex items-center gap-3 animate-fade-in shadow-2xs">
              <img
                src={youtubeInfo.thumbnailUrl}
                alt={youtubeInfo.title}
                className="w-16 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 uppercase">
                    <CheckCircle2 className="w-3 h-3 text-red-600" />
                    <span>Lien Validé</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">ID: {youtubeInfo.videoId}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5" title={youtubeInfo.title}>
                  {youtubeInfo.title}
                </h4>
                <p className="text-[11px] text-slate-600 truncate">
                  Chaîne : <span className="font-semibold text-slate-800">{youtubeInfo.author}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs font-semibold text-[#adb5bd] my-1">
          — OU —
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Fichier Vidéo Local
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverVideo(true);
            }}
            onDragLeave={() => setDragOverVideo(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverVideo(false);
              if (e.dataTransfer.files?.[0]) {
                handleVideoUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => videoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              dragOverVideo
                ? 'border-[#3b5bdb] bg-indigo-50/50'
                : videoFileName
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-[#dee2e6] hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleVideoUpload(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-6 h-6 mx-auto mb-1.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">
              {videoFileName ? `Fichier prêt : ${videoFileName}` : 'Glisser-déposer ou cliquer pour importer'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">MP4, MKV, MOV, WebM</p>
          </div>
        </div>
      </div>

      {/* 3. Transcription & Sous-titres */}
      <h3 className="text-lg font-bold text-[#212529] mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" />
        <span>Transcription & Sous-titres</span>
      </h3>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sous-titres (SRT) ou Texte Direct
            </label>
            <button
              type="button"
              onClick={() => setShowDirectPaste(!showDirectPaste)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              {showDirectPaste ? 'Masquer la saisie texte' : 'Coller du texte ou SRT'}
            </button>
          </div>

          <div
            onClick={() => srtInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
              srtFileName || srtContent
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-[#dee2e6] hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={srtInputRef}
              type="file"
              accept=".srt,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleSrtUpload(e.target.files[0]);
                }
              }}
            />
            <FileText className="w-5 h-5 mx-auto mb-1 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 truncate px-2">
              {srtFileName
                ? `Fichier chargé : ${srtFileName}`
                : srtContent
                ? 'Sous-titres personnalisés en mémoire'
                : 'Glisser un fichier SRT ou laisser vide (Whisper automatique)'}
            </p>
          </div>

          {showDirectPaste && (
            <div className="mt-2 animate-fade-in">
              <textarea
                rows={4}
                value={srtContent}
                onChange={(e) => setSrtContent(e.target.value)}
                placeholder="Collez ici votre fichier SRT ou les phrases anglaises à traduire..."
                className="w-full text-xs font-mono-code p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Moteur & Vitesse de Traduction */}
      <h3 className="text-lg font-bold text-[#212529] mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <span>Moteur & Performance de Traduction</span>
      </h3>

      <div className="space-y-3 mb-4">
        {/* Speed Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Mode d'Exécution</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-500" />
              <span>Recommandé</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSpeedMode('turbo')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                speedMode === 'turbo'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>Mode Turbo</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Traduction batch JSON instantanée & cache</p>
            </button>

            <button
              type="button"
              onClick={() => setSpeedMode('standard')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                speedMode === 'standard'
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mode Standard</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Traduction séquentielle segment par segment</p>
            </button>
          </div>
        </div>

        {/* Tone Style */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Style & Cadence de Traduction
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'natural', label: 'Naturel Oral', desc: 'YouTube & Podcast' },
              { id: 'compact', label: 'Concis & Rapide', desc: 'Débit accéléré' },
              { id: 'tech', label: 'Technique', desc: 'Tutoriels & IA' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setToneStyle(style.id as any)}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  toneStyle === style.id
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white text-xs'
                }`}
              >
                <div className="text-xs font-bold truncate">{style.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Engine selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Choix du Moteur IA
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEngineChoice('gemini')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                engineChoice === 'gemini'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Gemini 3.8 Flash</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-extrabold">Turbo</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Ultra-rapide (50-200ms)</p>
            </button>

            <button
              type="button"
              onClick={() => setEngineChoice('ollama')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                engineChoice === 'ollama'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">Ollama (Local)</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Mode autonome offline</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Clé API Gemini (Optionnelle si configurée sur serveur)</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy... (Optionnelle)"
            className="w-full bg-white text-slate-800 border-1.5 border-[#dee2e6] focus:border-[#3b5bdb] rounded-xl px-4 py-2 text-xs transition-all focus:outline-none focus:ring-3 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* 5. Clonage Vocal & Timbre du Locuteur Original */}
      <div className="mb-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-[#212529] flex items-center gap-2">
            <span className="text-lg">🎙️</span>
            <span>Clonage Vocal du Locuteur Original</span>
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Non-Robotique • 24kHz HD</span>
          </span>
        </div>

        {/* Active Profile Summary Card */}
        <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 rounded-xl border border-indigo-200/80 mb-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧬</span>
              <div>
                <p className="text-xs font-black text-indigo-950">
                  {currentProfile.name}
                </p>
                <p className="text-[11px] text-indigo-700 font-medium">
                  {currentProfile.description}
                </p>
              </div>
            </div>
            <div className="text-right pl-2">
              <span className="inline-block text-[11px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                {currentProfile.matchScore}% Ressemblance
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Voix: {currentProfile.geminiVoice} (HD)
              </p>
            </div>
          </div>
        </div>

        {/* Profile Selector Buttons */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Sélectionner un Profil Vocal à Cloner :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setVoiceProfileId(p.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  voiceProfileId === p.id
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-500 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{p.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">
                    {p.matchScore}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {p.gender === 'male' ? '👨 Homme' : '👩 Femme'} • {p.geminiVoice}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Actions */}
      <div className="border-t border-slate-100 pt-4 space-y-2.5">
        <h3 className="text-base font-bold text-[#212529] mb-2 flex items-center justify-between">
          <span>⚡ Actions</span>
          {speedMode === 'turbo' && (
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Optimisation active</span>
            </span>
          )}
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onStep1}
            disabled={isLoadingStep1 || isLoadingExpress}
            className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-[#3b5bdb] to-[#4c6ef5] hover:from-[#364fc7] hover:to-[#3b5bdb] text-white font-bold text-xs tracking-tight shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoadingStep1 ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span>1. Analyser & Traduire</span>
          </button>

          <button
            type="button"
            onClick={onStep2}
            disabled={isLoadingStep2 || isLoadingExpress || !hasSegments}
            className="w-full py-3 px-3 rounded-xl bg-white border-1.5 border-[#dee2e6] hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-xs tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoadingStep2 ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full" />
            ) : (
              <Play className="w-4 h-4 text-indigo-600" />
            )}
            <span>2. Générer & Assembler</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onExpress}
          disabled={isLoadingStep1 || isLoadingStep2 || isLoadingExpress}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm tracking-tight shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoadingExpress ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <span>🚀</span>
          )}
          <span>Tout-en-Un Express (Sans Pause)</span>
        </button>
      </div>
    </div>
  );
};
