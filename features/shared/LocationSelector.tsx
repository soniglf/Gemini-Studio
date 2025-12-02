
import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export const LocationSelector: React.FC<{
    previews: string[];
    selected: string | null;
    onSelect: (url: string) => void;
    isGenerating: boolean;
}> = memo(({ previews, selected, onSelect, isGenerating }) => {
    const { t } = useTranslation();
    const safePreviews = previews || [];
    return (
        <div className="flex flex-col gap-3 mb-6 w-full">
            <label className="text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] ml-1">{t('PRE_LOCATIONS')}</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 min-h-[80px]">
                {isGenerating ? (
                    <div className="w-full h-20 flex items-center justify-center bg-slate-900/40 rounded-lg border border-white/5 animate-pulse shrink-0 px-8"><span className="text-xs text-white/30 font-mono">{t('PRE_GENERATING')}</span></div>
                ) : !safePreviews.length ? (
                     <div className="w-full h-20 flex items-center justify-center bg-slate-900/40 rounded-lg border border-white/5 shrink-0 px-8"><span className="text-xs text-white/30 font-mono">{t('PRE_NO_PREVIEWS')}</span></div>
                ) : (
                    safePreviews.map((url, idx) => (
                        <button key={idx} onClick={() => onSelect(url)} className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border ${selected === url ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-white/10'}`}>
                            <img src={url} className="w-full h-full object-cover" />
                            {selected === url && <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center"><Check size={16} className="text-white" /></div>}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
});
