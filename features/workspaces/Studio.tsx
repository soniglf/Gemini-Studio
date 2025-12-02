import React, { memo, useEffect } from 'react';
import { StudioSettings, GenerationTier } from '../../types';
import { ProControls } from './Shared';
import { Button, Input, VisualGridSelect, ImageUpload, VisualAspectSelect, DebouncedInput } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { Zap, Camera } from 'lucide-react';
import { OPTIONS } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';

export const StudioWorkspace = memo(() => {
    const { studioSettings, setStudioSettings, generate, locationPreviews, isPreviewLoading, fetchPreviews } = useGenerationStore();
    const { isPro } = useUIStore();
    const { t } = useTranslation();

    useEffect(() => { fetchPreviews(); }, [studioSettings.background]);

    const update = (field: keyof StudioSettings, value: any) => setStudioSettings({ ...studioSettings, [field]: value });

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in">
            {isPro && <ProControls settings={studioSettings} setSettings={setStudioSettings} />}
            
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
            
            <div className="flex gap-2 mt-8">
                <Button variant="secondary" className="flex-1" onClick={() => generate(GenerationTier.SKETCH)}><Zap size={18} className="text-yellow-400"/></Button>
                <Button className="flex-[3]" onClick={() => generate(GenerationTier.RENDER)}>{t('BTN_SHOOT')} <Camera size={18}/></Button>
            </div>
        </div>
    );
});