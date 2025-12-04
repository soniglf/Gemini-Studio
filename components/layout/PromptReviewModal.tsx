
import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Check, X, Code, Terminal, Edit } from 'lucide-react';
import { useGenerationStore } from '../../stores/generationStore';

export const PromptReviewModal: React.FC = () => {
    const { pendingPrompt, confirmGeneration, cancelGeneration } = useGenerationStore();
    const [editedPrompt, setEditedPrompt] = useState("");
    const [viewMode, setViewMode] = useState<'VISUAL' | 'RAW'>('VISUAL');

    useEffect(() => {
        if (pendingPrompt) setEditedPrompt(pendingPrompt.prompt);
    }, [pendingPrompt]);

    // Neural Syntax Highlighter
    const highlightedContent = useMemo(() => {
        if (!editedPrompt) return null;
        
        // Split by blocks like [HEADER]
        const parts = editedPrompt.split(/(\[.*?\])/g);
        
        return parts.map((part, i) => {
            if (part.startsWith('[') && part.endsWith(']')) {
                // Determine color based on tag content
                let colorClass = "text-emerald-400 bg-emerald-900/20 border-emerald-500/30"; // Default System
                if (part.includes('IDENTITY') || part.includes('DNA')) colorClass = "text-pink-400 bg-pink-900/20 border-pink-500/30";
                if (part.includes('SCENE') || part.includes('LIGHTING') || part.includes('CONTEXT')) colorClass = "text-blue-400 bg-blue-900/20 border-blue-500/30";
                if (part.includes('NEGATIVE')) colorClass = "text-red-400 bg-red-900/20 border-red-500/30";
                
                return (
                    <div key={i} className={`inline-block my-2 mr-2 px-2 py-1 rounded text-[10px] font-bold border ${colorClass} tracking-widest`}>
                        {part.replace('[', '').replace(']', '')}
                    </div>
                );
            }
            if (!part.trim()) return null;
            return (
                <span key={i} className="text-slate-300 block mb-4 pl-2 border-l-2 border-white/10 text-xs leading-relaxed font-mono">
                    {part.trim()}
                </span>
            );
        });
    }, [editedPrompt]);

    if (!pendingPrompt) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-4xl bg-[#0B1121] border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-pink-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                            <Terminal size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Neural Syntax Review</h2>
                            <p className="text-xs text-white/50">Glass Box Interceptor Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            <button 
                                onClick={() => setViewMode('VISUAL')} 
                                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${viewMode === 'VISUAL' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Visual
                            </button>
                            <button 
                                onClick={() => setViewMode('RAW')} 
                                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${viewMode === 'RAW' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                <Code size={12}/> Raw
                            </button>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white/40 uppercase">Model</p>
                            <p className="text-sm font-mono text-emerald-400">{pendingPrompt.modelName}</p>
                        </div>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="flex-1 overflow-hidden relative">
                    {viewMode === 'VISUAL' ? (
                        <div className="absolute inset-0 bg-black/30 p-6 overflow-y-auto custom-scrollbar">
                            {highlightedContent}
                        </div>
                    ) : (
                        <textarea 
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            className="w-full h-full bg-[#050914] p-6 text-xs font-mono text-emerald-300 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                            autoFocus
                            spellCheck={false}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-between items-center">
                    <p className="text-[10px] text-white/30">
                        {viewMode === 'VISUAL' ? "Preview Mode. Switch to Raw to edit prompt manually." : "You are editing the raw instruction block sent to the neural network."}
                    </p>
                    <div className="flex gap-3">
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
                            <Check size={16}/> CONFIRM & EXECUTE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
