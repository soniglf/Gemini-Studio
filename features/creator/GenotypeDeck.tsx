
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
        <div className="px-4 relative group/deck">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Dna size={12} className="text-emerald-400"/> Genotype Library
                </h4>
                <div className="flex gap-1">
                    <button onClick={() => scrollPresets('left')} className="p-1 bg-white/5 hover:bg-white/10 rounded"><ChevronLeft size={14}/></button>
                    <button onClick={() => scrollPresets('right')} className="p-1 bg-white/5 hover:bg-white/10 rounded"><ChevronRight size={14}/></button>
                </div>
            </div>
            
            <div className="relative">
                <div ref={presetContainerRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
                    {Object.entries(presets).map(([name, data]) => (
                        <button 
                            key={name}
                            onClick={() => applyPreset(name)}
                            className="relative group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 p-4 rounded-xl transition-all hover:-translate-y-1 shrink-0 w-48"
                        >
                            <h4 className="font-bold text-white text-xs uppercase mb-2">{name}</h4>
                            <p className="text-[9px] text-white/40 line-clamp-2">{data.museDescription}</p>
                        </button>
                    ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#020617] to-transparent pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#020617] to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};
