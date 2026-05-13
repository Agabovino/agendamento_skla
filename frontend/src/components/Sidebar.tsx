import React from 'react';

const Sidebar: React.FC<{
  duration: string;
  description: string;
  preview?: {
    formattedTime: string;
    dateLabel: string;
  } | null;
  onBack?: () => void;
  isRegistering?: boolean;
}> = ({ duration, description, preview, onBack, isRegistering }) => {
  return (
    <aside className="w-full md:w-80 border-r-2 border-brand-black flex flex-col bg-[#F3F3F4] p-8">
      <div className="flex flex-col items-start space-y-6 flex-grow">
        {isRegistering && (
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-brand-black hover:bg-gray-200 transition-all mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        
        <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center p-2 border-2 border-brand-black overflow-hidden">
           <img 
            alt="Logo" 
            className="w-full h-full object-contain filter invert" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs4HYuXbVAuJXZ6CegZJI60HoEcmCAQh3-ABSReHFkvF3tTuTIDeEp8WIRj4gPpQQ0j_FjPlkoXz3vfRdarRi5tQjgqXQd1tRKRJCysZQS54BDJ_nVhNRur_c8qrvOF6jtGzNPttxZXzYpAOZx334X8s9vi36SVzbkLSZ7hp7iKJmqo2_4LAz_xAmlpeiDi62IMQlorsQO6OQu9OT01NAkX0GMovtm8Ft7RgSKCDuBC_7GMYVmKwcG6FlPDJUQsxy1ntB4LgoFEJ7R"
          />
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Produtora Skla</p>
          <h1 className="text-2xl font-bold text-primary leading-tight">Agendamento de horário</h1>
        </div>

        <div className="space-y-4 text-gray-600">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary font-fill">schedule</span>
            <span className="font-bold text-brand-black">{duration}</span>
          </div>

          {preview && (
             <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary font-fill">calendar_today</span>
              <div className="flex flex-col">
                <span className="font-bold text-brand-black">{preview.formattedTime}</span>
                <span className="text-sm">{preview.dateLabel}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary font-fill">public</span>
            <span className="text-xs font-bold uppercase">Horário de Brasília</span>
          </div>

          {!isRegistering && (
            <p className="text-sm leading-relaxed mt-4">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-gray-200 flex flex-wrap gap-x-4 gap-y-2">
        <a href="#" className="text-xs font-bold text-primary hover:underline">Configurações de cookies</a>
        <a href="#" className="text-xs font-bold text-primary hover:underline">Política de privacidade</a>
      </div>
    </aside>
  );
};

export default Sidebar;
