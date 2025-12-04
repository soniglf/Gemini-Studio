import React, { memo } from 'react';
import { StudioSettings, InfluencerSettings, MotionSettings, AppMode, GenerationTier } from '../../types';
import { Input, VisualGridSelect, DebouncedInput, VisualAspectSelect, SliderGroup, BiometricSlider } from '../../components/UI';
import { OPTIONS } from '../../data/options';
import { useTranslation } from '../../contexts/LanguageContext';
import { Camera, Zap, Aperture, Sliders, DollarSign, Activity } from 'lucide-react';
import { THEME, MODE_COLORS } from '../../data/theme';
import { useUIStore } from '../../stores/uiStore';

// Reusable "Pro Mode" Control Panel
interface ProControlsProps {
    settings: StudioSettings | InfluencerSettings | MotionSettings;
    setSettings: (s: any) => void;
    isVideo?: boolean;
}

export const ProControls: React.FC<ProControlsProps> = memo(({ settings, setSettings, isVideo = false }) => {
    const { t } = useTranslation();
    const update = (field: string, value: any) => setSettings({ ...settings, [field]: value });

    return (
        <div className="bg-[#0B1221] border border-white/5 rounded-xl overflow-hidden mb-6 transition-all animate-in slide-in-from-top-2">
            <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center gap-2">
                <Sliders size={14} className="text-[var(--neon-primary)]"/>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{t('LBL_PRO_MODE')}</span>
            </div>
            
            <div className="p-4 grid gap-4">
                <SliderGroup title={t('LBL_CAMERA')} icon={Camera}>
                    <div className="grid grid-cols-2 gap-4">
                        <VisualGridSelect label={t('LBL_CAMERA')} value={settings.cameraModel} options={OPTIONS.cameraModel.map(v=>({value:v, label:v}))} onChange={(e) => update('cameraModel', e.target.value)} />
                        <VisualGridSelect label={t('LBL_FOCAL')} value={settings.lensFocalLength} options={OPTIONS.lensFocal.map(v=>({value:v, label:v}))} onChange={(e) => update('lensFocalLength', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <VisualGridSelect label={t('LBL_APERTURE')} value={settings.aperture} options={OPTIONS.aperture.map(v=>({value:v, label:v}))} onChange={(e) => update('aperture', e.target.value)} />
                        <VisualGridSelect label={t('LBL_ISO')} value={settings.iso} options={OPTIONS.iso.map(v=>({value:v, label:v}))} onChange={(e) => update('iso', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <VisualGridSelect label={t('LBL_SHUTTER')} value={settings.shutterSpeed} options={OPTIONS.shutterSpeed.map(v=>({value:v, label:v}))} onChange={(e) => update('shutterSpeed', e.target.value)} />
                        <VisualGridSelect label={t('LBL_COLOR')} value={settings.colorGrading} options={OPTIONS.colorGrading.map(v=>({value:v, label:v}))} onChange={(e) => update('colorGrading', e.target.value)} />
                    </div>
                </SliderGroup>

                {isVideo && (
                    <SliderGroup title="Motion Physics" icon={Aperture}>
                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label={t('LBL_FPS')} value={(settings as MotionSettings).fps} options={OPTIONS.fps.map(v=>({value:v, label:v}))} onChange={(e) => update('fps', e.target.value)} />
                            <VisualGridSelect label={t('LBL_ANGLE')} value={(settings as MotionSettings).shutterAngle} options={OPTIONS.shutterAngle.map(v=>({value:v, label:v}))} onChange={(e) => update('shutterAngle', e.target.value)} />
                        </div>
                        <VisualGridSelect label={t('LBL_STAB')} value={(settings as MotionSettings).stabilization} options={OPTIONS.stabilization.map(v=>({value:v, label:v}))} onChange={(e) => update('stabilization', e.target.value)} />
                    </SliderGroup>
                )}

                <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                    <DebouncedInput label="Negative Prompt (Exclude)" value={settings.customNegative || ""} onChange={(e) => update('customNegative', e.target.value)} placeholder="e.g. blur, deformity, text..." />
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-white/30 uppercase font-bold">Seed</span>
                        <input 
                            type="number" 
                            value={settings.seed || ""} 
                            onChange={(e) => update('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Random"
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white w-24 text-right focus:outline-none focus:border-pink-500/50"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export const WorkspaceDock = memo(({ onGenerate, isGenerating, isVideo = false }: { onGenerate: () => void, isGenerating: boolean, isVideo?: boolean }) => {
    const { mode, tier } = useUIStore();
    const colors = MODE_COLORS[mode] || MODE_COLORS[AppMode.CREATOR];
    
    // Cost logic
    const cost = tier === GenerationTier.SKETCH ? 0 : (isVideo ? 0.20 : 0.04);
    const label = tier === GenerationTier.SKETCH ? (isVideo ? 'Turbo Preview' : 'Flash Sketch') : (isVideo ? 'Pro Render' : 'High Fidelity');

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#020617]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-50 flex items-center shadow-2xl shadow-black/50 ring-1 ring-white/5 animate-in slide-in-from-bottom-4">
            <div className="hidden sm:flex flex-col justify-center px-4 border-r border-white/10 min-w-[100px]">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Est. Cost</span>
                <span className={`text-xs font-bold font-mono flex items-center gap-1 ${cost > 0 ? 'text-pink-400' : 'text-emerald-400'}`}>
                    <DollarSign size={10}/> {cost.toFixed(2)}
                </span>
            </div>
            
            <div className="flex-1 px-4 flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Quality Profile</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 ${tier === GenerationTier.RENDER ? 'text-pink-400' : 'text-yellow-400'}`}>
                    {tier === GenerationTier.RENDER ? <Activity size={12} /> : <Zap size={12} />}
                    <span className="text-[10px] font-bold uppercase">{label}</span>
                </div>
            </div>

            <div className="pl-2">
                <button 
                    onClick={onGenerate} 
                    disabled={isGenerating} 
                    className={`h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${isGenerating ? 'bg-slate-800 text-white/50 cursor-not-allowed' : 'text-white'}`}
                    style={!isGenerating ? { background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 0 20px ${colors.primary}40` } : {}}
                >
                    {isGenerating ? (<>Processing <Activity size={16} className="animate-spin"/></>) : (<>GENERATE <Zap size={16} className="fill-current"/></>)}
                </button>
            </div>
        </div>
    );
});