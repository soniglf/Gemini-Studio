
import React from 'react';
import { BiometricSlider, SliderGroup, VisualGridSelect } from '../../components/UI';
import { Scale, User, Eye } from 'lucide-react';
import { formatHeight } from '../../data/presets';
import { OPTIONS, GENDER_CONFIG, SLIDER_LABELS } from '../../data/options';
import { useModelStore } from '../../stores/modelStore';

export const AnatomyPanel: React.FC = () => {
    const { model, setModel } = useModelStore();
    const morph = model.morphology;
    const genderConfig = model.gender === 'FEMALE' ? GENDER_CONFIG.FEMALE : GENDER_CONFIG.MALE;

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
            <SliderGroup title="Body Architecture" icon={Scale}>
                <BiometricSlider label="Height" value={morph.height} onChange={(v) => updateMorph('height', v)} formatValue={formatHeight}/>
                <BiometricSlider label={getLabel('muscleMass').label} value={morph.muscleMass} onChange={(v) => updateMorph('muscleMass', v)} leftLabel={getLabel('muscleMass').left} rightLabel={getLabel('muscleMass').right} />
                <BiometricSlider label={getLabel('bustChest').label} value={morph.bustChest} onChange={(v) => updateMorph('bustChest', v)} leftLabel={getLabel('bustChest').left} rightLabel={getLabel('bustChest').right} />
                <BiometricSlider label={getLabel('hipsWaistRatio').label} value={morph.hipsWaistRatio} onChange={(v) => updateMorph('hipsWaistRatio', v)} leftLabel={getLabel('hipsWaistRatio').left} rightLabel={getLabel('hipsWaistRatio').right} />
            </SliderGroup>

            <SliderGroup title="Cranial Structure" icon={User}>
                <VisualGridSelect label="Face Shape" value={morph.faceShape} options={OPTIONS.faceShape.map(v=>({value:v, label:v}))} onChange={(e) => updateMorph('faceShape', e.target.value)} />
                <BiometricSlider label="Jawline" value={morph.jawlineDefinition} onChange={(v) => updateMorph('jawlineDefinition', v)} leftLabel="Soft" rightLabel="Sharp"/>
                <BiometricSlider label="Cheekbones" value={morph.cheekboneHeight} onChange={(v) => updateMorph('cheekboneHeight', v)} leftLabel="Low" rightLabel="High"/>
            </SliderGroup>

            <SliderGroup title="Ocular & Nasal" icon={Eye}>
                <BiometricSlider label="Eye Size" value={morph.eyeSize} onChange={(v) => updateMorph('eyeSize', v)} leftLabel="Narrow" rightLabel="Doe" />
                <BiometricSlider label="Nose" value={morph.noseStructure} onChange={(v) => updateMorph('noseStructure', v)} leftLabel="Button" rightLabel="Aquiline" />
                <BiometricSlider label="Lips" value={morph.lipFullness} onChange={(v) => updateMorph('lipFullness', v)} leftLabel="Thin" rightLabel="Full" />
            </SliderGroup>
        </div>
    );
};