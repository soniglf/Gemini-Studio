
import React, { memo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Map } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export const LocationSelector: React.FC<{
    previews: string[];
    selected: string | null;
    onSelect: (url: string) => void;
    isGenerating: boolean;
}> = memo(({ previews, selected, onSelect, isGenerating }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const safePreviews = previews || [];
    
    // If no previews are available, just show the placeholder in expanded mode logic or a compact message
    if (!safePreviews.length && !isGenerating) return null;

    return (
        <div className="flex flex-col gap-2 mb-6 w-full animate-in fade-in">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] group hover:text-pink-300 transition-colors"
            >
                <span className="flex items-center gap-2"><Map size={12}/> {t('PRE_LOCATIONS')}</span>
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {/* Compact View (Default) */}
            {!isExpanded && (
                <div className="flex items-center gap-3 bg-slate-900/30 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer" onClick={() => setIsExpanded(true)}>
                    {selected ? (
                        <div className="w-12 h-12 rounded bg-black border border-white/10 overflow-hidden shrink-0">
                            <img src={selected} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded bg-white/5 border border-white/5 flex items-center justify-center text-white/20 shrink-0">
                            <Map size={16} />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-xs text-white font-bold">{selected ? "Location Selected" : "No Location Preview"}</p>
                        <p className="text-[9px] text-white/40">{safePreviews.length} variations available</p>
                    </div>
                    {isGenerating && <span className="text-[9px] text-pink-400 animate-pulse mr-2">Generating...</span>}
                </div>
            )}

            {/* Expanded Drawer View */}
            {isExpanded && (
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/10 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-4 gap-2">
                        {isGenerating && (
                            <div className="aspect-square flex items-center justify-center bg-slate-800/50 rounded-lg border border-white/5 animate-pulse">
                                <span className="text-[9px] text-white/30 font-mono">...</span>
                            </div>
                        )}
                        {safePreviews.map((url, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => onSelect(url)} 
                                className={`relative aspect-square rounded-lg overflow-hidden border transition-all hover:scale-105 ${selected === url ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <img src={url} className="w-full h-full object-cover" />
                                {selected === url && <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center"><Check size={16} className="text-white" /></div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});
