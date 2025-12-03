
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Zap, Camera, Film, Layers, User, ToggleRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useDirectorStore } from '../../stores/directorStore';
import { useProjectStore } from '../../stores/projectStore';
import { useModalStore } from '../../stores/modalStore';
import { AppMode, GenerationTier } from '../../types';

export const CommandPalette: React.FC = () => {
    const { activeModal, openModal, closeModal, toggleModal } = useModalStore();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const { setMode, togglePro, isPro } = useUIStore();
    const { generate } = useGenerationStore();
    const { runAudit } = useDirectorStore();
    const { activeProject } = useProjectStore();

    const isOpen = activeModal === 'COMMAND_PALETTE';

    const commands = [
        { id: 'nav-director', label: 'Go to Director', icon: Zap, action: () => setMode(AppMode.DIRECTOR), category: 'Navigation' },
        { id: 'nav-creator', label: 'Go to Creator (Identity)', icon: User, action: () => setMode(AppMode.CREATOR), category: 'Navigation' },
        { id: 'nav-studio', label: 'Go to Studio', icon: Camera, action: () => setMode(AppMode.STUDIO), category: 'Navigation' },
        { id: 'nav-motion', label: 'Go to Motion', icon: Film, action: () => setMode(AppMode.MOTION), category: 'Navigation' },
        { id: 'nav-gallery', label: 'Go to Gallery (Vault)', icon: Layers, action: () => setMode(AppMode.GALLERY), category: 'Navigation' },
        { id: 'action-gen-render', label: 'Generate Render (Paid)', icon: Zap, action: () => generate(GenerationTier.RENDER), category: 'Action' },
        { id: 'action-gen-sketch', label: 'Generate Sketch (Free)', icon: Zap, action: () => generate(GenerationTier.SKETCH), category: 'Action' },
        { id: 'action-audit', label: 'Run Campaign Audit', icon: Search, action: () => { setMode(AppMode.DIRECTOR); setTimeout(runAudit, 500); }, category: 'Action' },
        { id: 'toggle-pro', label: isPro ? 'Disable Pro Mode' : 'Enable Pro Mode', icon: ToggleRight, action: () => togglePro(), category: 'Setting' }
    ];

    const filteredCommands = commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
                e.preventDefault();
                toggleModal('COMMAND_PALETTE');
            }
            if (e.key === 'Escape' && isOpen) closeModal();
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        } else {
            setQuery("");
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                closeModal();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={closeModal}>
            <div className="w-full max-w-2xl bg-[#0B1121] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-white/30 mr-3" />
                    <input ref={inputRef} className="flex-1 bg-transparent text-lg text-white placeholder:text-white/20 focus:outline-none" placeholder="Type a command or search..." value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }} onKeyDown={handleKeyDown} />
                    <div className="flex items-center gap-2"><span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/50">ESC</span></div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                    {filteredCommands.length === 0 ? (
                         <div className="p-8 text-center text-white/30 text-sm">No commands found.</div>
                    ) : (
                        filteredCommands.map((cmd, idx) => (
                            <div key={cmd.id} className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-pink-600/20 border border-pink-500/30' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => { cmd.action(); closeModal(); }} onMouseEnter={() => setSelectedIndex(idx)}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded ${idx === selectedIndex ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/50'}`}><cmd.icon size={16} /></div>
                                    <div>
                                        <div className={`text-sm font-medium ${idx === selectedIndex ? 'text-white' : 'text-white/70'}`}>{cmd.label}</div>
                                        <div className="text-[10px] text-white/30 uppercase tracking-wider">{cmd.category}</div>
                                    </div>
                                </div>
                                {idx === selectedIndex && <ArrowRight size={16} className="text-pink-400" />}
                            </div>
                        ))
                    )}
                </div>
                {activeProject && <div className="px-4 py-2 bg-white/5 text-[10px] text-white/30 border-t border-white/5 flex justify-between"><span>Active: {activeProject.name}</span><span>Gemini Studio v1.0</span></div>}
            </div>
        </div>
    );
};
