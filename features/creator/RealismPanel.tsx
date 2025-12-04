import React, { useState, useEffect } from 'react';
import { BiometricSlider } from '../../components/UI';
import { Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';
import { ModelMorphology } from '../../types';

export const RealismPanel: React.FC = () => {
    const { model, setModel } = useModelStore();
    const { morphology } = model;
    
    const [proRealism, setProRealism] = useState(false);
    // Initialize simple slider from current skinTexture to stay in sync
    const [simpleRealism, setSimpleRealism] = useState(morphology.skinTexture || 65);

    useEffect(() => {
        setSimpleRealism(morphology.skinTexture || 65);
    }, [morphology.skinTexture]);

    const onMorphUpdate = (m: ModelMorphology) => {
        setModel({ ...model, morphology: m });
    };

    const update = (field: keyof ModelMorphology, value: number) => {
        onMorphUpdate({ ...morphology, [field]: value });
    };

    const handleSimpleChange = (val: number) => {
        setSimpleRealism(val);
        // Master Slider drives the granular values in real-time
        onMorphUpdate({
            ...morphology,
            skinTexture: val, 
            imperfections: Math.round(val * 0.6), // 60% of texture
            pores: Math.round(val * 0.9), // 90% of texture
            vascularity: Math.round(val * 0.2), // 20% of texture
            redness: Math.round(val * 0.35), // 35% of texture
            freckleDensity: morphology.freckleDensity // Preserve existing freckles
        });
    };

    return (
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-purple-400"><Sparkles size={14} /> <span className="text-[10px] font-bold uppercase">Realism (Dermatology)</span></div>
                <button 
                    onClick={() => setProRealism(!proRealism)} 
                    className={`text-[10px] font-bold flex items-center gap-2 transition-colors ${proRealism ? 'text-purple-400' : 'text-white/50 hover:text-white'}`}
                >
                    {proRealism ? "Expert Controls" : "Simple"}
                    {proRealism ? <ToggleRight className="text-purple-400"/> : <ToggleLeft/>}
                </button>
            </div>
            
            {/* Master Slider is ALWAYS visible now, acting as the driver */}
            <BiometricSlider 
                label="Texture Density (Master)" 
                value={simpleRealism} 
                onChange={handleSimpleChange} 
                leftLabel="Smooth" 
                rightLabel="Raw" 
            />

            {proRealism && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-2">
                    <BiometricSlider label="Epidermal Texture" value={morphology.skinTexture} onChange={(v) => update('skinTexture', v)} leftLabel="Airbrushed" rightLabel="Raw" />
                    <BiometricSlider label="Imperfections" value={morphology.imperfections} onChange={(v) => update('imperfections', v)} leftLabel="Perfect" rightLabel="Character" />
                    <BiometricSlider label="Pore Visibility" value={morphology.pores || 50} onChange={(v) => update('pores', v)} leftLabel="Smooth" rightLabel="Porous" />
                    <BiometricSlider label="Subsurface Redness" value={morphology.redness || 20} onChange={(v) => update('redness', v)} leftLabel="Pale" rightLabel="Flushed" />
                </div>
            )}
        </div>
    );
};