
import React from 'react';
import { Sparkles } from 'lucide-react';

export const GeminiStudioLogo = ({ className }: { className?: string }) => (
    <div className={`flex items-center gap-3 select-none group ${className || ''}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-primary)] to-[var(--neon-secondary)] rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--neon-primary)] group-hover:shadow-[0_0_25px_var(--neon-primary)] transition-all duration-500 relative overflow-hidden">
            <Sparkles size={18} className="text-white fill-current animate-pulse relative z-10" />
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rotate-45"></div>
        </div>
        <div className="flex flex-col leading-none">
            <span className="font-black text-lg tracking-widest text-white brand-font drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">GEMINI</span>
            <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold tracking-[0.3em] text-[var(--neon-primary)] group-hover:text-pink-400 transition-colors">STUDIO</span>
            </div>
        </div>
    </div>
);
