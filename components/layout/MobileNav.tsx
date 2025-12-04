
import React, { memo } from 'react';
import { AppMode } from '../../types';
import { User, Camera, Globe, Film, Layers, CreditCard, Clapperboard } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useUIStore } from '../../stores/uiStore';

export const MobileNav: React.FC = memo(() => {
    const { mode, setMode } = useUIStore();
    const { t } = useTranslation();
    return (
        <div className="fixed bottom-0 w-full h-20 bg-[#030712]/95 backdrop-blur-xl border-t border-white/10 grid grid-cols-7 items-center px-1 z-50 lg:hidden pb-[env(safe-area-inset-bottom)] overflow-x-auto">
            {[
                { m: AppMode.CREATOR, i: User, l: t('NAV_CREATOR') }, 
                { m: AppMode.STUDIO, i: Camera, l: t('NAV_STUDIO') },
                { m: AppMode.INFLUENCER, i: Globe, l: t('NAV_INFLUENCER') }, 
                { m: AppMode.MOTION, i: Film, l: t('NAV_MOTION') },
                { m: AppMode.DIRECTOR, i: Clapperboard, l: t('NAV_DIRECTOR') },
                { m: AppMode.GALLERY, i: Layers, l: t('NAV_GALLERY') },
                { m: AppMode.BILLING, i: CreditCard, l: t('NAV_BILLING') }
            ].map(x => (
                <button key={x.l} onClick={() => setMode(x.m)} className={`flex flex-col items-center justify-center gap-1 w-full h-full min-w-[50px] ${mode === x.m ? 'text-pink-400' : 'text-white/30'}`}>
                    <x.i size={20} />
                    <span className="text-[9px] font-bold uppercase">{x.l}</span>
                </button>
            ))}
        </div>
    );
});
