
import React, { useState } from 'react';
import { Button } from '../../components/UI';
import { Stars, Dices, Zap, Wand2, Flame, Sparkles } from 'lucide-react';
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

    const isMale = model.gender === 'MALE';
    const engineName = isMale ? "Apollo Engine" : "Muse Engine";
    const accentIcon = isMale ? <Flame size={14} className="text-blue-400" /> : <Stars size={14} className="text-pink-400" />;
    const borderFocus = isMale ? "focus:border-blue-500/50" : "focus:border-pink-500/50";
    const buttonClass = isMale 
        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/30' 
        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-900/30';

    // Professional / Editorial Placeholders
    const placeholder = isMale
        ? "Describe the subject's essence (e.g. 'A sophisticated architect with silver fox hair, wearing a turtleneck, shot on 35mm')..."
        : "Describe the subject's essence (e.g. 'A statuesque editorial model with freckles, wearing haute couture, cinematic lighting')...";

    return (
        <div className="mx-4 mb-6 relative group animate-in slide-in-from-top-4">
            {/* Restored Magical Glow */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${isMale ? 'from-blue-500 via-cyan-500 to-blue-600' : 'from-pink-500 via-purple-500 to-pink-600'} rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt`}></div>

            <div className="relative bg-[#0B1121]/80 backdrop-blur-xl rounded-2xl p-1 border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        {accentIcon}
                        <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-black drop-shadow-md">{engineName}</span>
                    </div>
                    <button
                        onClick={handleRandomize}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group/dice"
                    >
                        <Dices size={12} className="text-white/30 group-hover/dice:text-emerald-400 transition-colors"/>
                        <span className="text-[9px] font-bold text-white/30 group-hover/dice:text-white transition-colors">RANDOMIZE</span>
                    </button>
                </div>

                {/* Input Area */}
                <div className="p-4 flex gap-3">
                    <textarea
                        value={musePrompt}
                        onChange={(e) => setMusePrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSynthesize()}
                        placeholder={placeholder}
                        className={`flex-1 bg-black/40 border border-white/10 rounded-xl text-xs leading-relaxed text-white placeholder:text-white/20 focus:outline-none ${borderFocus} focus:bg-black/60 h-24 p-4 resize-none transition-all custom-scrollbar`}
                    />

                    {/* Action Stack */}
                    <div className="flex flex-col gap-2 w-12 shrink-0">
                        <button
                            onClick={handleSynthesize}
                            disabled={isSynthesizing || !musePrompt.trim()}
                            className={`flex-1 rounded-xl flex items-center justify-center transition-all duration-300 text-white ${!musePrompt.trim() ? 'bg-white/5 text-white/10 cursor-not-allowed' : buttonClass}`}
                            title="Synthesize Profile"
                        >
                            {isSynthesizing ? <Zap size={16} className="animate-pulse"/> : <Zap size={18} className="fill-current"/>}
                        </button>
                        <button
                            onClick={handleEnhance}
                            disabled={isEnhancing || !musePrompt.trim()}
                            className={`h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${!musePrompt.trim() ? 'border-white/5 text-white/10' : 'border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400'}`}
                            title="Enhance Prompt with AI"
                        >
                            <Wand2 size={14} className={isEnhancing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Quick Traits */}
                <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2">
                    {MUTATION_TRAITS.map((trait, i) => (
                        <button
                            key={i}
                            onClick={() => handleMutation(trait.prompt)}
                            className="px-2 py-1 rounded-md border border-white/5 bg-white/[0.02] hover:bg-white/10 text-[9px] font-medium text-white/40 hover:text-white transition-all hover:border-white/20"
                        >
                            + {trait.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
