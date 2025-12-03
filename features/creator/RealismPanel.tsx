import React, { useState } from 'react';
import { BiometricSlider } from '../../components/UI';
import { Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';
import { ModelMorphology } from '../../types';

export const RealismPanel: React.FC = () => {
    // [Project Synapse] Component is autonomous, connects directly to store.
    const { model, setModel } = useModelStore();
    const { morphology } = model;
    
    const [proRealism, setProRealism] = useState(false);
    const [simpleRealism, setSimpleRealism] = useState(50);

    const onMorphUpdate = (m: ModelMorphology) => {
        setModel({ ...model, morphology: m });
    };

    const update = (field: keyof ModelMorphology, value: number) => {
        onMorphUpdate({ ...morphology, [field]: value });
    };

    const handleSimpleChange = (val: number) => {
        setSimpleRealism(val);
        onMorphUpdate({
            ...morphology,
            skinTexture: Math.round(val * 0.9), imperfections: Math.round(val * 0.4),
            pores: Math.round(val * 0.7), vascularity: Math.round(val * 0.15),
            redness: Math.round(val * 0.3), freckleDensity: Math.round(val * 0.2)
        });
    };

    return (
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-purple-400"><Sparkles size={14} /> <span className="text-[10px] font-bold uppercase">Realism (Dermatology)</span></div>
                <button onClick={() => setProRealism(!proRealism)} className="text-[10px] font-bold flex items-center gap-1 text-white/50">{proRealism ? <ToggleRight className="text-purple-400"/> : <ToggleLeft/>}</button>
            </div>
            {!proRealism ? (
                <BiometricSlider label="Texture Density" value={simpleRealism} onChange={handleSimpleChange} leftLabel="Smooth" rightLabel="Raw" />
            ) : (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <BiometricSlider label="Epidermal Texture" value={morphology.skinTexture} onChange={(v) => update('skinTexture', v)} leftLabel="Airbrushed" rightLabel="Raw" />
                    <BiometricSlider label="Imperfections" value={morphology.imperfections} onChange={(v) => update('imperfections', v)} leftLabel="Perfect" rightLabel="Character" />
                    <BiometricSlider label="Pore Visibility" value={morphology.pores || 50} onChange={(v) => update('pores', v)} leftLabel="Smooth" rightLabel="Porous" />
                    <BiometricSlider label="Subsurface Redness" value={morphology.redness || 20} onChange={(v) => update('redness', v)} leftLabel="Pale" rightLabel="Flushed" />
                </div>
            )}
        </div>
    );
};
