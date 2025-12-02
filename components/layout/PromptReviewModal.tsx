

import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Code } from 'lucide-react';
import { useGenerationStore } from '../../stores/generationStore';

export const PromptReviewModal: React.FC = () => {
    const { pendingPrompt, confirmGeneration, cancelGeneration } = useGenerationStore();
    const [editedPrompt, setEditedPrompt] = useState("");

    useEffect(() => {
        if (pendingPrompt) setEditedPrompt(pendingPrompt.prompt);
    }, [pendingPrompt]);

    if (!pendingPrompt) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-3xl bg-[#0B1121] border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-pink-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                            <Eye size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Glass Box Review</h2>
                            <p className="text-xs text-white/50">Intercepted prompt before execution. You have full control.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white/40 uppercase">Model</p>
                            <p className="text-sm font-mono text-emerald-400">{pendingPrompt.modelName}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-white/40 uppercase">Tier</p>
                             <p className="text-sm font-mono text-white">{pendingPrompt.tier}</p>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <Code size={12}/> Raw Prompt Payload
                        </label>
                        <span className="text-[10px] text-white/30">{editedPrompt.length} chars</span>
                    </div>
                    <textarea 
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-pink-500/50 resize-none custom-scrollbar leading-relaxed"
                        autoFocus
                    />
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3">
                    <button 
                        onClick={cancelGeneration}
                        className="px-6 py-3 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                        <X size={16}/> Cancel
                    </button>
                    <button 
                        onClick={() => confirmGeneration(editedPrompt)}
                        className="px-8 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold tracking-widest flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all transform hover:scale-105"
                    >
                        <Check size={16}/> CONFIRM & GENERATE
                    </button>
                </div>
            </div>
        </div>
    );
};