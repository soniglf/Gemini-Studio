
import React, { memo, useState } from 'react';
import { StudioSettings, InfluencerSettings, MotionSettings, GenerationTier, ModelAttributes } from '../../types';
import { VisualGridSelect, TextArea, Input } from '../../components/UI';
import { Aperture, Lock, Unlock, Settings, ChevronDown, CheckSquare, Square, Save, Bookmark, Trash2, Undo2, Redo2, Eye, EyeOff, Share2, Dices, Zap, Layers, DollarSign, Activity } from 'lucide-react';
import { OPTIONS } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useGenerationStore } from '../../stores/generationStore';
import { usePresetStore } from '../../stores/presetStore';
import { useUIStore } from '../../stores/uiStore';
import { RandomizerService } from '../../services/utils/randomizer';

// --- INTERFACES ---

export interface WorkspaceActions {
    generate: (tier: GenerationTier) => void;
}

export interface CreatorActions extends WorkspaceActions {
    create: () => void;
    delete: () => void;
}

export interface BaseWorkspaceProps {
    actions: WorkspaceActions;
    previews: string[];
    isGenerating: boolean;
    isPro: boolean;
}

export interface CreatorWorkspaceProps {
    model: ModelAttributes;
    setModel: (m: ModelAttributes) => void;
    savedModels: ModelAttributes[];
    actions: CreatorActions;
}

export interface StudioWorkspaceProps extends BaseWorkspaceProps {
    settings: StudioSettings;
    setSettings: (s: StudioSettings) => void;
}

export interface InfluencerWorkspaceProps extends BaseWorkspaceProps {
    settings: InfluencerSettings;
    setSettings: (s: InfluencerSettings) => void;
}

export interface MotionWorkspaceProps extends BaseWorkspaceProps {
    settings: MotionSettings;
    setSettings: (s: MotionSettings) => void;
}

export interface BillingWorkspaceProps {
    stats: any;
}

interface ProControlsProps {
    settings: StudioSettings | InfluencerSettings | MotionSettings;
    setSettings: (s: any) => void;
    isVideo?: boolean;
}

// --- SHARED COMPONENTS ---

