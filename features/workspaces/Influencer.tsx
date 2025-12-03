
import React, { memo } from 'react';
import { InfluencerSettings } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { TextArea, VisualGridSelect, DebouncedInput } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { OPTIONS } from '../../data/options';
import { useTranslation } from '../../contexts/LanguageContext';
import { useWorkspace } from '../../hooks/useWorkspace';
import { AppMode } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const InfluencerWorkspace = memo(() => {
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
    } = useWorkspace(AppMode.INFLUENCER);

    useKeyboardShortcuts({ onGenerate }); 

    const influencerSettings = settings as InfluencerSettings;

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in">
            {isPro && <ProControls settings={influencerSettings} setSettings={setSettings} />}

            <DebouncedInput label={t('LBL_LOCATION')} value={influencerSettings.location} onChange={(e) => update('location', e.target.value)} />
            <LocationSelector previews={locationPreviews} selected={influencerSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
            <TextArea label={t('LBL_ACTION')} value={influencerSettings.action} onChange={(e) => update('action', e.target.value)} />
            
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect label={t('LBL_TIME')} value={influencerSettings.timeOfDay} options={mapOptions(OPTIONS.timeOfDay, 'OPT_TIME')} onChange={(e: any) => update('timeOfDay', e.target.value)} />
                <VisualGridSelect label={t('LBL_VIBE')} value={influencerSettings.vibe} options={mapOptions(OPTIONS.vibe, 'OPT_VIBE')} onChange={(e: any) => update('vibe', e.target.value)} />
            </div>
            
            <WorkspaceDock 
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                tier={tier}
                setTier={setTier}
            />
        </div>
    );
});
