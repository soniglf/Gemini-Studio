import React, { memo, useEffect } from 'react';
import { InfluencerSettings, GenerationTier } from '../../types';
import { ProControls } from './Shared';
import { Button, TextArea, VisualGridSelect, DebouncedInput } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { Zap, Camera } from 'lucide-react';
import { OPTIONS } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';

export const InfluencerWorkspace = memo(() => {
    const { influencerSettings, setInfluencerSettings, generate, locationPreviews, isPreviewLoading, fetchPreviews } = useGenerationStore();
    const { isPro } = useUIStore();
    const { t } = useTranslation();

    useEffect(() => { fetchPreviews(); }, [influencerSettings.location]);

    const update = (field: keyof InfluencerSettings, value: any) => setInfluencerSettings({ ...influencerSettings, [field]: value });

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in">
            {isPro && <ProControls settings={influencerSettings} setSettings={setInfluencerSettings} />}

            <DebouncedInput label={t('LBL_LOCATION')} value={influencerSettings.location} onChange={(e) => update('location', e.target.value)} />
            <LocationSelector previews={locationPreviews} selected={influencerSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
            <TextArea label={t('LBL_ACTION')} value={influencerSettings.action} onChange={(e) => update('action', e.target.value)} />
            
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect label={t('LBL_TIME')} value={influencerSettings.timeOfDay} options={mapOptions(OPTIONS.timeOfDay, 'OPT_TIME')} onChange={(e: any) => update('timeOfDay', e.target.value)} />
                <VisualGridSelect label={t('LBL_VIBE')} value={influencerSettings.vibe} options={mapOptions(OPTIONS.vibe, 'OPT_VIBE')} onChange={(e: any) => update('vibe', e.target.value)} />
            </div>
            
            <div className="flex gap-2 mt-8">
                <Button variant="secondary" className="flex-1" onClick={() => generate(GenerationTier.SKETCH)}><Zap size={18} className="text-yellow-400"/></Button>
                <Button className="flex-[3] bg-gradient-to-r from-blue-600 to-cyan-600" onClick={() => generate(GenerationTier.RENDER)}>{t('BTN_SNAP')} <Camera size={18}/></Button>
            </div>
        </div>
    );
});