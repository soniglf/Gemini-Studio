
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Zap, Camera, Film, Layers, User, ToggleRight, Image as ImageIcon, Video } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useDirectorStore } from '../../stores/directorStore';
import { useProjectStore } from '../../stores/projectStore';
import { useGalleryStore } from '../../stores/galleryStore';
import { useModalStore } from '../../stores/modalStore';
import { AppMode, GenerationTier, GeneratedAsset } from '../../types';

export const CommandPalette: React.FC = () => {
    const { activeModal, openModal, closeModal, toggleModal } = useModalStore();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const { setMode, togglePro, isPro } = useUIStore();
    const { generate, setLastGenerated } = useGenerationStore();
    const { runAudit } = useDirectorStore();
    const { activeProject } = useProjectStore();
    const { assets } = useGalleryStore();

    const isOpen = activeModal === 'COMMAND_PALETTE';

    // Static Commands
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

    // Dynamic Asset Search
    const matchingAssets = React.useMemo(() => {
        if (!query || query.length < 2) return [];
        const lowerQ = query.toLowerCase();
        return assets
            .filter(a => a.prompt.toLowerCase().includes(lowerQ) || a.tags?.some(t => t.toLowerCase().includes(lowerQ)))
            .slice(0, 5)
            .map(a => ({
                id: `asset-${a.id}`,
                label: a.prompt.substring(0, 60) + (a.prompt.length > 60 ? '...' : ''),
                icon: a.type === 'VIDEO' ? Video : ImageIcon,
                action: () => { setLastGenerated(a); setMode(a.mode || AppMode.GALLERY); },
                category: 'Asset',
                thumbnail: a.url
            }));
    }, [query, assets]);

    const filteredItems = [...commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase())), ...matchingAssets];

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
            setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                filteredItems[selectedIndex].action();
                closeModal();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={closeModal}>
            <div className="w-full max-w-2xl bg-[#0B1121] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
                    <Search className="w-5 h-5 text-white/30 mr-3" />
                    <input 
                        ref={inputRef} 
                        className="flex-1 bg-transparent text-lg text-white placeholder:text-white/20 focus:outline-none" 
                        placeholder="Type > to run commands or search assets..." 
                        value={query} 
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }} 
                        onKeyDown={handleKeyDown} 
                    />
                    <div className="flex items-center gap-2"><span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/50 border border-white/5">ESC</span></div>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                    {filteredItems.length === 0 ? (
                         <div className="p-8 text-center text-white/30 text-sm flex flex-col items-center gap-2">
                             <Search size={24} className="opacity-50"/>
                             No results found.
                         </div>
                    ) : (
                        filteredItems.map((item, idx) => (
                            <div 
                                key={item.id} 
                                className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all group ${idx === selectedIndex ? 'bg-pink-600/10 border-pink-500/20 shadow-lg shadow-pink-900/20' : 'hover:bg-white/5 border-transparent'}`} 
                                style={{ border: idx === selectedIndex ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid transparent' }}
                                onClick={() => { item.action(); closeModal(); }} 
                                onMouseEnter={() => setSelectedIndex(idx)}
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    {/* Thumbnail for Assets, Icon for Commands */}
                                    {('thumbnail' in item && item.thumbnail) ? (
                                        <div className="w-10 h-10 rounded bg-black/50 border border-white/10 overflow-hidden shrink-0">
                                            <img src={(item as any).thumbnail} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`p-2 rounded-lg shrink-0 ${idx === selectedIndex ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/50'}`}>
                                            <item.icon size={18} />
                                        </div>
                                    )}
                                    
                                    <div className="min-w-0">
                                        <div className={`text-sm font-medium truncate ${idx === selectedIndex ? 'text-white' : 'text-white/70'}`}>{item.label}</div>
                                        <div className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-2">
                                            {item.category}
                                            {('thumbnail' in item && item.thumbnail) && <span className="text-[9px] bg-white/10 px-1.5 rounded text-white/50">View</span>}
                                        </div>
                                    </div>
                                </div>
                                {idx === selectedIndex && <ArrowRight size={16} className="text-pink-400 mr-2" />}
                            </div>
                        ))
                    )}
                </div>
                {activeProject && <div className="px-4 py-2 bg-slate-950/50 text-[10px] text-white/30 border-t border-white/5 flex justify-between"><span>Active: {activeProject.name}</span><span>Gemini Omni-Search</span></div>}
            </div>
        </div>
    );
};