const LockableSelect = memo(({ label, value, onChange, options, fieldKey }: { label: string, value: string, onChange: any, options: any, fieldKey: string }) => {
    const { lockedKeys, toggleLock } = useGenerationStore();
    const isLocked = lockedKeys.includes(fieldKey);

    return (
        <div className="relative group/lock">
            <VisualGridSelect label={label} value={value} onChange={onChange} options={options} />
            <button 
                onClick={(e) => { e.stopPropagation(); toggleLock(fieldKey); }}
                className={`absolute top-0 right-0 p-1 rounded-bl-lg transition-colors z-10 ${isLocked ? 'text-pink-400 bg-pink-400/10' : 'text-white/20 hover:text-white/50'}`}
                title={isLocked ? "Unlock parameter" : "Lock parameter across workspaces"}
            >
                {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
            </button>
        </div>
    );
});

const PresetManager = memo(({ currentSettings }: { currentSettings: any }) => {
    const { presets, savePreset, deletePreset, exportPreset } = usePresetStore();
    const { mode, addToast } = useUIStore();
    const { setStudioSettings, setInfluencerSettings, setMotionSettings } = useGenerationStore();
    const [isSaving, setIsSaving] = useState(false);
    const [presetName, setPresetName] = useState("");

    const handleSave = () => {
        if(!presetName.trim()) return;
        savePreset(presetName, mode as any, currentSettings);
        setPresetName("");
        setIsSaving(false);
        addToast("Preset Saved", 'success');
    };

    const handleLoad = (p: any) => {
        if (mode === 'STUDIO') setStudioSettings({ ...currentSettings, ...p.settings });
        if (mode === 'INFLUENCER') setInfluencerSettings({ ...currentSettings, ...p.settings });
        if (mode === 'MOTION') setMotionSettings({ ...currentSettings, ...p.settings });
        addToast(`Preset "${p.name}" Applied`, 'success');
    };

    const filteredPresets = presets.filter(p => p.mode === mode);

    return (
        <div className="mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
            <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-white/50 uppercase">Style Presets</span>
                 <button onClick={() => setIsSaving(!isSaving)} className="text-[10px] text-pink-400 flex items-center gap-1 hover:text-pink-300">
                     <Save size={12}/> Save Current
                 </button>
            </div>
            
            {isSaving && (
                <div className="flex gap-2 mb-2 animate-in slide-in-from-top-1">
                    <input 
                        value={presetName} 
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset Name..."
                        className="flex-1 bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/10"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <button onClick={handleSave} className="bg-pink-600 text-white px-2 rounded text-xs">Save</button>
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {filteredPresets.map(p => (
                    <div key={p.id} className="group relative shrink-0">
                        <button 
                            onClick={() => handleLoad(p)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-white flex items-center gap-1"
                        >
                            <Bookmark size={10} className="text-emerald-400"/> {p.name}
                        </button>
                        <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); exportPreset(p.id); }}
                                className="bg-blue-600 text-white rounded-full p-0.5 hover:bg-blue-500"
                                title="Export Style"
                            >
                                <Share2 size={8}/>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                                className="bg-red-500 text-white rounded-full p-0.5 hover:bg-red-400"
                                title="Delete"
                            >
                                <Trash2 size={8}/>
                            </button>
                        </div>
                    </div>
                ))}
                {filteredPresets.length === 0 && <span className="text-[10px] text-white/20 italic">No saved presets</span>}
            </div>
        </div>
    );
});

export const ProControls = memo(({ settings, setSettings, isVideo = false }: ProControlsProps) => {
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { undo, redo, interceptEnabled, toggleIntercept, historyIndex, history } = useGenerationStore();
    const { mode, addToast } = useUIStore();
    
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const handleChange = (field: string, value: any) => {
        setSettings({ ...settings, [field]: value });
    };

    const handleRandomize = () => {
        let newSettings;
        if (mode === 'STUDIO') newSettings = RandomizerService.randomizeStudio(settings as StudioSettings);
        else if (mode === 'INFLUENCER') newSettings = RandomizerService.randomizeInfluencer(settings as InfluencerSettings);
        else if (mode === 'MOTION') newSettings = RandomizerService.randomizeMotion(settings as MotionSettings);
        
        if (newSettings) {
            setSettings(newSettings);
            addToast("Chaos Engine: Settings Randomized", 'success');
        }
    };

    return (
        <div className="bg-slate-900/30 p-4 rounded-xl border border-pink-500/10 mb-6 animate-in slide-in-from-top-2 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-pink-400">
                    <Aperture size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('LBL_PRO_MODE')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRandomize}
                        className="p-1 rounded text-white/40 hover:text-pink-400 hover:bg-white/5 transition-colors"
                        title="Chaos Engine (Randomize Settings)"
                    >
                        <Dices size={14}/>
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-1"></div>

                    {/* History Controls */}
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        <button onClick={undo} disabled={!canUndo} className={`p-1 rounded ${canUndo ? 'text-white hover:bg-white/10' : 'text-white/20'}`} title="Undo"><Undo2 size={12}/></button>
                        <button onClick={redo} disabled={!canRedo} className={`p-1 rounded ${canRedo ? 'text-white hover:bg-white/10' : 'text-white/20'}`} title="Redo"><Redo2 size={12}/></button>
                    </div>

                    <div className="h-4 w-px bg-white/10"></div>

                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                        <Settings size={12} /> Advanced {showAdvanced ? <ChevronDown size={12} className="rotate-180"/> : <ChevronDown size={12}/>}
                    </button>
                </div>
            </div>
            
            <PresetManager currentSettings={settings} />

            <div className="grid grid-cols-2 gap-3">
                <LockableSelect fieldKey="cameraModel" label={t('LBL_CAMERA')} value={settings.cameraModel} onChange={(e: any) => handleChange('cameraModel', e.target.value)} options={OPTIONS.cameraModel} />
                <LockableSelect fieldKey="lensFocalLength" label={t('LBL_FOCAL')} value={settings.lensFocalLength} onChange={(e: any) => handleChange('lensFocalLength', e.target.value)} options={OPTIONS.lensFocal} />
                <LockableSelect fieldKey="aperture" label={t('LBL_APERTURE')} value={settings.aperture} onChange={(e: any) => handleChange('aperture', e.target.value)} options={OPTIONS.aperture} />
                <LockableSelect fieldKey="iso" label={t('LBL_ISO')} value={settings.iso} onChange={(e: any) => handleChange('iso', e.target.value)} options={OPTIONS.iso} />
                <LockableSelect fieldKey="shutterSpeed" label={t('LBL_SHUTTER')} value={settings.shutterSpeed} onChange={(e: any) => handleChange('shutterSpeed', e.target.value)} options={OPTIONS.shutterSpeed} />
                <LockableSelect fieldKey="lightingSetup" label={t('LBL_LIGHTING')} value={settings.lightingSetup} onChange={(e: any) => handleChange('lightingSetup', e.target.value)} options={OPTIONS.lightingSetup.map(v => ({ value: v, label: t(`OPT_LIGHTING_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v }))} />
                <LockableSelect fieldKey="colorGrading" label={t('LBL_COLOR')} value={settings.colorGrading} onChange={(e: any) => handleChange('colorGrading', e.target.value)} options={OPTIONS.colorGrading} />
                <LockableSelect fieldKey="resolution" label={t('LBL_RES')} value={settings.resolution} onChange={(e: any) => handleChange('resolution', e.target.value)} options={isVideo ? OPTIONS.resolutionVideo : OPTIONS.resolutionImage} />
                
                {isVideo && 'fps' in settings && (
                    <>
                        <LockableSelect fieldKey="fps" label={t('LBL_FPS')} value={(settings as MotionSettings).fps} onChange={(e: any) => handleChange('fps', e.target.value)} options={OPTIONS.fps} />
                        <LockableSelect fieldKey="shutterAngle" label={t('LBL_ANGLE')} value={(settings as MotionSettings).shutterAngle} onChange={(e: any) => handleChange('shutterAngle', e.target.value)} options={OPTIONS.shutterAngle} />
                        <LockableSelect fieldKey="stabilization" label={t('LBL_STAB')} value={(settings as MotionSettings).stabilization} onChange={(e: any) => handleChange('stabilization', e.target.value)} options={OPTIONS.stabilization} />
                    </>
                )}
            </div>

            {/* GOD MODE: ADVANCED CONTROLS */}
            {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                             <Input 
                                label="Seed (RNG)" 
                                type="number" 
                                value={settings.seed !== undefined ? settings.seed : ""} 
                                onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="Random"
                                className="mb-2"
                             />
                             <button 
                                onClick={() => handleChange('seed', settings.seed !== undefined ? undefined : 42)}
                                className="text-[10px] text-white/50 flex items-center gap-1 hover:text-white"
                             >
                                 {settings.seed === undefined ? <CheckSquare size={12} className="text-pink-500"/> : <Square size={12}/>} Randomize
                             </button>
                        </div>
                        
                        {/* Prompt Interceptor Toggle */}
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] mb-2">Raw Mode</span>
                            <button 
                                onClick={toggleIntercept}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${interceptEnabled ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'bg-white/5 text-white/40 hover:text-white'}`}
                            >
                                {interceptEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                {interceptEnabled ? "Glass Box On" : "Glass Box Off"}
                            </button>
                            <p className="text-[9px] text-white/30 mt-1 max-w-[120px] text-right">Inspect & Edit prompt before generation.</p>
                        </div>
                    </div>
                    
                    <TextArea 
                        label="Negative Prompt (Safety Override)"
                        value={settings.customNegative || ""}
                        onChange={(e) => handleChange('customNegative', e.target.value)}
                        placeholder="e.g. text, watermark, blur, cartoon..."
                        className="h-20"
                    />
                </div>
            )}
        </div>
    );
});

// --- THE OMNI-DOCK ---
export const WorkspaceDock = memo(({ onGenerate, isGenerating, tier, setTier, isVideo = false }: { onGenerate: () => void, isGenerating: boolean, tier: GenerationTier, setTier: (t: GenerationTier) => void, isVideo?: boolean }) => {
    
    const cost = tier === GenerationTier.SKETCH ? 0 : (isVideo ? 0.20 : 0.04);
    const label = tier === GenerationTier.SKETCH ? (isVideo ? 'Turbo Preview' : 'Flash Sketch') : (isVideo ? 'Pro Render' : 'High Fidelity');

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#020617]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-50 flex items-center shadow-2xl shadow-black/50 ring-1 ring-white/5 animate-in slide-in-from-bottom-4">
            
            {/* Status Module */}
            <div className="hidden sm:flex flex-col justify-center px-4 border-r border-white/10 min-w-[100px]">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Est. Cost</span>
                <span className={`text-xs font-bold font-mono flex items-center gap-1 ${cost > 0 ? 'text-pink-400' : 'text-emerald-400'}`}>
                    <DollarSign size={10}/> {cost.toFixed(2)}
                </span>
            </div>

            {/* Tier Selector Switch */}
            <div className="flex-1 px-4 flex justify-center">
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 relative">
                    <button 
                        onClick={() => setTier(GenerationTier.SKETCH)}
                        className={`relative z-10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${tier === GenerationTier.SKETCH ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        {isVideo ? 'Fast' : 'Sketch'}
                    </button>
                    <button 
                        onClick={() => setTier(GenerationTier.RENDER)}
                        className={`relative z-10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${tier === GenerationTier.RENDER ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        {isVideo ? 'Pro' : 'Render'}
                    </button>
                    
                    {/* Sliding Background */}
                    <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-md transition-transform duration-300 ease-out border border-white/10 ${tier === GenerationTier.RENDER ? 'translate-x-full' : 'translate-x-0'}`}
                    />
                </div>
            </div>

            {/* Main Trigger */}
            <div className="pl-2">
                <button 
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className={`h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${isGenerating 
                        ? 'bg-slate-800 text-white/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/20'}`}
                >
                    {isGenerating ? (
                        <>Processing <Activity size={16} className="animate-spin"/></>
                    ) : (
                        <>{label} <Zap size={16} className="fill-current"/></>
                    )}
                </button>
            </div>
        </div>
    );
});
