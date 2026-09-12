import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Trash2, Languages, Maximize2, Minimize2, Activity, CheckCircle2 } from 'lucide-react';

interface TelemetryConsoleProps {
  logs: string[];
  onClear: () => void;
}

export const TelemetryConsole: React.FC<TelemetryConsoleProps> = ({ logs, onClear }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'translations'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, filterMode]);

  const copyAllLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedNotification('Journal complet copié !');
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const copyTranslationsOnly = () => {
    const translationLines = logs.filter(
      (l) => l.includes('FR :') || l.includes('EN :') || l.includes('📍') || l.includes('Synthèse vocale')
    );
    navigator.clipboard.writeText(translationLines.join('\n'));
    setCopiedNotification('Traductions copiées !');
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Count translation-specific segments
  const translationCount = logs.filter((l) => l.includes('FR :')).length;

  // Filter logs: in 'translations' mode, show translations PLUS essential system notices so the console is never blind
  const displayedLogs = filterMode === 'translations'
    ? logs.filter((l) =>
        l.includes('FR :') ||
        l.includes('EN :') ||
        l.includes('📍') ||
        l.includes('Synthèse vocale') ||
        l.includes('Traduction de') ||
        l.includes('TERMINÉE') ||
        l.includes('TERMINÉ') ||
        l.includes('📺') ||
        l.includes('🚀') ||
        l.includes('❌') ||
        l.includes('⚠️')
      )
    : logs;

  return (
    <div className="bg-white border border-[#e9ecef] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <span>Console de Télémétrie</span>
          </h3>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>En direct ({logs.length} lignes)</span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tout le journal ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('translations')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                filterMode === 'translations'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Traductions ({translationCount})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-xs font-bold text-emerald-600 animate-fade-in flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{copiedNotification}</span>
            </span>
          )}

          <button
            type="button"
            onClick={copyTranslationsOnly}
            title="Copier uniquement les textes et traductions"
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Copier Traductions</span>
          </button>

          <button
            type="button"
            onClick={copyAllLogs}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copier Tout</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Réduire la hauteur' : 'Agrandir la hauteur'}
            className="p-1 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
        </div>
      </div>

      <div
        className={`bg-[#0f172a] border border-slate-800 rounded-xl p-4 font-mono-code text-[13px] leading-relaxed overflow-y-auto shadow-inner transition-all duration-200 ${
          isExpanded ? 'max-h-[560px]' : 'max-h-[340px]'
        }`}
      >
        {displayedLogs.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-slate-400 font-medium mb-1">En attente d'opération ou aucune traduction trouvée.</p>
            <p className="text-xs text-slate-500">
              {filterMode === 'translations'
                ? 'Basculez sur "Tout le journal" ou cliquez sur "1. Analyser & Traduire".'
                : 'Collez un lien YouTube et cliquez sur "1. Analyser & Traduire".'}
            </p>
          </div>
        ) : (
          displayedLogs.map((line, idx) => {
            // Check for French translation line
            if (line.includes('FR :')) {
              return (
                <div
                  key={idx}
                  className="bg-emerald-950/40 border-l-2 border-emerald-400 pl-3 py-1 my-0.5 rounded-r text-emerald-300 font-semibold break-words"
                >
                  <span className="text-emerald-400 font-bold">FR : </span>
                  <span className="text-emerald-100">{line.replace(/^.*FR\s*:\s*/, '')}</span>
                </div>
              );
            }

            if (line.includes('EN :')) {
              return (
                <div
                  key={idx}
                  className="pl-3 py-0.5 text-slate-400 break-words font-medium"
                >
                  <span className="text-indigo-300 font-semibold">EN : </span>
                  <span className="text-slate-300">{line.replace(/^.*EN\s*:\s*/, '')}</span>
                </div>
              );
            }

            if (line.includes('📍')) {
              return (
                <div key={idx} className="text-amber-400 font-semibold pt-1 text-xs">
                  {line}
                </div>
              );
            }

            if (line.includes('📺 [YouTube')) {
              return (
                <div key={idx} className="bg-red-950/30 border-l-2 border-red-500 pl-3 py-1 my-1 text-red-200 font-semibold text-xs rounded-r">
                  {line}
                </div>
              );
            }

            if (line.includes('Synthèse vocale')) {
              return (
                <div key={idx} className="text-cyan-300 font-semibold pt-1 break-words">
                  {line}
                </div>
              );
            }

            let color = 'text-slate-300';
            if (line.includes('❌') || line.includes('Erreur')) color = 'text-red-400 font-semibold';
            else if (line.includes('✅') || line.includes('TERMINÉE') || line.includes('TERMINÉ')) color = 'text-emerald-400 font-semibold';
            else if (line.includes('🚀') || line.includes('DÉMARRAGE')) color = 'text-indigo-400 font-bold';
            else if (line.includes('⚠️')) color = 'text-amber-400 font-medium';
            else if (line.includes('—')) color = 'text-slate-600';

            return (
              <div key={idx} className={`${color} whitespace-pre-wrap py-0.5 break-words`}>
                {line}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
