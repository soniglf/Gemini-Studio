import React, { memo, useState } from 'react';
import { Button } from '../../components/UI';
import { Dna, Copy, Trash2, ScanFace, Activity, Layers, Undo2, Redo2, Fingerprint } from 'lucide-react';
import { useModelStore } from '../../stores/modelStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';
import { GenerationTier } from '../../types';
import { MuseEngine } from '../creator/MuseEngine';
import { GenotypeDeck } from '../creator/GenotypeDeck';
import { GeneticsPanel } from '../creator/GeneticsPanel';
import { AnatomyPanel } from '../creator/AnatomyPanel';
import { StylingPanel } from '../creator/StylingPanel';

export const CreatorWorkspace = memo(() => {
    // [Project Synapse] This component is now a pure layout container.
    // All state is managed by the children, which connect directly to the store.
    const { model, savedModels, setModel, createProfile, deleteProfile, forkProfile, undo, redo } = useModelStore();
    
    const canUndo = useModelStore(state => {
        if (!state.model) return false;
        const pointer = state.historyPointers[state.model.id];
        return pointer !== undefined && pointer > 0;
    });
    const canRedo = useModelStore(state => {
        if (!state.model) return false;
        const pointer = state.historyPointers[state.model.id];
        const stack = state.historyStacks[state.model.id] || [];
        return pointer !== undefined && pointer < stack.length - 1;
    });

    const { generate, isGenerating } = useGenerationStore();
    const [activeTab, setActiveTab] = useState<'GENETICS' | 'ANATOMY' | 'STYLING'>('GENETICS');

    if (!model) return null;

    const handleGenerateTurnaround = () => {
        useUIStore.getState().setMode('CREATOR'); 
        generate(GenerationTier.RENDER);
    };

    return (
        <div className="space-y-6 pb-40 animate-in fade-in relative min-h-screen">
            
            <div className="bg-slate-950/80 border-b border-white/5 p-4 sticky top-0 z-30 backdrop-blur-xl shadow-lg">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Fingerprint className="text-pink-500" size={18} />
                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.2em]">Subject ID</span>
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
                    
                    <div className="flex gap-2">
                        <select 
                            value={model.id} 
                            onChange={(e) => { const f = savedModels.find((m) => m.id === e.target.value); if(f) setModel(f, true); }} 
                            className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-pink-500/50 hover:bg-slate-700/50"
                        >
                            {savedModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.name} {m.id === model.id ? '●' : ''}</option>
                            ))}
                        </select>
                        <Button onClick={createProfile} className="px-4 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30">+</Button>
                    </div>
                </div>
            </div>

            <MuseEngine />
            <GenotypeDeck />

            <div className="sticky top-[132px] z-20 bg-slate-950/90 backdrop-blur-xl border-y border-white/10 mx-0 px-4 py-1 shadow-md">
                <div className="flex justify-between">
                    {[
                        { id: 'GENETICS', label: 'Reference', icon: ScanFace },
                        { id: 'ANATOMY', label: 'Biometrics', icon: Activity },
                        { id: 'STYLING', label: 'Styling', icon: Layers }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 relative rounded-lg ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-white/30 hover:text-white'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-pink-400' : ''}/>
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

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-950/90 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-2 z-50 flex items-center shadow-2xl">
                <Button 
                    onClick={handleGenerateTurnaround} 
                    isLoading={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
                >
                    {isGenerating ? "Processing..." : "Generate Turnaround Sheet"} <Dna size={16} />
                </Button>
            </div>
        </div>
    );
});
