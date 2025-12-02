
import React from 'react';
import { Sparkles, UserCheck, RotateCcw, Terminal, Edit, Share2, Download } from 'lucide-react';

interface PreviewControlsProps {
    onRefine: () => void;
    onSetReference: () => void;
    onRestore: () => void;
    onTogglePrompt: () => void;
    onEdit: () => void;
    onShare: () => void;
    onDownload: () => void;
    showPrompt: boolean;
    hasSettings: boolean;
    isVideo: boolean;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({ 
    onRefine, onSetReference, onRestore, onTogglePrompt, onEdit, onShare, onDownload, 
    showPrompt, hasSettings, isVideo 
}) => {
    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-40">
            {!isVideo && (
                <>
                    <button onClick={onRefine} className="p-2 bg-black/60 backdrop-blur-md text-pink-400 hover:text-white rounded-full hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20" title="Refine (Upscale & Detail)">
                        <Sparkles size={18}/>
                    </button>
                    <button onClick={onSetReference} className="p-2 bg-black/60 backdrop-blur-md text-blue-400 hover:text-white rounded-full hover:bg-blue-600 transition-colors" title="Set as Model Reference">
                        <UserCheck size={18}/>
                    </button>
                </>
            )}
            {hasSettings && (
                <button onClick={onRestore} className="p-2 bg-black/60 backdrop-blur-md text-emerald-400 hover:text-white rounded-full hover:bg-emerald-600 transition-colors" title="Restore Settings">
                    <RotateCcw size={18}/>
                </button>
            )}
            <button onClick={onTogglePrompt} className={`p-2 backdrop-blur-md rounded-full transition-colors ${showPrompt ? 'bg-pink-600 text-white' : 'bg-black/60 text-white/70 hover:text-white'}`} title="Inspect Code">
                <Terminal size={18}/>
            </button>
            {!isVideo && (
                <button onClick={onEdit} className="p-2 bg-black/60 backdrop-blur-md text-white/70 hover:text-white rounded-full hover:bg-purple-600 transition-colors" title="Magic Editor">
                    <Edit size={18}/>
                </button>
            )}
            <button onClick={onShare} className="p-2 bg-black/60 backdrop-blur-md text-white/70 hover:text-white rounded-full hover:bg-blue-600 transition-colors" title="Share">
                <Share2 size={18}/>
            </button>
            <button onClick={onDownload} className="p-2 bg-black/60 backdrop-blur-md text-white/70 hover:text-white rounded-full hover:bg-emerald-600 transition-colors" title="Download with DNA">
                <Download size={18}/>
            </button>
        </div>
    );
};
