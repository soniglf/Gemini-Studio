import React, { useRef } from 'react';
import { Dna, ChevronLeft, ChevronRight } from 'lucide-react';
import { FULL_PRESETS_FEMALE, FULL_PRESETS_MALE } from '../../data/presets';
import { useUIStore } from '../../stores/uiStore';
import { useModelStore } from '../../stores/modelStore';

export const GenotypeDeck: React.FC = () => {
    const { model, setModel } = useModelStore();
    const presetContainerRef = useRef<HTMLDivElement>(null);
    const { addToast } = useUIStore();
    const presets = model.gender === 'FEMALE' ? FULL_PRESETS_FEMALE : FULL_PRESETS_MALE;

    const isMale = model.gender === 'MALE';
    const accentColor = isMale ? 'text-blue-400' : 'text-pink-400';
    const hoverBorder = isMale ? 'group-hover:border-blue-500/50' : 'group-hover:border-pink-500/50';
    const statusLight = isMale ? 'group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'group-hover:bg-pink-400 group-hover:shadow-[0_0_8px_rgba(244,114,182,0.8)]';
    const gradientOverlay = isMale ? 'from-blue-500/5' : 'from-pink-500/5';

    const applyPreset = (presetName: string) => {
        const preset = presets[presetName];
        if (preset) {
            const newMorph = { ...model.morphology, ...(preset.morphology || {}) };
            const { morphology: _, museDescription, ...topLevel } = preset;
            const updated = { ...model, ...topLevel, morphology: newMorph };
            setModel(updated);
            addToast(`Genotype Loaded: ${presetName}`, 'success');
        }
    };

    const scrollPresets = (dir: 'left' | 'right') => {
        presetContainerRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    return (
        <div className="px-4 mb-6 relative group/deck animate-in slide-in-from-right-2">
            <div className="flex justify-between items-center mb-3 px-1">
                <h4 className={`text-[10px] font-bold ${accentColor} uppercase tracking-[0.2em] flex items-center gap-2`}>
                    <Dna size={12} className="fill-current"/> Genotype Library
                </h4>
                <div className="flex gap-1">
                    <button onClick={() => scrollPresets('left')} className="p-1.5 bg-[#0B1121] hover:bg-white/10 rounded-md border border-white/5 hover:border-white/20 transition-all text-white/50 hover:text-white"><ChevronLeft size={12}/></button>
                    <button onClick={() => scrollPresets('right')} className="p-1.5 bg-[#0B1121] hover:bg-white/10 rounded-md border border-white/5 hover:border-white/20 transition-all text-white/50 hover:text-white"><ChevronRight size={12}/></button>
                </div>
            </div>
            
            <div className="relative -mx-4 px-4">
                <div ref={presetContainerRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth">
                    {Object.entries(presets).map(([name, data]) => (
                        <button 
                            key={name}
                            onClick={() => applyPreset(name)}
                            className={`relative group flex flex-col justify-end p-5 rounded-2xl w-64 h-32 shrink-0 text-left transition-all duration-300 hover:scale-[1.02] border border-white/10 ${hoverBorder} overflow-hidden bg-[#0B1121]`}
                        >
                            {/* Card Background - Matching Console Aesthetic */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradientOverlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40"></div>
                            
                            {/* Hover Scanline/Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-xs uppercase tracking-[0.15em] mb-2">{name}</h4>
                                <p className="text-[9px] text-white/40 font-medium leading-relaxed line-clamp-2 group-hover:text-white/60 transition-colors">{data.museDescription}</p>
                            </div>
                            
                            {/* Status Light */}
                            <div className={`absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-white/10 ${statusLight} transition-all duration-300`}></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};