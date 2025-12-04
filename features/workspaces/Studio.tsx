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
import { Palette, User, Layers, Box, Moon, Sun, Eclipse, Zap, Shirt, Package, Focus, Lightbulb, Grid, Scan, Crosshair } from 'lucide-react';

const LightStage = memo(({ value, onChange }: { value: string, onChange: (v:string) => void }) => {
    const stages = [
        { id: 'Softbox', icon: Box, label: 'Softbox', desc: 'Diffused' },
        { id: 'Rembrandt', icon: Moon, label: 'Rembrandt', desc: 'Moody' },
        { id: 'Butterfly', icon: Sun, label: 'Butterfly', desc: 'Beauty' },
        { id: 'Rim Light', icon: Eclipse, label: 'Rim', desc: 'Halo' },
        { id: 'Hard Flash', icon: Zap, label: 'Hard Flash', desc: 'Editorial' },
    ];

    return (
        <div className="bg-[#0B1221] p-4 rounded-sm border border-cyan-900/30 mb-4 relative overflow-hidden group">
            {/* Tech Decoration */}
            <div className="absolute top-0 right-0 p-1">
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-cyan-500/50 rounded-full"></div>
                    <div className="w-1 h-1 bg-cyan-500/30 rounded-full"></div>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3 text-cyan-400">
                <Lightbulb size={16} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">LIGHT_STAGE.SYS</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {stages.map(stage => {
                    const isActive = value === stage.id;
                    return (
                        <button
                            key={stage.id}
                            onClick={() => onChange(stage.id)}
                            className={`flex flex-col items-center p-3 rounded-sm border min-w-[80px] transition-all relative overflow-hidden ${isActive ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-[#0f172a] border-white/5 hover:border-cyan-500/30'}`}
                        >
                            <stage.icon size={18} className={`mb-2 ${isActive ? 'text-cyan-400' : 'text-white/40'}`} />
                            <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-cyan-100' : 'text-white/60'}`}>{stage.label}</span>
                            {isActive && <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>}
                            {isActive && <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

export const StudioWorkspace = memo(() => {
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
    } = useWorkspace(AppMode.STUDIO);

    useKeyboardShortcuts({ onGenerate }); 

    const studioSettings = settings as StudioSettings;

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/[\s-]/g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    const BACKDROP_COLORS = [
        { name: 'Pure White', value: '#FFFFFF' },
        { name: 'Pitch Black', value: '#000000' },
        { name: 'Studio Grey', value: '#808080' },
        { name: 'Chroma Green', value: '#00FF00' },
        { name: 'Warm Beige', value: '#F5F5DC' },
        { name: 'Midnight Blue', value: '#191970' },
    ];

    const focusMode = studioSettings.focusPriority || 'FACE';

    return (
        <div className="space-y-4 pb-32 animate-in fade-in relative">
            {/* Technical Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-5" 
                 style={{ backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Header HUD */}
            <div className="flex justify-between items-center px-1 text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest mb-2">
                <span>SYS: ONLINE</span>
                <span>MODE: STUDIO_CTRL</span>
            </div>

            {isPro && <ProControls settings={studioSettings} setSettings={setSettings} />}
            
            {/* PRODUCT ANCHOR TOGGLE */}
            <div className="flex bg-[#0B1221] p-1 rounded-sm border border-cyan-900/30 mb-2">
                {[
                    { id: 'FACE', icon: User, label: 'SUBJECT' },
                    { id: 'OUTFIT', icon: Shirt, label: 'OUTFIT' },
                    { id: 'PRODUCT', icon: Package, label: 'PRODUCT' }
                ].map(mode => {
                    const isActive = focusMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => update('focusPriority', mode.id)}
                            className={`flex-1 py-2 rounded-sm flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${isActive ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-white/30 hover:text-white'}`}
                        >
                            <mode.icon size={12} />
                            <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* PRODUCT ANCHOR UPLOADS */}
            <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${focusMode === 'PRODUCT' ? 'p-3 bg-cyan-900/10 rounded-sm border border-cyan-500/30 relative' : ''}`}>
                {focusMode === 'PRODUCT' && <div className="absolute top-0 left-0 bg-cyan-500 text-[8px] font-bold px-2 py-0.5 text-black">MACRO_FOCUS_ENABLED</div>}
                
                <div className={focusMode === 'OUTFIT' ? 'ring-1 ring-cyan-500 rounded-lg p-1 bg-cyan-500/5' : ''}>
                    <ImageUpload label={t('LBL_OUTFIT')} value={studioSettings.outfitImage} onChange={(v) => update('outfitImage', v)} compact />
                </div>
                <div>
                    <ImageUpload label={t('LBL_PRODUCT')} value={studioSettings.productImage} onChange={(v) => update('productImage', v)} compact />
                </div>
            </div>

            {/* LIGHT STAGE */}
            <LightStage value={studioSettings.lightingSetup || 'Softbox'} onChange={(v) => update('lightingSetup', v)} />

            {/* ENVIRONMENT CONTROLS */}
            <div className="bg-[#0B1221] p-4 rounded-sm border border-white/5 relative">
                <div className="absolute -left-px top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <VisualGridSelect 
                        label="Set Design" 
                        value={studioSettings.setDesign || "Seamless Paper Only"} 
                        options={OPTIONS.studioSetDesigns.map(v => ({ value: v, label: v }))} 
                        onChange={(e: any) => update('setDesign', e.target.value)} 
                        editable
                        placeholder="Select or type..."
                    />
                    
                    <VisualGridSelect 
                        label="Props" 
                        value={studioSettings.props} 
                        options={OPTIONS.studioProps.map(v => ({ value: v, label: v }))} 
                        onChange={(e: any) => update('props', e.target.value)} 
                        editable
                        placeholder="Select or type..."
                    />
                </div>
            </div>

            {/* BACKDROP COLOR */}
            <div className="space-y-2 mb-4 p-4 bg-[#0B1221] rounded-sm border border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-white/70">
                        <Palette size={14} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">CANVAS_COLOR</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-900/50">{studioSettings.backgroundColor}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                     {BACKDROP_COLORS.map(c => (
                         <button 
                            key={c.value}
                            onClick={() => update('backgroundColor', c.value)}
                            className={`w-6 h-6 rounded-sm border transition-all ${studioSettings.backgroundColor === c.value ? 'border-cyan-400 ring-1 ring-cyan-400/50 scale-110' : 'border-white/10 hover:border-white/50'}`}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                         />
                     ))}
                     <div className="w-px h-6 bg-white/10 mx-2"></div>
                     <div className="relative flex-1 h-8 rounded-sm overflow-hidden border border-white/10 group cursor-pointer hover:border-cyan-500/30 transition-all">
                        <input 
                            type="color" 
                            value={studioSettings.backgroundColor}
                            onChange={(e) => update('backgroundColor', e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-full flex items-center justify-center gap-2 bg-[#0f172a] text-[9px] font-mono font-bold text-white/50 group-hover:text-white transition-colors">
                            <span className="w-3 h-3 rounded-sm border border-white/20" style={{ backgroundColor: studioSettings.backgroundColor }}></span>
                            PICKER
                        </div>
                     </div>
                </div>
            </div>

            {/* INTERACTION & VIBE */}
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect 
                    label="Action / Pose" 
                    value={studioSettings.interactionPreset || "Standing Confidently"} 
                    options={OPTIONS.studioInteractions.map(v => ({ value: v, label: v }))} 
                    onChange={(e: any) => update('interactionPreset', e.target.value)} 
                    editable
                />
                <VisualGridSelect 
                    label="Style Vibe" 
                    value={studioSettings.studioVibe || "High Fashion"} 
                    options={OPTIONS.studioVibes.map(v => ({ value: v, label: v }))} 
                    onChange={(e: any) => update('studioVibe', e.target.value)} 
                    editable
                />
            </div>
            
            <DebouncedInput 
                label="Action Details" 
                value={studioSettings.productDescription} 
                onChange={(e) => update('productDescription', e.target.value)} 
                placeholder="e.g. Looking over shoulder, laughing..."
            />

            <LocationSelector previews={locationPreviews} selected={studioSettings.selectedLocationPreview} onSelect={(url) => update('selectedLocationPreview', url)} isGenerating={isPreviewLoading} />
            
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect label={t('LBL_SHOT_TYPE')} value={studioSettings.shotType} options={mapOptions(OPTIONS.shotType, 'OPT_SHOT')} onChange={(e: any) => update('shotType', e.target.value)} />
                <VisualAspectSelect label={t('LBL_RATIO')} value={studioSettings.aspectRatio} onChange={(v) => update('aspectRatio', v)} />
            </div>

            <div className="flex items-center justify-between bg-[#0B1221] p-2 rounded-sm border border-cyan-900/30">
                <span className="text-[10px] font-mono font-bold text-cyan-500/50 uppercase tracking-widest pl-2">BATCH_SIZE</span>
                <div className="flex bg-black/40 rounded-sm p-1">
                    {[1, 3, 5].map(num => (
                        <button
                            key={num}
                            onClick={() => update('batchSize', num)}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold transition-all flex items-center gap-2 ${studioSettings.batchSize === num ? 'bg-cyan-600 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
                        >
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