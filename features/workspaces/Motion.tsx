
import React, { memo, useEffect, useState } from 'react';
import { MotionSettings, GenerationTier } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { TextArea, VisualGridSelect, DebouncedInput, VisualAspectSelect, ImageUpload } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { ImagePlus } from 'lucide-react';
import { OPTIONS } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';

export const MotionWorkspace = memo(() => {
    const { motionSettings, setMotionSettings, generate, locationPreviews, isPreviewLoading, fetchPreviews, isGenerating } = useGenerationStore();
    const { isPro } = useUIStore();
    const { t } = useTranslation();
    const [tier, setTier] = useState<GenerationTier>(GenerationTier.RENDER);

    useEffect(() => { fetchPreviews(); }, [motionSettings.location]);

    const update = (field: keyof MotionSettings, value: any) => setMotionSettings({ ...motionSettings, [field]: value });

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in">
            {isPro && <ProControls settings={motionSettings} setSettings={setMotionSettings} isVideo={true} />}

            {/* Image to Video Input */}
            <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5 mb-4">
                <div className="flex items-center gap-2 mb-3 text-pink-400">
                    <ImagePlus size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Image-to-Video</span>
                </div>
                <ImageUpload 
                    label="Source Frame (Optional)" 
                    value={motionSettings.sourceImage} 
                    onChange={(v) => update('sourceImage', v)} 
                    compact 
                />
                <p className="text-[10px] text-white/30 mt-2">Upload a generated character to animate them using Veo.</p>
            </div>

            <DebouncedInput label={t('LBL_LOCATION')} value={motionSettings.location} onChange={(e) => update('location', e.target.value)} />
            <LocationSelector previews={locationPreviews} selected={motionSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
            
            <TextArea label={t('LBL_MOVEMENT')} value={motionSettings.action} onChange={(e) => update('action', e.target.value)} placeholder="Describe the motion and scene..." />
            
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect label={t('LBL_VIBE')} value={motionSettings.vibe} options={mapOptions(OPTIONS.vibe, 'OPT_VIBE')} onChange={(e: any) => update('vibe', e.target.value)} />
                <VisualAspectSelect label={t('LBL_RATIO')} value={motionSettings.aspectRatio} onChange={(v) => update('aspectRatio', v)} />
            </div>

            <WorkspaceDock 
                onGenerate={() => generate(tier)}
                isGenerating={isGenerating}
                tier={tier}
                setTier={setTier}
                isVideo={true}
            />
        </div>
    );
});
