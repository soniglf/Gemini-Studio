import React, { memo, useState, useEffect, useRef } from 'react';
import { useModelStore } from '../../stores/modelStore';
import { useUIStore } from '../../stores/uiStore';
import { useGenerationStore } from '../../stores/generationStore';
import { AppMode, GenerationTier } from '../../types';
import { Button } from '../../components/UI';
import { GeneticsPanel } from '../creator/GeneticsPanel';
import { AnatomyPanel } from '../creator/AnatomyPanel';
import { StylingPanel } from '../creator/StylingPanel';
import { MuseEngine } from '../creator/MuseEngine';
import { GenotypeDeck } from '../creator/GenotypeDeck';
import { WorkspaceDock } from './Shared';
import { 
    ScanFace, Activity, Layers, Undo2, Redo2, Copy, Trash2, 
    Fingerprint, Theater, Mars, Venus, Grid, Zap, DollarSign, Image as ImageIcon, ChevronDown, Check, Plus, Sparkles
} from 'lucide-react';
import { MODE_COLORS } from '../../data/theme';

// Reusable Collapsible Section
const CollapsibleSection: React.FC<{ title: string, children: React.ReactNode, icon: React.ElementType, defaultOpen?: boolean, accentColor: string }> = ({ title, children, icon: Icon, defaultOpen = false, accentColor }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mx-4 mb-4 border border-white/5 rounded-xl bg-[#0B1121] overflow-hidden transition-all shadow-sm hover:shadow-lg">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon size={14} className={isOpen ? accentColor : "text-white/30"} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isOpen ? 'text-white' : 'text-white/50'}`}>{title}</span>
                </div>
                <ChevronDown size={14} className={`text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-1 animate-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    );
};

export const CreatorWorkspace = memo(() => {
    const { model, savedModels, setModel, createProfile, deleteProfile, forkProfile, undo, redo } = useModelStore();
    const { tier } = useUIStore();
    const { generate, isGenerating } = useGenerationStore();
    const [activeTab, setActiveTab] = useState<'GENETICS' | 'ANATOMY' | 'STYLING'>('GENETICS');
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Safe History Access
    const canUndo = true; 
    const canRedo = true;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleGenderChange = (gender: 'MALE' | 'FEMALE') => {
        if (model.gender === gender) return;
        
        let newEthnicity = model.ethnicity;
        if (gender === 'MALE' && model.ethnicity === 'Latina') newEthnicity = 'Latino';
        if (gender === 'FEMALE' && model.ethnicity === 'Latino') newEthnicity = 'Latina';

        const newModel = {
            ...model,
            gender,
            ethnicity: newEthnicity,
            facialHair: gender === 'FEMALE' ? 'None' : model.facialHair,
            makeupStyle: gender === 'MALE' ? 'No Makeup' : model.makeupStyle
        };
        setModel(newModel);
    };

    if (!model) return null;

    const handleGenerateTurnaround = () => {
        useUIStore.getState().setMode(AppMode.CREATOR); 
        generate(tier);
    };

    const isMale = model.gender === 'MALE';
    const accentColor = isMale ? 'text-blue-400' : 'text-pink-400';
    const tabActiveClass = isMale 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'bg-pink-600 text-white shadow-lg shadow-pink-900/20';

    // Cost Logic for Dock
    const cost = tier === GenerationTier.SKETCH ? 0 : 0.04;
    const tierLabel = tier === GenerationTier.SKETCH ? 'Flash Sketch' : 'High Fidelity';

    return (
        <div className="space-y-6 pb-40 animate-in fade-in relative min-h-screen">
            
            <div className="bg-slate-950/80 border-b border-white/5 p-4 sticky top-0 z-30 backdrop-blur-xl shadow-lg">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Fingerprint className={accentColor} size={18} />
                            <span className={`text-[10px] font-bold ${accentColor} uppercase tracking-[0.2em]`}>Subject ID</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 mr-2 border border-white/10">
                                <button onClick={undo} disabled={!canUndo} className="p-1.5 text-white/50 hover:text-white disabled:opacity-30" title="Undo"><Undo2 size={12}/></button>
                                <button onClick={redo} disabled={!canRedo} className="p-1.5 text-white/50 hover:text-white disabled:opacity-30" title="Redo"><Redo2 size={12}/></button>
                            </div>
                            <button onClick={forkProfile} className="p-1.5 text-white/30 hover:text-white rounded bg-slate-800/50 border border-white/5" title="Duplicate"><Copy size={12}/></button>
                            <button onClick={deleteProfile} className="p-1.5 text-white/30 hover:text-red-400 rounded bg-slate-800/50 border border-white/5" title="Delete"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    
                    {/* CUSTOM PROFILE SWITCHER & NAME EDITOR */}
                    <div className="flex gap-2 relative" ref={dropdownRef}>
                        <div className="flex-1 flex bg-slate-800/50 border border-white/10 rounded-lg focus-within:border-pink-500/50 focus-within:bg-slate-800/80 transition-all overflow-hidden relative">
                            {/* Visual Indicator of Active Profile */}
                            <div className="w-1.5 h-full bg-gradient-to-b from-pink-500 to-purple-600 absolute left-0 top-0 bottom-0"></div>
                            
                            <input 
                                value={model.name}
                                onChange={(e) => setModel({ ...model, name: e.target.value })}
                                className="w-full bg-transparent text-sm font-bold text-white px-4 py-2 pl-4 outline-none placeholder:text-white/20"
                                placeholder="Model Name"
                            />
                            
                            <button 
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="px-3 border-l border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}/>
                            </button>
                        </div>

                        <Button onClick={createProfile} className="px-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30">
                            <Plus size={16}/>
                        </Button>

                        {/* Custom Dropdown */}
                        {isProfileDropdownOpen && (
                            <div className="absolute top-[110%] left-0 w-full bg-[#0B1121] border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 space-y-1">
                                    <div className="text-[9px] font-bold text-white/30 px-2 py-1 uppercase tracking-widest">Switch Profile</div>
                                    {savedModels.map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => { setModel(m, true); setIsProfileDropdownOpen(false); }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${model.id === m.id ? 'bg-pink-600/20 text-white border border-pink-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="text-xs font-bold truncate">{m.name}</span>
                                            {model.id === m.id && <Check size={12} className="text-pink-400"/>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PRIMARY DECISION: GENDER TOGGLE */}
            <div className="mx-4 flex gap-2 p-1 bg-[#0B1121] rounded-xl border border-white/10 shadow-lg">
                <button 
                    onClick={() => handleGenderChange('FEMALE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${!isMale ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                    <Venus size={14} /> Female
                </button>
                <button 
                    onClick={() => handleGenderChange('MALE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isMale ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                    <Mars size={14} /> Male
                </button>
            </div>

            {/* COLLAPSIBLE MODULES */}
            <CollapsibleSection title="Muse Engine (AI Prompting)" icon={Sparkles} accentColor={accentColor}>
                <MuseEngine />
            </CollapsibleSection>

            <CollapsibleSection title="Genotype Library" icon={Layers} accentColor={accentColor}>
                <GenotypeDeck />
            </CollapsibleSection>

            <div className="mx-4 mb-6 mt-6">
                <div className="p-1 bg-[#0B1121] rounded-xl border border-white/10 flex relative shadow-lg">
                    {[
                        { id: 'GENETICS', label: 'Reference', icon: ScanFace },
                        { id: 'ANATOMY', label: 'Biometrics', icon: Activity },
                        { id: 'STYLING', label: 'Styling', icon: Layers }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-all duration-300 ${activeTab === tab.id ? tabActiveClass : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : ''}/>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4">
                {activeTab === 'GENETICS' && <GeneticsPanel />}
                {activeTab === 'ANATOMY' && <AnatomyPanel />}
                {activeTab === 'STYLING' && <StylingPanel />}
            </div>

            {/* UPGRADED DOCK FOR CREATOR MODE */}
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
                        {tier === GenerationTier.RENDER ? <ImageIcon size={12} /> : <Zap size={12} />}
                        <span className="text-[10px] font-bold uppercase">{tierLabel}</span>
                    </div>
                </div>

                <div className="pl-2">
                    <button 
                        onClick={handleGenerateTurnaround} 
                        disabled={isGenerating} 
                        className={`h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${isGenerating ? 'bg-slate-800 text-white/50 cursor-not-allowed' : 'text-white'}`}
                        style={!isGenerating ? { background: `linear-gradient(to right, ${isMale ? '#2563eb' : '#db2777'}, ${isMale ? '#06b6d4' : '#9333ea'})` } : {}}
                    >
                        {isGenerating ? (<>Constructing <Activity size={16} className="animate-spin"/></>) : (<>GENERATE IDENTITY <ScanFace size={16}/></>)}
                    </button>
                </div>
            </div>
        </div>
    );
});