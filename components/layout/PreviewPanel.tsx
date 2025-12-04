import React, { memo, useState, useEffect, useCallback } from 'react';
import { GeneratedAsset, GenerationResult, GenerationTier } from '../../types';
import { Loader } from '../Loader';
import { Code, Check, Copy, Tag, Plus, Send, Lock, Hash, Image as ImageIcon, Maximize2, Minimize2, PanelRightClose, Activity, Layout, PanelLeftOpen, ChevronLeft, ChevronRight, MonitorPlay, MousePointer2, BoxSelect, Zap } from 'lucide-react';
import { ZoomableImage } from '../UI';
import { useTranslation } from '../../contexts/LanguageContext';
import { AssetFilmstrip } from '../../features/shared/AssetFilmstrip';
import { MagicEditor } from '../../features/editor/MagicEditor';
import { PreviewControls } from '../preview/PreviewControls';
import { ImageComparator } from '../preview/ImageComparator';
import { usePreviewController } from '../../hooks/usePreviewController';
import { useGalleryStore } from '../../stores/galleryStore';
import { useModelStore } from '../../stores/modelStore';
import { useUIStore } from '../../stores/uiStore';
import { useGenerationStore } from '../../stores/generationStore';
import { NeuralCanvas } from '../../features/canvas/NeuralCanvas';
import { GeminiStudioLogo } from '../icons/GeminiLogo';

interface PreviewPanelProps {
    onAssetSelect?: (asset: GeneratedAsset) => void;
}

export const FloatingPreview: React.FC = memo(() => {
    const { lastGenerated, isGenerating } = useGenerationStore();
    const { assets } = useGalleryStore();
    const { togglePreviewCollapse } = useUIStore();
    
    // Get active asset
    const activeData = lastGenerated || (assets && assets[0] ? assets[0] : null);
    
    return (
        <div 
            onClick={togglePreviewCollapse}
            className="absolute bottom-24 right-6 w-48 aspect-video bg-[#0B1121] border border-white/20 rounded-xl shadow-2xl z-50 cursor-pointer group overflow-hidden animate-in slide-in-from-right-4 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] flex items-center justify-center"
            title="Click to Expand Preview"
        >
            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white/50 group-hover:text-white backdrop-blur z-20">
                <Maximize2 size={12} />
            </div>
            
            {activeData ? (
                activeData.type === 'VIDEO' ? (
                    <video src={activeData.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" autoPlay muted loop />
                ) : (
                    <img src={activeData.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                )
            ) : (
                // EMPTY STATE DOCK - VISIBLE & INTERACTIVE
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-md group-hover:bg-slate-900 transition-colors">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        {isGenerating ? (
                            <Activity size={20} className="text-pink-500 animate-pulse"/>
                        ) : (
                            <PanelLeftOpen size={20} className="text-white/70 group-hover:text-white"/>
                        )}
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{isGenerating ? "Processing" : "Open Dock"}</span>
                        <span className="text-[8px] text-white/30">{isGenerating ? "Gemini Engine Active" : "Preview Standby"}</span>
                    </div>
                </div>
            )}
            
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none group-hover:ring-white/20 transition-all"></div>
        </div>
    );
});

