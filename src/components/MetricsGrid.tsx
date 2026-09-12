import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { DubbingSegment } from '../types';
import { Clock, AlertTriangle, CheckCircle2, Info, Activity } from 'lucide-react';

interface MetricsGridProps {
  segments?: DubbingSegment[];
  onSelectSegment?: (segmentId: number) => void;
}

interface ChartSegmentItem {
  id: number;
  name: string;
  duration: number;
  start: number;
  end: number;
  status: 'short' | 'optimal' | 'long';
  color: string;
  original: string;
  translation: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ segments = [], onSelectSegment }) => {
  // Timing analysis data for Recharts
  const { chartData, stats } = useMemo(() => {
    if (!segments || segments.length === 0) {
      // Default demo distribution to show visual calibration scale
      const sampleSegments: ChartSegmentItem[] = [
        { id: 1, name: 'Seg 1', duration: 3.5, start: 0.0, end: 3.5, status: 'optimal', color: '#10b981', original: 'Welcome to class', translation: 'Introduction du cours' },
        { id: 2, name: 'Seg 2', duration: 1.2, start: 3.5, end: 4.7, status: 'short', color: '#f59e0b', original: 'Very good.', translation: 'Très bien.' },
        { id: 3, name: 'Seg 3', duration: 4.8, start: 4.7, end: 9.5, status: 'optimal', color: '#10b981', original: 'Today we discuss concepts', translation: 'Aujourd\'hui nous abordons les concepts' },
        { id: 4, name: 'Seg 4', duration: 7.4, start: 9.5, end: 16.9, status: 'long', color: '#ef4444', original: 'A continuous detailed explanation', translation: 'Une longue explication continue détaillée' },
        { id: 5, name: 'Seg 5', duration: 3.1, start: 16.9, end: 20.0, status: 'optimal', color: '#10b981', original: 'Let\'s move on', translation: 'Passons à la suite' },
      ];
      return {
        chartData: sampleSegments,
        stats: {
          total: 0,
          avgDuration: 3.8,
          optimalCount: 3,
          shortCount: 1,
          longCount: 1,
          isSample: true
        }
      };
    }

    let totalDuration = 0;
    let optimalCount = 0;
    let shortCount = 0;
    let longCount = 0;

    const data: ChartSegmentItem[] = segments.map((seg, idx) => {
      const dur = Math.max(0.2, Math.round((seg.end - seg.start) * 10) / 10);
      totalDuration += dur;

      let status: 'short' | 'optimal' | 'long' = 'optimal';
      let color = '#10b981'; // Vert = 1.5s - 6.5s (optimal)

      if (dur < 1.5) {
        status = 'short';
        color = '#f59e0b'; // Ambre = < 1.5s (très court / risque de rapidité)
        shortCount++;
      } else if (dur > 6.5) {
        status = 'long';
        color = '#ef4444'; // Rouge = > 6.5s (long / risque de décalage vocal)
        longCount++;
      } else {
        optimalCount++;
      }

      return {
        id: seg.id ?? idx,
        name: `#${idx + 1}`,
        duration: dur,
        start: seg.start,
        end: seg.end,
        status,
        color,
        original: seg.original || '',
        translation: seg.translation || '',
      };
    });

    return {
      chartData: data,
      stats: {
        total: segments.length,
        avgDuration: segments.length > 0 ? Math.round((totalDuration / segments.length) * 10) / 10 : 0,
        optimalCount,
        shortCount,
        longCount,
        isSample: false
      }
    };
  }, [segments]);

  return (
    <div id="metrics-grid-container" className="space-y-4 mb-7 px-1">
      {/* 4 cartes indicateurs clés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 text-center shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 bg-[#dbe4ff] text-[#3b5bdb]">
            🧠
          </div>
          <p className="text-[20px] font-extrabold text-[#212529] tracking-tight">Gemini 3.8</p>
          <p className="text-[13px] text-[#868e96] font-medium mt-1">Traduction Contextuelle</p>
        </div>

        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 text-center shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 bg-[#d3f9d8] text-[#2b8a3e]">
            🎙️
          </div>
          <p className="text-[20px] font-extrabold text-[#212529] tracking-tight">Whisper</p>
          <p className="text-[13px] text-[#868e96] font-medium mt-1">Transcription Temporelle</p>
        </div>

        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 text-center shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 bg-[#fff3bf] text-[#e67700]">
            🎙️
          </div>
          <p className="text-[20px] font-extrabold text-[#212529] tracking-tight">Gemini TTS HD</p>
          <p className="text-[13px] text-[#868e96] font-medium mt-1">Clonage Vocal (24kHz)</p>
        </div>

        <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 text-center shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 bg-[#e5dbff] text-[#7048e8]">
            ✨
          </div>
          <p className="text-[20px] font-extrabold text-[#212529] tracking-tight">Zéro Robotique</p>
          <p className="text-[13px] text-[#868e96] font-medium mt-1">Timbre Humain Fidèle</p>
        </div>
      </div>

      {/* Graphique Recharts : Répartition temporelle des segments */}
      <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-xs transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#e7f5ff] text-[#1971c2]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-[16px] font-bold text-[#212529] tracking-tight">
                Répartition Temporelle des Segments (Durée en secondes)
              </h3>
            </div>
            <p className="text-[13px] text-[#868e96] mt-1">
              Calibrage rythmique pour repérer les segments trop courts (&lt;1.5s) ou trop longs (&gt;6.5s)
            </p>
          </div>

          {/* Badges de synthèse */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Moy : {stats.avgDuration}s
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {stats.optimalCount} optimaux (1.5s - 6.5s)
            </span>
            {stats.shortCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {stats.shortCount} courts (&lt;1.5s)
              </span>
            )}
            {stats.longCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200/60">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {stats.longCount} longs (&gt;6.5s)
              </span>
            )}
          </div>
        </div>

        {stats.isSample && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 mb-3">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <span>
              <strong>Aperçu du calibrage :</strong> Lancez l'<strong>Étape 1</strong> pour afficher les durées réelles calculées à partir de votre vidéo ou fichier SRT.
            </span>
          </div>
        )}

        {/* Recharts BarChart container */}
        <div className="w-full h-52 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -18, bottom: 4 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onSelectSegment) {
                  onSelectSegment(e.activePayload[0].payload.id);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
              <XAxis
                dataKey="name"
                stroke="#adb5bd"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#dee2e6' }}
              />
              <YAxis
                stroke="#adb5bd"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#dee2e6' }}
                unit="s"
                domain={[0, (dataMax: number) => Math.max(8, Math.ceil(dataMax + 1))]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  const isOpt = item.status === 'optimal';
                  const isShort = item.status === 'short';
                  return (
                    <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl text-xs max-w-xs border border-slate-700">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
                        <span className="font-bold text-slate-200">Segment {item.name}</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                            isOpt
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isShort
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isOpt ? 'Rythme optimal' : isShort ? 'Segment court' : 'Segment long'}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <p>
                          <strong className="text-white">Durée :</strong> {item.duration}s{' '}
                          <span className="text-slate-400">({item.start?.toFixed(1)}s → {item.end?.toFixed(1)}s)</span>
                        </p>
                        {item.translation && (
                          <p className="truncate text-slate-200">
                            <strong>Traduction :</strong> "{item.translation}"
                          </p>
                        )}
                        {item.original && (
                          <p className="truncate text-slate-400">
                            <strong>Source :</strong> "{item.original}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={1.5}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Min (1.5s)',
                  position: 'insideTopLeft',
                  fill: '#d97706',
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              <ReferenceLine
                y={6.5}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Max (6.5s)',
                  position: 'insideTopLeft',
                  fill: '#dc2626',
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              <Bar dataKey="duration" radius={[6, 6, 0, 0]} cursor="pointer">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Légende horizontale */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>Optimal (1.5s à 6.5s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>Court (&lt; 1.5s - attention au débit rapide)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>Long (&gt; 6.5s - risque de désynchronisation)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

