
import React, { memo } from 'react';
import { StudioSettings } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { Input, VisualGridSelect, ImageUpload, VisualAspectSelect, DebouncedInput } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { OPTIONS } from '../../data/options';
import { useTranslation } from '../../contexts/LanguageContext';
import { useWorkspace } from '../../hooks/useWorkspace';
import { AppMode } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const StudioWorkspace = memo(() => {
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
    } = useWorkspace(AppMode.STUDIO);

    useKeyboardShortcuts({ onGenerate }); 

    const studioSettings = settings as StudioSettings;

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in">
            {isPro && <ProControls settings={studioSettings} setSettings={setSettings} />}
            
            <DebouncedInput label={t('LBL_BACKGROUND')} value={studioSettings.background} onChange={(e) => update('background', e.target.value)} />
            <LocationSelector previews={locationPreviews} selected={studioSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
            
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect label={t('LBL_SHOT_TYPE')} value={studioSettings.shotType} options={mapOptions(OPTIONS.shotType, 'OPT_SHOT')} onChange={(e: any) => update('shotType', e.target.value)} />
                <VisualGridSelect label={t('LBL_LIGHTING')} value={studioSettings.lighting} options={mapOptions(OPTIONS.lighting, 'OPT_LIGHTING')} onChange={(e: any) => update('lighting', e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <ImageUpload label={t('LBL_OUTFIT')} value={studioSettings.outfitImage} onChange={(v) => update('outfitImage', v)} compact />
                <ImageUpload label={t('LBL_PRODUCT')} value={studioSettings.productImage} onChange={(v) => update('productImage', v)} compact />
            </div>
            <Input label={t('LBL_INTERACTION')} value={studioSettings.productDescription} onChange={(e) => update('productDescription', e.target.value)} placeholder="Holding the product..." />

            <VisualAspectSelect label={t('LBL_RATIO')} value={studioSettings.aspectRatio} onChange={(v) => update('aspectRatio', v)} />
            
            <WorkspaceDock 
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                tier={tier}
                setTier={setTier}
            />
        </div>
    );
});