export const PreviewPanel: React.FC<PreviewPanelProps> = memo(({ onAssetSelect }) => {
    const { t } = useTranslation();
    const { addAsset } = useGalleryStore(); 
    const { model } = useModelStore();
    const { togglePreviewCollapse, isPreviewFullScreen, togglePreviewFullScreen, addToast, tier, setTier } = useUIStore();
    
    const [isTagging, setIsTagging] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [voiceInput, setVoiceInput] = useState("");
    const [isImageZoomed, setIsImageZoomed] = useState(false);
    
    // Mode Switcher: SIMPLE (Linear) vs CANVAS (Spatial)
    const [viewMode, setViewMode] = useState<'SIMPLE' | 'CANVAS'>('SIMPLE');

    const {
        activeData, assets, isLoading, isVideo, isRefining,
        showPrompt, setShowPrompt, copied, copyPrompt,
        isEditing, setIsEditing, handleApplyEdit,
        compareMode, setCompareMode, previousVersion,
        handleShare, handleDownload, handleRestore, handleRefine, handleSetReference,
        handleVoiceRefinement, handleSeedReuse
    } = usePreviewController(onAssetSelect);

    // --- SMART NAVIGATION ---
    const handleNav = useCallback((dir: 'prev' | 'next') => {
        if (!activeData || assets.length === 0 || !onAssetSelect) return;
        const idx = assets.findIndex(a => a.id === (activeData as GeneratedAsset).id);
        if (idx === -1) return;

        if (dir === 'next' && idx < assets.length - 1) {
            onAssetSelect(assets[idx + 1]);
        } else if (dir === 'prev' && idx > 0) {
            onAssetSelect(assets[idx - 1]);
        }
    }, [activeData, assets, onAssetSelect]);

    useEffect(() => {
        setIsImageZoomed(false);
    }, [activeData]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            
            if (e.key === 'ArrowLeft') handleNav('prev');
            if (e.key === 'ArrowRight') handleNav('next');
            if (e.key === 'Escape') togglePreviewCollapse();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNav, togglePreviewCollapse]);

    const handleAddTag = async () => {
        if (activeData && 'id' in activeData && newTag.trim()) {
            const assetData = activeData as GeneratedAsset;
            const updatedTags = [...(assetData.tags || []), newTag.trim()];
            const updatedAsset = { ...assetData, tags: updatedTags };
            await addAsset(updatedAsset); 
            if(onAssetSelect) onAssetSelect(updatedAsset);
            setNewTag("");
            setIsTagging(false);
        }
    };

    const submitVoice = () => {
        if(voiceInput.trim()) {
            handleVoiceRefinement(voiceInput);
            setVoiceInput("");
        }
    };

    const handleCanvasViewItem = (id: string) => {
        const asset = assets.find(a => a.id === id);
        if (asset && onAssetSelect) {
            onAssetSelect(asset);
            setViewMode('SIMPLE');
        }
    };

    // Safe accessors for union type
    const activeId = (activeData as GeneratedAsset)?.id;
    const activePrompt = (activeData as GeneratedAsset)?.prompt || (activeData as unknown as GenerationResult)?.finalPrompt;
    const activeSettings = (activeData as GeneratedAsset)?.settings;

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950/50 backdrop-blur-sm relative overflow-hidden group/panel border-l border-white/5">
            <div className="absolute inset-0 bg-slate-900/20 pointer-events-none"></div>
            
            {/* BRANDING IN FULL SCREEN */}
            {isPreviewFullScreen && (
                <div className="absolute top-4 left-6 z-50">
                    <GeminiStudioLogo />
                </div>
            )}

            {/* Header Controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                {/* FULL SCREEN CONTROLS */}
                {isPreviewFullScreen && (
                    <div className="flex bg-black/60 backdrop-blur rounded-lg p-1 border border-white/10 mr-4">
                        <button 
                            onClick={() => setTier(GenerationTier.SKETCH)} 
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-2 ${tier === GenerationTier.SKETCH ? 'bg-white/20 text-white' : 'text-white/40'}`}
                            title="Fast & Free Generations"
                        >
                            <Zap size={12} className={tier === GenerationTier.SKETCH ? "text-yellow-400" : ""} /> Sketch
                        </button>
                        <button 
                            onClick={() => setTier(GenerationTier.RENDER)} 
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-2 ${tier === GenerationTier.RENDER ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-white/40'}`}
                            title="High Quality Productions"
                        >
                            <ImageIcon size={12} /> Render
                        </button>
                    </div>
                )}

                <div className="bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 flex">
                    <button 
                        onClick={() => setViewMode('SIMPLE')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'SIMPLE' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                        title="Simple View"
                    >
                        <ImageIcon size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('CANVAS')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'CANVAS' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-white/40 hover:text-white'}`}
                        title="Neural Canvas (Spatial Board)"
                    >
                        <MousePointer2 size={16} />
                    </button>
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                <div className="flex gap-2">
                    <button 
                        onClick={togglePreviewFullScreen}
                        className="p-2 text-white/40 hover:text-white bg-black/20 hover:bg-black/60 backdrop-blur rounded-lg transition-all border border-transparent hover:border-white/10"
                        title={isPreviewFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
                    >
                        {isPreviewFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <button 
                        onClick={togglePreviewCollapse}
                        className="p-2 text-white/20 hover:text-white bg-black/20 hover:bg-black/60 backdrop-blur rounded-lg transition-all"
                        title="Close Panel (ESC)"
                    >
                        <PanelRightClose size={16} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative flex flex-col items-center justify-center z-20 overflow-hidden">
                
                {/* NEURAL CANVAS MODE */}
                {viewMode === 'CANVAS' ? (
                    <NeuralCanvas onViewItem={handleCanvasViewItem} />
                ) : (
                    // SIMPLE MODE (Legacy)
                    <div className="flex-1 w-full h-full flex flex-col p-4 lg:p-8">
                        {isLoading ? (
                            <div className="text-center p-8 m-auto"><Loader /><p className="mt-4 text-xs font-mono text-pink-500/70 animate-pulse">{t('PRE_GENERATING')}</p></div>
                        ) : activeData ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center">
                                {/* Keyboard Hints (Visual only) */}
                                {!isImageZoomed && (
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none opacity-0 group-hover/panel:opacity-100 transition-opacity z-30">
                                        <div className="bg-black/50 p-2 rounded-full backdrop-blur text-white/30"><ChevronLeft size={24}/></div>
                                        <div className="bg-black/50 p-2 rounded-full backdrop-blur text-white/30"><ChevronRight size={24}/></div>
                                    </div>
                                )}

                                <div className="relative max-h-[calc(100vh-12rem)] max-w-full shadow-2xl rounded-lg overflow-hidden border border-white/10 group bg-[#0f172a] flex flex-col">
                                    
                                    {isEditing && !isVideo ? (
                                        <MagicEditor 
                                            asset={activeData}
                                            onApply={handleApplyEdit}
                                            onCancel={() => setIsEditing(false)}
                                        />
                                    ) : (
                                        <>
                                            {isVideo ? (
                                                <video src={activeData.url} autoPlay loop controls className="max-h-full max-w-full object-contain" />
                                            ) : compareMode && previousVersion ? (
                                                <ImageComparator originalSrc={previousVersion.url} modifiedSrc={activeData.url} />
                                            ) : (
                                                <ZoomableImage 
                                                    src={activeData.url} 
                                                    className="max-h-full max-w-full object-contain" 
                                                    onZoomChange={setIsImageZoomed}
                                                />
                                            )}
                                            
                                            {/* METADATA OVERLAY (Tags & Seed) */}
                                            {!isImageZoomed && (
                                                <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[70%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
                                                    {activeData.tags?.map((tag: string, i: number) => (
                                                        <div key={i} className="px-2 py-1 rounded bg-black/50 backdrop-blur border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1 shadow-lg">
                                                            <Tag size={10} className="text-pink-400" /> {tag}
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Seed Display */}
                                                    {activeSettings && 'seed' in activeSettings && (activeSettings as any).seed !== undefined && (
                                                        <button 
                                                            onClick={handleSeedReuse}
                                                            className="px-2 py-1 rounded bg-black/50 backdrop-blur border border-white/10 text-[9px] font-bold font-mono text-emerald-400 hover:text-white flex items-center gap-1 shadow-lg transition-colors"
                                                            title="Reuse Seed"
                                                        >
                                                            <Hash size={10}/> {(activeSettings as any).seed} <Lock size={8}/>
                                                        </button>
                                                    )}

                                                    {isTagging ? (
                                                        <div className="flex items-center gap-1 bg-black/60 rounded px-1 border border-pink-500/50">
                                                            <input 
                                                                autoFocus
                                                                value={newTag}
                                                                onChange={e => setNewTag(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                                                onBlur={() => setTimeout(() => setIsTagging(false), 200)}
                                                                className="w-16 bg-transparent text-[9px] text-white focus:outline-none"
                                                                placeholder="New Tag..."
                                                            />
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setIsTagging(true)}
                                                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-[9px] font-bold text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* DIRECTOR'S VOICE INPUT */}
                                            {!isVideo && !isEditing && !isImageZoomed && (
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 max-w-[90%] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-40">
                                                    <div className="relative group/input">
                                                        <input 
                                                            value={voiceInput}
                                                            onChange={(e) => setVoiceInput(e.target.value)}
                                                            placeholder={isRefining ? "Director thinking..." : "Director's Voice (e.g. 'Make it sunset')"}
                                                            disabled={isRefining}
                                                            onKeyDown={(e) => e.key === 'Enter' && submitVoice()}
                                                            className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-full pl-4 pr-12 py-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50 shadow-2xl transition-all"
                                                        />
                                                        <button 
                                                            onClick={submitVoice}
                                                            disabled={!voiceInput || isRefining}
                                                            className="absolute right-2 top-1/2 -translate-x-1/2 p-1.5 rounded-full bg-white/10 hover:bg-pink-600 text-white transition-colors disabled:opacity-50"
                                                        >
                                                            {isRefining ? <Loader size={12} /> : <Send size={12} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {!isImageZoomed && (
                                                <PreviewControls 
                                                    onRefine={handleRefine}
                                                    onSetReference={handleSetReference}
                                                    onRestore={handleRestore}
                                                    onTogglePrompt={() => setShowPrompt(!showPrompt)}
                                                    onEdit={() => setIsEditing(true)}
                                                    onShare={handleShare}
                                                    onDownload={handleDownload}
                                                    showPrompt={showPrompt}
                                                    hasSettings={!!activeSettings}
                                                    isVideo={!!isVideo}
                                                />
                                            )}

                                            {/* Comparison Toggle */}
                                            {previousVersion && !isVideo && !isEditing && !isImageZoomed && (
                                                <div className="absolute bottom-20 right-4 z-40">
                                                    <button 
                                                        onClick={() => setCompareMode(!compareMode)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${compareMode ? 'bg-pink-600 border-pink-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}
                                                    >
                                                        {compareMode ? 'Exit Compare' : 'Compare Original'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {showPrompt && !isEditing && (
                                    <div className="absolute bottom-8 left-8 right-8 bg-[#0d1117]/95 backdrop-blur border border-white/10 rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[200px] overflow-y-auto custom-scrollbar z-50">
                                        <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2">
                                                <Code size={14} className="text-emerald-400"/>
                                                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{t('PRE_PROMPT')}</span>
                                            </div>
                                            <button onClick={copyPrompt} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                                                {copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? t('PRE_COPIED') : t('PRE_COPY')}
                                            </button>
                                        </div>
                                        <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed select-text">
                                            {activePrompt}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center opacity-30 z-10 flex flex-col items-center mt-32">
                                <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5 animate-pulse">
                                    <MonitorPlay size={40} className="text-white/50" />
                                </div>
                                <h2 className="text-xl font-bold tracking-widest text-white/50">{t('PRE_READY')}</h2>
                                <p className="text-[10px] text-white/20 mt-2 uppercase tracking-wider">Awaiting Generation...</p>
                            </div>
                        )}
                        
                        {/* Filmstrip only in Simple Mode */}
                        {assets.length > 0 && <AssetFilmstrip assets={assets.slice(0, 15)} selectedId={activeId} onSelect={onAssetSelect!} />}
                    </div>
                )}
            </div>
        </div>
    );
});