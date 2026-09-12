import React, { useState } from 'react';
import { User, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-md border border-[#dee2e6]/70 px-7 py-3 flex justify-between items-center rounded-2xl mb-2 shadow-xs">
      <div className="flex items-center gap-3">
        {!imgError ? (
          <img
            src="/assets/logo.jpg"
            alt="SavoirAI Logo"
            className="h-12 w-auto object-contain rounded-lg border border-slate-200"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            S
          </div>
        )}
        <div className="text-[22px] font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
          <span>SavoirIA</span>
          <span className="text-[#2b8a3e]">Dubbing</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
            v2.0 Web
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Gemini 3.8 Flash Prêt</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#495057] bg-[#f1f3f5] px-4 py-2 rounded-xl">
          <User className="w-4 h-4 text-slate-600" />
          <span>Ghislain Muntu</span>
        </div>
      </div>
    </header>
  );
};
