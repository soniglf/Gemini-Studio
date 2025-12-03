
import React, { memo, useEffect, useState } from 'react';
import { InfluencerSettings, GenerationTier } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { TextArea, VisualGridSelect, DebouncedInput } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { OPTIONS } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';

export const InfluencerWorkspace = memo(() => {
    const { influencerSettings, setInfluencerSettings, generate, locationPreviews, isPreviewLoading, fetchPreviews, isGenerating } = useGenerationStore();
    const { isPro } = useUIStore();
    const { t } = useTranslation();
    const [tier, setTier] = useState<GenerationTier>(GenerationTier.RENDER);

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
            
            <WorkspaceDock 
                onGenerate={() => generate(tier)}
                isGenerating={isGenerating}
                tier={tier}
                setTier={setTier}
            />
        </div>
    );
});
