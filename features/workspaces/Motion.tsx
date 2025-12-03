
import React, { memo } from 'react';
import { MotionSettings } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { TextArea, VisualGridSelect, DebouncedInput, VisualAspectSelect, ImageUpload } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { ImagePlus } from 'lucide-react';
import { OPTIONS } from '../../data/options';
import { useTranslation } from '../../contexts/LanguageContext';
import { useWorkspace } from '../../hooks/useWorkspace';
import { AppMode } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const MotionWorkspace = memo(() => {
    const { t } = useTranslation();
    const {
        settings,
        update,
        isPro,
        tier,
        setTier,
        onGenerate,
        isGenerating,
        locationPreviews,
        isPreviewLoading,
        setSettings,
    } = useWorkspace(AppMode.MOTION);

    useKeyboardShortcuts({ onGenerate }); 
    
    const motionSettings = settings as MotionSettings;

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in">
            {isPro && <ProControls settings={motionSettings} setSettings={setSettings} isVideo={true} />}

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
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                tier={tier}
                setTier={setTier}
                isVideo={true}
            />
        </div>
    );
});
