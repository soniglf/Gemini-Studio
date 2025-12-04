import React from 'react';
import { VisualGridSelect, Input, TextArea, BiometricSlider } from '../../components/UI';
import { OPTIONS, GENDER_SPECIFIC } from '../../data/options';
import { useModelStore } from '../../stores/modelStore';

export const StylingPanel: React.FC = () => {
    const { model, setModel } = useModelStore();

    const update = (field: keyof typeof model, value: any) => {
        setModel({ ...model, [field]: value });
    };

    const updateMorph = (field: keyof typeof model.morphology, value: any) => {
        setModel({ ...model, morphology: { ...model.morphology, [field]: value } });
    };

    const genderOptions = model.gender === 'MALE' ? GENDER_SPECIFIC.MALE : GENDER_SPECIFIC.FEMALE;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect label="Hair Style" value={model.hairStyle} options={genderOptions.hairStyle.map(v=>({value:v, label:v}))} onChange={(e) => update('hairStyle', e.target.value)} />
                <VisualGridSelect label="Hair Color" value={model.hairColor} options={OPTIONS.hairColor.map(v=>({value:v, label:v}))} onChange={(e) => update('hairColor', e.target.value)} />
                <VisualGridSelect label="Hair Texture" value={model.hairTexture} options={OPTIONS.hairTexture.map(v=>({value:v, label:v}))} onChange={(e) => update('hairTexture', e.target.value)} />
                <VisualGridSelect label="Eyebrow Style" value={model.eyebrowStyle} options={OPTIONS.eyebrowStyle.map(v=>({value:v, label:v}))} onChange={(e) => update('eyebrowStyle', e.target.value)} />
                <VisualGridSelect label="Eye Color" value={model.eyeColor} options={['Brown', 'Hazel', 'Blue', 'Green', 'Grey', 'Amber']} onChange={(e) => update('eyeColor', e.target.value)} />
                <VisualGridSelect label="Skin Tone" value={model.skinTone} options={OPTIONS.skinTone.map(v=>({value:v, label:v}))} onChange={(e) => update('skinTone', e.target.value)} />
                <VisualGridSelect label="Eyewear" value={model.glasses} options={OPTIONS.glasses.map(v=>({value:v, label:v}))} onChange={(e) => update('glasses', e.target.value)} />
                {model.gender === 'MALE' && (
                    <VisualGridSelect label="Facial Hair" value={model.facialHair} options={genderOptions.facialHair.map(v=>({value:v, label:v}))} onChange={(e) => update('facialHair', e.target.value)} />
                )}
            </div>
            
            <VisualGridSelect 
                label="Identity Outfit" 
                value={model.clothingStyle} 
                options={OPTIONS.identityOutfits.map(v=>({value:v, label:v}))} 
                onChange={(e) => update('clothingStyle', e.target.value)}
                editable 
                placeholder="Custom Outfit..."
            />
            
            <BiometricSlider label="Gray Hair Ratio" value={model.morphology.grayScale || 0} onChange={(v) => updateMorph('grayScale', v)} leftLabel="None" rightLabel="White" />
            <TextArea label="Distinctive Features" value={model.distinctiveFeatures} onChange={(e) => update('distinctiveFeatures', e.target.value)} placeholder="e.g. Freckles across nose..." />
        </div>
    );
};