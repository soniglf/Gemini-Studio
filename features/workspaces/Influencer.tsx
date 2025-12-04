import React, { memo } from 'react';
import { InfluencerSettings } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { TextArea, VisualGridSelect, DebouncedInput, ImageUpload, BiometricSlider } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { OPTIONS } from '../../data/options';
import { useTranslation } from '../../contexts/LanguageContext';
import { useWorkspace } from '../../hooks/useWorkspace';
import { AppMode } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { User, Layers, Share2, Coffee, Heart, MessageCircle, Send } from 'lucide-react';

export const InfluencerWorkspace = memo(() => {
    const { t } = useTranslation();
    const {
        settings,
        update,
        isPro,
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
        label: t(`${prefix}_${v.toUpperCase().replace(/[\s-]/g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-6 pb-32 animate-in fade-in relative">
            {/* Soft Ambient Background */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-rose-900/10 to-transparent pointer-events-none"></div>

            {/* Header Vibe */}
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold text-rose-300/50 uppercase tracking-widest">Story Mode</span>
                <div className="flex gap-2">
                    <Heart size={12} className="text-rose-500/30" />
                    <MessageCircle size={12} className="text-rose-500/30" />
                    <Send size={12} className="text-rose-500/30" />
                </div>
            </div>

            {isPro && <ProControls settings={influencerSettings} setSettings={setSettings} />}

            {/* PHASE 3: PARASOCIAL ENGINE CONTROLS */}
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl space-y-5">
                <div className="flex items-center gap-2 text-rose-400 mb-2">
                    <Share2 size={18} />
                    <span className="text-sm font-bold tracking-wide">Context & Vibe</span>
                </div>
                
                <VisualGridSelect 
                    label="Target Platform" 
                    value={influencerSettings.socialContext || "Instagram Feed"} 
                    options={OPTIONS.socialContexts.map(v => ({ value: v, label: v }))} 
                    onChange={(e: any) => update('socialContext', e.target.value)} 
                />

                <BiometricSlider 
                    label={`Candidness: ${influencerSettings.candidness}%`} 
                    value={influencerSettings.candidness} 
                    onChange={(v) => update('candidness', v)}
                    leftLabel="Posed"
                    rightLabel="Unguarded"
                />

                <button 
                    onClick={() => update('livedIn', !influencerSettings.livedIn)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${influencerSettings.livedIn ? 'bg-gradient-to-r from-rose-900/20 to-orange-900/20 border-rose-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${influencerSettings.livedIn ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/30'}`}>
                            <Coffee size={18} />
                        </div>
                        <div className="text-left">
                            <span className={`block text-sm font-bold ${influencerSettings.livedIn ? 'text-rose-100' : 'text-white/60'}`}>Lived-in Reality</span>
                            <span className="text-[10px] text-white/40">Adds clutter, mess, and organic chaos</span>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${influencerSettings.livedIn ? 'bg-rose-500' : 'bg-slate-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${influencerSettings.livedIn ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect 
                    label="Shot Focus" 
                    value={influencerSettings.shotFocus || "Full Fit"} 
                    options={OPTIONS.shotFocus.map(v => ({ value: v, label: v }))} 
                    onChange={(e: any) => update('shotFocus', e.target.value)} 
                />
                <VisualGridSelect label={t('LBL_TIME')} value={influencerSettings.timeOfDay} options={mapOptions(OPTIONS.timeOfDay, 'OPT_TIME')} onChange={(e: any) => update('timeOfDay', e.target.value)} />
            </div>

            <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5">
                <DebouncedInput label={t('LBL_LOCATION')} value={influencerSettings.location} onChange={(e) => update('location', e.target.value)} />
                <LocationSelector previews={locationPreviews} selected={influencerSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
                <TextArea label={t('LBL_ACTION')} value={influencerSettings.action} onChange={(e) => update('action', e.target.value)} className="h-20"/>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-900/10 to-rose-900/10 rounded-xl p-1 border border-white/5">
                    <ImageUpload label={t('LBL_OUTFIT')} value={influencerSettings.outfitImage} onChange={(v) => update('outfitImage', v)} compact />
                </div>
                <VisualGridSelect 
                    label="Prop / Item" 
                    value={influencerSettings.prop} 
                    options={OPTIONS.influencerProps.map(v => ({ value: v, label: v }))} 
                    onChange={(e: any) => update('prop', e.target.value)} 
                    editable
                    placeholder="Select or type..."
                />
            </div>

            <VisualGridSelect label={t('LBL_VIBE')} value={influencerSettings.vibe} options={mapOptions(OPTIONS.vibe, 'OPT_VIBE')} onChange={(e: any) => update('vibe', e.target.value)} />

            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-2">Carousel Size</span>
                <div className="flex bg-black/40 rounded-lg p-1">
                    {[1, 3, 5].map(num => (
                        <button
                            key={num}
                            onClick={() => update('batchSize', num)}
                            className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all flex items-center gap-2 ${influencerSettings.batchSize === num ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
                        >
                            {num === 1 && <User size={12}/>}
                            {num > 1 && <Layers size={12}/>}
                            {num}x
                        </button>
                    ))}
                </div>
            </div>
            
            <WorkspaceDock 
                onGenerate={onGenerate}
                isGenerating={isGenerating}
            />
        </div>
    );
});