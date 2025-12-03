
import React, { useState } from 'react';
import { Button } from '../../components/UI';
import { Stars, Dices, Zap, Wand2 } from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';
import { useUIStore } from '../../stores/uiStore';
import { GenerationService } from '../../services/ai/generationService';
import { MUTATION_TRAITS } from '../../data/presets';

export const MuseEngine: React.FC = () => {
    const { model, setModel } = useModelStore();
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [musePrompt, setMusePrompt] = useState("");
    const { addToast } = useUIStore();
    
    const handleSynthesize = async () => {
        if (!musePrompt.trim()) return;
        setIsSynthesizing(true);
        try {
            const result = await GenerationService.synthesizeProfile(musePrompt);
            setModel({ ...model, ...result });
            addToast("Identity Synthesized", "success");
        } catch(e) {
            addToast("Synthesis Failed", "error");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleEnhance = async () => {
        if (!musePrompt.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await GenerationService.enhanceDescription(musePrompt);
            setMusePrompt(enhanced);
            addToast("Prompt Expanded", "success");
        } catch (e) {
            addToast("Enhancement Failed", "error");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleRandomize = () => setMusePrompt(GenerationService.generateRandomPersona());
    const handleMutation = (trait: string) => setMusePrompt(GenerationService.injectTrait(musePrompt, trait));

    return (
        <div className="mx-4 relative group animate-in slide-in-from-top-4">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl opacity-20 group-hover:opacity-50 transition duration-500 blur-sm"></div>
            <div className="relative bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Stars size={12} className="text-purple-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest">Muse Engine</span>
                    </div>
                    <button onClick={handleRandomize} className="text-[9px] flex items-center gap-1 text-white/40 hover:text-emerald-400" title="Generate Random Persona">
                        <Dices size={10}/> Surprise Me
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <textarea 
                        value={musePrompt}
                        onChange={(e) => setMusePrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSynthesize()}
                        placeholder="Describe your vision (e.g. 'A futuristic hacker with neon hair')..."
                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/30 h-24 p-3"
                    />
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleSynthesize} isLoading={isSynthesizing} disabled={!musePrompt.trim()} className="flex-1 bg-gradient-to-br from-pink-600 to-purple-700 w-14" title="Synthesize"><Zap size={20} /></Button>
                        <Button onClick={handleEnhance} isLoading={isEnhancing} disabled={!musePrompt.trim()} className="flex-1 bg-white/5 w-14 text-purple-400" title="Auto-Expand"><Wand2 size={18} /></Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {MUTATION_TRAITS.map((trait, i) => (
                        <button key={i} onClick={() => handleMutation(trait.prompt)} className="px-2 py-1 rounded bg-white/5 hover:bg-purple-500/20 text-[9px] font-bold text-white/50 hover:text-purple-300">
                            + {trait.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
