import React, { useState, useRef } from 'react';
import { DubbingSegment } from '../types';
import { Volume2, Edit3, Plus, Trash2, Zap, RotateCw, Check, Loader2, Sparkles, VolumeX } from 'lucide-react';

interface SegmentsTableProps {
  segments: DubbingSegment[];
  onUpdateSegment: (id: number, field: keyof DubbingSegment, value: any) => void;
  onAddSegment: () => void;
  onDeleteSegment: (id: number) => void;
  onFastTranslateSegment?: (id: number, original: string, tone: 'natural' | 'compact' | 'tech') => Promise<void>;
  onRetranslateAll?: () => void;
  isRetranslatingAll?: boolean;
  voiceProfileId?: string;
  apiKey?: string;
}

export const SegmentsTable: React.FC<SegmentsTableProps> = ({
  segments,
  onUpdateSegment,
  onAddSegment,
  onDeleteSegment,
  onFastTranslateSegment,
  onRetranslateAll,
  isRetranslatingAll,
  voiceProfileId = 'cs50_malan',
  apiKey,
}) => {
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<'natural' | 'compact' | 'tech'>('natural');
  const [playingSegmentId, setPlayingSegmentId] = useState<number | null>(null);
  const [synthesizingSegmentId, setSynthesizingSegmentId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getVoiceName = (profileId: string): 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' => {
    switch (profileId) {
      case 'zoo_jawed': return 'Charon';
      case 'doc_narrator': return 'Fenrir';
      case 'female_educator': return 'Kore';
      case 'female_calm': return 'Zephyr';
      case 'cs50_malan':
      default: return 'Puck';
    }
  };

  const playSegmentAudio = async (seg: DubbingSegment) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // If already playing this segment, stop it
    if (playingSegmentId === seg.id) {
      audio.pause();
      setPlayingSegmentId(null);
      return;
    }

    audio.pause();

    let url = seg.audioUrl;
    if (!url) {
      setSynthesizingSegmentId(seg.id);
      try {
        const res = await fetch('/api/dubbing/synthesize-segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: seg.translation || seg.original,
            voiceName: getVoiceName(voiceProfileId),
            apiKey: apiKey || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          url = data.audioUrl;
          if (url) {
            onUpdateSegment(seg.id, 'audioUrl', url);
          }
        }
      } catch (err) {
        console.error('TTS error:', err);
      } finally {
        setSynthesizingSegmentId(null);
      }
    }

    if (url) {
      audio.src = url;
      setPlayingSegmentId(seg.id);
      audio.onended = () => setPlayingSegmentId(null);
      audio.onerror = () => setPlayingSegmentId(null);
      try {
        await audio.play();
      } catch (e) {
        console.error(e);
        setPlayingSegmentId(null);
      }
    }
  };

  const handleTranslateOne = async (seg: DubbingSegment) => {
    if (!onFastTranslateSegment) return;
    setTranslatingId(seg.id);
    try {
      await onFastTranslateSegment(seg.id, seg.original, selectedTone);
    } finally {
      setTranslatingId(null);
    }
  };

  return (
    <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#3b5bdb]" />
              <span>Relecture & Correction Manuelle</span>
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Traduction Rapide</span>
            </span>
          </div>
          <p className="text-xs text-[#868e96] mt-0.5">
            Modifiez directement le texte dans la colonne <b className="text-slate-700">"Français"</b> ou cliquez sur ⚡ pour retraduire instantanément un segment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Tone Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setSelectedTone('natural')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedTone === 'natural' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Style naturel pour YouTube"
            >
              Naturel
            </button>
            <button
              type="button"
              onClick={() => setSelectedTone('compact')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedTone === 'compact' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Style concis pour un débit rapide"
            >
              Concis
            </button>
            <button
              type="button"
              onClick={() => setSelectedTone('tech')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedTone === 'tech' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vocabulaire technique précis"
            >
              Tech
            </button>
          </div>

          {segments.length > 0 && onRetranslateAll && (
            <button
              type="button"
              onClick={onRetranslateAll}
              disabled={isRetranslatingAll}
              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Retraduire tous les segments avec le style sélectionné"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetranslatingAll ? 'animate-spin' : ''}`} />
              <span>Tout retraduire</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddSegment}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {segments.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-600 mb-1">
            Aucun segment pour le moment
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Lancez l'étape 1 "Analyser & Traduire" pour transcrire la vidéo ou charger vos sous-titres SRT.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e9ecef]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] text-[#495057] uppercase font-bold text-[11px] tracking-wider border-b border-[#e9ecef]">
                <th className="py-2.5 px-3 w-12 text-center">ID</th>
                <th className="py-2.5 px-3 w-20">Début (s)</th>
                <th className="py-2.5 px-3 w-20">Fin (s)</th>
                <th className="py-2.5 px-4 w-1/3">Anglais (Original)</th>
                <th className="py-2.5 px-4">Français (Traduction éditable)</th>
                <th className="py-2.5 px-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f5]">
              {segments.map((seg, idx) => (
                <tr
                  key={seg.id}
                  id={`segment-row-${seg.id}`}
                  className={`${idx % 2 === 0 ? 'bg-white hover:bg-indigo-50/30' : 'bg-[#fafafa] hover:bg-indigo-50/30'} transition-colors duration-300`}
                >
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                    {seg.id + 1}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.1"
                      value={seg.start}
                      onChange={(e) => onUpdateSegment(seg.id, 'start', parseFloat(e.target.value) || 0)}
                      className="w-16 bg-transparent border border-slate-200 focus:border-indigo-400 rounded px-1.5 py-1 text-slate-700 font-mono text-[11px]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.1"
                      value={seg.end}
                      onChange={(e) => onUpdateSegment(seg.id, 'end', parseFloat(e.target.value) || 0)}
                      className="w-16 bg-transparent border border-slate-200 focus:border-indigo-400 rounded px-1.5 py-1 text-slate-700 font-mono text-[11px]"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 leading-relaxed font-normal">
                    {seg.original}
                  </td>
                  <td className="py-2 px-3">
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={seg.translation}
                        onChange={(e) => onUpdateSegment(seg.id, 'translation', e.target.value)}
                        className={`w-full bg-white border rounded-lg p-2 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 shadow-2xs resize-y transition-all ${
                          translatingId === seg.id
                            ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-100'
                            : 'border-indigo-200 focus:border-indigo-600 focus:ring-indigo-100'
                        }`}
                        placeholder="Traduction française..."
                      />
                      {seg.audioUrl && (
                        <span className="absolute bottom-2 right-2 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 pointer-events-none">
                          <Check className="w-2.5 h-2.5" />
                          <span>Voix HD</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Fast single segment translation button */}
                      <button
                        type="button"
                        title={`Retraduire instantanément ce segment (${selectedTone})`}
                        onClick={() => handleTranslateOne(seg)}
                        disabled={translatingId === seg.id}
                        className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer transition-colors"
                      >
                        <Zap className={`w-3.5 h-3.5 ${translatingId === seg.id ? 'animate-bounce text-amber-500 fill-amber-500' : ''}`} />
                      </button>

                      {/* Listen Neural Cloned Voice */}
                      <button
                        type="button"
                        title={
                          playingSegmentId === seg.id
                            ? 'Arrêter la lecture'
                            : seg.audioUrl
                            ? 'Écouter la voix clonée (24kHz HD)'
                            : 'Générer & écouter la voix clonée (24kHz HD)'
                        }
                        onClick={() => playSegmentAudio(seg)}
                        disabled={synthesizingSegmentId === seg.id}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          playingSegmentId === seg.id
                            ? 'text-white bg-red-600 hover:bg-red-700'
                            : seg.audioUrl
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {synthesizingSegmentId === seg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        ) : playingSegmentId === seg.id ? (
                          <VolumeX className="w-4 h-4 text-white" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        title="Supprimer ce segment"
                        onClick={() => onDeleteSegment(seg.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
