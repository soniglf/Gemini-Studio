import React, { memo } from 'react';
import { MotionSettings } from '../../types';
import { ProControls, WorkspaceDock } from './Shared';
import { TextArea, VisualGridSelect, DebouncedInput, VisualAspectSelect, ImageUpload } from '../../components/UI';
import { LocationSelector } from '../shared/LocationSelector';
import { ImagePlus, Film, Video, MoveHorizontal, MoveVertical, ZoomIn, Vibrate, RefreshCcw, Camera } from 'lucide-react';
import { OPTIONS } from '../../data/options';
import { useTranslation } from '../../contexts/LanguageContext';
import { useWorkspace } from '../../hooks/useWorkspace';
import { AppMode } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const CinematographyRig = memo(({ value, onChange }: { value: string, onChange: (v:string) => void }) => {
    const movements = [
        { id: 'Static Tripod', icon: Camera, label: 'Static' },
        { id: 'Slow Pan Left', icon: MoveHorizontal, label: 'Pan L' },
        { id: 'Slow Pan Right', icon: MoveHorizontal, label: 'Pan R' },
        { id: 'Tracking Shot (Forward)', icon: Video, label: 'Track Fwd' },
        { id: 'Dolly Zoom (Vertigo)', icon: ZoomIn, label: 'Dolly Zoom' },
        { id: 'Handheld (Shaky)', icon: Vibrate, label: 'Handheld' },
        { id: 'Orbit / Arc Shot', icon: RefreshCcw, label: 'Orbit' },
    ];

    return (
        <div className="bg-[#0B1121] p-4 rounded-sm border border-violet-900/30 mb-4 relative overflow-hidden group">
            {/* Ambient Backlight */}
            <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-gradient-to-br from-violet-600/10 via-transparent to-transparent pointer-events-none blur-3xl"></div>

            <div className="flex items-center gap-2 mb-3 text-violet-400 relative z-10">
                <Video size={16} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">CINEMATOGRAPHY_RIG</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 relative z-10">
                {movements.map(move => {
                    const isActive = value === move.id;
                    return (
                        <button
                            key={move.id}
                            onClick={() => onChange(move.id)}
                            className={`flex flex-col items-center p-3 rounded-sm border min-w-[80px] transition-all relative overflow-hidden ${isActive ? 'bg-violet-900/20 border-violet-500/50' : 'bg-[#0f172a] border-white/5 hover:border-violet-500/30'}`}
                        >
                            <move.icon size={18} className={`mb-2 ${isActive ? 'text-violet-400' : 'text-white/40'}`} />
                            <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-violet-100' : 'text-white/60'}`}>{move.label}</span>
                            {isActive && <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-violet-500"></div>}
                            {isActive && <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-violet-500"></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

export const MotionWorkspace = memo(() => {
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
    } = useWorkspace(AppMode.MOTION);

    useKeyboardShortcuts({ onGenerate }); 
    
    const motionSettings = settings as MotionSettings;

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/[\s-]/g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-4 pb-32 animate-in fade-in relative">
            {/* Cinematic Letterbox Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 flex flex-col justify-between">
                <div className="h-20 bg-black blur-xl"></div>
                <div className="h-20 bg-black blur-xl"></div>
            </div>

            {/* Header HUD */}
            <div className="flex justify-between items-center px-1 text-[9px] font-mono text-violet-500/50 uppercase tracking-widest mb-2 relative z-10">
                <span>REC: STANDBY</span>
                <span>MODE: MOTION_CAPTURE</span>
            </div>

            {isPro && <ProControls settings={motionSettings} setSettings={setSettings} isVideo={true} />}

            {/* CINEMATOGRAPHY RIG */}
            <CinematographyRig value={motionSettings.movement || 'Static Tripod'} onChange={(v) => update('movement', v)} />

            {/* IMAGE TO VIDEO UPGRADE */}
            <div className={`bg-slate-900/30 p-4 rounded-sm border transition-all duration-300 mb-4 ${motionSettings.sourceImage ? 'border-violet-500/50 bg-violet-900/10' : 'border-white/5'}`}>
                <div className="flex items-center gap-2 mb-3 text-violet-400">
                    <ImagePlus size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Image-to-Video Source</span>
                </div>
                <ImageUpload 
                    label="" 
                    value={motionSettings.sourceImage} 
                    onChange={(v) => update('sourceImage', v)} 
                    compact 
                />
                <p className="text-[10px] text-white/30 mt-2">
                    {motionSettings.sourceImage ? "Source frame locked. AI will animate this image." : "Upload a generated character to animate them using Veo."}
                </p>
            </div>

            {/* SCENE COMPOSITION */}
            <div className="bg-[#0B1221] p-4 rounded-sm border border-white/5 relative mb-4">
                <DebouncedInput label={t('LBL_LOCATION')} value={motionSettings.location} onChange={(e) => update('location', e.target.value)} />
                <LocationSelector previews={locationPreviews} selected={motionSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
                <TextArea label={t('LBL_ACTION')} value={motionSettings.action} onChange={(e) => update('action', e.target.value)} placeholder="Describe the motion and scene activity..." className="h-20" />
            </div>
            
            {/* FILM STOCK & VIBE */}
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect 
                    label="Film Stock" 
                    value={motionSettings.filmStock || "Digital Clean"} 
                    options={OPTIONS.filmStocks.map(v => ({ value: v, label: v }))} 
                    onChange={(e: any) => update('filmStock', e.target.value)} 
                />
                <VisualGridSelect label={t('LBL_VIBE')} value={motionSettings.vibe} options={mapOptions(OPTIONS.vibe, 'OPT_VIBE')} onChange={(e: any) => update('vibe', e.target.value)} />
            </div>

            <VisualAspectSelect label={t('LBL_RATIO')} value={motionSettings.aspectRatio} onChange={(v) => update('aspectRatio', v)} />

            <WorkspaceDock 
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                isVideo={true}
            />
        </div>
    );
});