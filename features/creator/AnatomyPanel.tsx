
import React, { useState } from 'react';
import { BiometricSlider, SliderGroup, VisualGridSelect } from '../../components/UI';
import { Scale, User, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatHeight } from '../../data/presets';
import { OPTIONS, GENDER_CONFIG, SLIDER_LABELS } from '../../data/options';
import { useModelStore } from '../../stores/modelStore';

export const AnatomyPanel: React.FC = () => {
    const { model, setModel } = useModelStore();
    const morph = model.morphology;
    const genderConfig = model.gender === 'FEMALE' ? GENDER_CONFIG.FEMALE : GENDER_CONFIG.MALE;
    const [biometricMode, setBiometricMode] = useState(false);

    const updateMorph = (field: keyof typeof morph, value: any) => {
        setModel({ ...model, morphology: { ...morph, [field]: value } });
    };

    const getLabel = (key: string): { label: string, left: string, right: string } => {
        // @ts-ignore
        const specific = genderConfig[key];
        const generic = SLIDER_LABELS[key];
        return {
            label: specific?.label || key.replace(/([A-Z])/g, ' $1').trim(),
            left: specific?.minLabel || generic?.[0] || 'Low',
            right: specific?.maxLabel || generic?.[1] || 'High'
        };
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            {/* MODE TOGGLE */}
            <div className="flex justify-between items-center bg-[#0B1121] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Detail Level</span>
                <button 
                    onClick={() => setBiometricMode(!biometricMode)} 
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase transition-colors ${biometricMode ? 'text-pink-400' : 'text-white/50 hover:text-white'}`}
                >
                    {biometricMode ? "Biometric Mode (Pro)" : "Basic Structure"}
                    {biometricMode ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                </button>
            </div>

            <SliderGroup title="Body Architecture" icon={Scale}>
                <BiometricSlider label="Height" value={morph.height} onChange={(v) => updateMorph('height', v)} formatValue={formatHeight}/>
                <BiometricSlider label={getLabel('muscleMass').label} value={morph.muscleMass} onChange={(v) => updateMorph('muscleMass', v)} leftLabel={getLabel('muscleMass').left} rightLabel={getLabel('muscleMass').right} />
                <BiometricSlider label={getLabel('bustChest').label} value={morph.bustChest} onChange={(v) => updateMorph('bustChest', v)} leftLabel={getLabel('bustChest').left} rightLabel={getLabel('bustChest').right} />
                <BiometricSlider label={getLabel('hipsWaistRatio').label} value={morph.hipsWaistRatio} onChange={(v) => updateMorph('hipsWaistRatio', v)} leftLabel={getLabel('hipsWaistRatio').left} rightLabel={getLabel('hipsWaistRatio').right} />
                
                {biometricMode && (
                    <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-1 gap-4 animate-in fade-in">
                        <BiometricSlider label="Shoulder Width" value={morph.shoulderWidth || 50} onChange={(v) => updateMorph('shoulderWidth', v)} leftLabel="Narrow" rightLabel="Broad"/>
                        <BiometricSlider label="Neck Thickness" value={morph.neckThickness || 50} onChange={(v) => updateMorph('neckThickness', v)} leftLabel="Slender" rightLabel="Thick"/>
                        <BiometricSlider label="Leg Length" value={morph.legLength || 50} onChange={(v) => updateMorph('legLength', v)} leftLabel="Stocky" rightLabel="Leggy"/>
                    </div>
                )}
            </SliderGroup>

            <SliderGroup title="Cranial Structure" icon={User}>
                <VisualGridSelect label="Face Shape" value={morph.faceShape} options={OPTIONS.faceShape.map(v=>({value:v, label:v}))} onChange={(e) => updateMorph('faceShape', e.target.value)} />
                <BiometricSlider label="Jawline" value={morph.jawlineDefinition} onChange={(v) => updateMorph('jawlineDefinition', v)} leftLabel="Soft" rightLabel="Sharp"/>
                <BiometricSlider label="Cheekbones" value={morph.cheekboneHeight} onChange={(v) => updateMorph('cheekboneHeight', v)} leftLabel="Low" rightLabel="High"/>
                
                {biometricMode && (
                    <div className="pt-4 mt-4 border-t border-white/5 animate-in fade-in">
                        <BiometricSlider label="Chin Prominence" value={morph.chinProminence || 50} onChange={(v) => updateMorph('chinProminence', v)} leftLabel="Recessed" rightLabel="Jutting"/>
                        <BiometricSlider label="Forehead Height" value={morph.foreheadHeight || 50} onChange={(v) => updateMorph('foreheadHeight', v)} leftLabel="Low" rightLabel="High"/>
                    </div>
                )}
            </SliderGroup>

            <SliderGroup title="Ocular & Nasal" icon={Eye}>
                <BiometricSlider label="Eye Size" value={morph.eyeSize} onChange={(v) => updateMorph('eyeSize', v)} leftLabel="Narrow" rightLabel="Doe" />
                <BiometricSlider label="Nose" value={morph.noseStructure} onChange={(v) => updateMorph('noseStructure', v)} leftLabel="Button" rightLabel="Aquiline" />
                <BiometricSlider label="Lips" value={morph.lipFullness} onChange={(v) => updateMorph('lipFullness', v)} leftLabel="Thin" rightLabel="Full" />
                
                {biometricMode && (
                    <div className="pt-4 mt-4 border-t border-white/5 animate-in fade-in">
                        <BiometricSlider label="Eye Spacing" value={morph.eyeSpacing || 50} onChange={(v) => updateMorph('eyeSpacing', v)} leftLabel="Close-Set" rightLabel="Wide-Set"/>
                        <BiometricSlider label="Canthal Tilt (Eye Angle)" value={morph.eyeTilt || 50} onChange={(v) => updateMorph('eyeTilt', v)} leftLabel="Downturned" rightLabel="Upturned"/>
                        <BiometricSlider label="Eyebrow Arch" value={morph.eyebrowArch || 50} onChange={(v) => updateMorph('eyebrowArch', v)} leftLabel="Flat" rightLabel="High Arch"/>
                    </div>
                )}
            </SliderGroup>
        </div>
    );
};
