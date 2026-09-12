import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="text-center pt-8 pb-6 px-4 mb-2">
      <div className="inline-flex items-center gap-2 bg-[#e7f5ff] text-[#1c7ed6] text-[13.5px] font-semibold px-5 py-2 rounded-full mb-5 border border-[#d0ebff]">
        <span>✨ Doublage Vidéo par Intelligence Artificielle</span>
      </div>

      <h1 className="text-4xl md:text-[44px] font-extrabold text-[#212529] tracking-tight leading-[1.15] mb-3 max-w-[700px] mx-auto">
        Traduisez et Doublez<br />
        vos Vidéos avec <span className="text-[#3b5bdb]">l'IA</span>
      </h1>

      <p className="text-[17px] text-[#6c757d] font-medium leading-relaxed max-w-[580px] mx-auto mb-2">
        Traduction contextuelle, clonage vocal émotionnel et assemblage automatique.
        Du contenu anglais au français en quelques clics.
      </p>

      <p className="text-[13px] text-[#adb5bd] font-medium">
        Créé par Ghislain Muntu
      </p>
    </section>
  );
};
