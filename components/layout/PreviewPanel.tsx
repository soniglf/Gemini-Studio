
import React, { memo, useState } from 'react';
import { GeneratedAsset } from '../../types';
import { Loader } from '../Loader';
import { Code, Check, Copy, Tag, Plus, Send, Lock, Hash, Scan, Image as ImageIcon } from 'lucide-react';
import { ZoomableImage } from '../UI';
import { useTranslation } from '../../contexts/LanguageContext';
import { AssetFilmstrip } from '../../features/shared/AssetFilmstrip';
import { MagicEditor } from '../../features/editor/MagicEditor';
import { PreviewControls } from '../preview/PreviewControls';
import { ImageComparator } from '../preview/ImageComparator';
import { usePreviewController } from '../../hooks/usePreviewController';
import { useGalleryStore } from '../../stores/galleryStore';
import { useUIStore } from '../../stores/uiStore';
import { useModelStore } from '../../stores/modelStore';
import { BioMeshVisualizer } from '../visualizers/BioMeshVisualizer';
import { DEFAULT_MORPHOLOGY } from '../../data/constants';

interface PreviewPanelProps {
    onAssetSelect?: (asset: GeneratedAsset) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = memo(({ onAssetSelect }) => {
    const { t } = useTranslation();
    const { addAsset } = useGalleryStore(); 
    const { previewTab, setPreviewTab, bioFocus } = useUIStore();
    const { model } = useModelStore();
    
    const [isTagging, setIsTagging] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [voiceInput, setVoiceInput] = useState("");

    const {
        activeData, assets, isLoading, isVideo, isRefining,
        showPrompt, setShowPrompt, copied, copyPrompt,
        isEditing, setIsEditing, handleApplyEdit,
        compareMode, setCompareMode, previousVersion,
        handleShare, handleDownload, handleRestore, handleRefine, handleSetReference,
        handleVoiceRefinement, handleSeedReuse
    } = usePreviewController(onAssetSelect);

    const handleAddTag = async () => {
        if (activeData && newTag.trim()) {
            const updatedTags = [...(activeData.tags || []), newTag.trim()];
            const updatedAsset = { ...activeData, tags: updatedTags };
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

    // Determine what to show
    const showBio = previewTab === 'BIO';

    return (
        <div className="flex-1 flex flex-col h-full bg-black/50 relative overflow-hidden">
            {/* View Mode Toggle */}
            <div className="absolute top-4 right-4 z-50 flex bg-black/60 backdrop-blur rounded-lg p-1 border border-white/10 shadow-xl">
                <button 
                    onClick={() => setPreviewTab('ASSET')}
                    className={`p-2 rounded flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${!showBio ? 'bg-pink-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    <ImageIcon size={14}/> Generations
                </button>
                <button 
                    onClick={() => setPreviewTab('BIO')}
                    className={`p-2 rounded flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${showBio ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    <Scan size={14}/> Bio-Scan
                </button>
            </div>

            <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
            
            <div className="flex-1 relative flex flex-col items-center justify-center p-4 lg:p-8 z-20 overflow-hidden">
                {isLoading && !showBio ? (
                    <div className="text-center p-8"><Loader /><p className="mt-4 text-xs font-mono text-pink-500/70 animate-pulse">{t('PRE_GENERATING')}</p></div>
                ) : showBio ? (
                    // BIO MESH MODE
                    <div className="w-full h-full max-w-2xl aspect-[3/4] bg-[#0B1121] rounded-2xl overflow-hidden border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative group">
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-900/40 backdrop-blur rounded border border-emerald-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider">LIVE MESH // {bioFocus}</span>
                            </div>
                        </div>
                        
                        <BioMeshVisualizer 
                            morphology={model?.morphology || DEFAULT_MORPHOLOGY} 
                            gender={model?.gender || 'FEMALE'} 
                            focus={bioFocus}
                        />
                        
                        {/* Data Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between text-xs font-mono text-emerald-400/80">
                            <div>
                                <p>H: {model?.morphology?.height || 50}</p>
                                <p>W: {model?.morphology?.weight || 50}</p>
                            </div>
                            <div className="text-right">
                                <p>SUB_ID: {model?.id?.slice(-6).toUpperCase()}</p>
                                <p>CLASS: {model?.gender}</p>
                            </div>
                        </div>
                    </div>
                ) : activeData ? (
                    // ASSET MODE
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
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
                                        <ZoomableImage src={activeData.url} className="max-h-full max-w-full object-contain" />
                                    )}
                                    
                                    {/* METADATA OVERLAY (Tags & Seed) */}
                                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[70%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
                                        {activeData.tags?.map((tag: string, i: number) => (
                                            <div key={i} className="px-2 py-1 rounded bg-black/50 backdrop-blur border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1 shadow-lg">
                                                <Tag size={10} className="text-pink-400" /> {tag}
                                            </div>
                                        ))}
                                        
                                        {/* Seed Display */}
                                        {activeData.settings?.seed !== undefined && (
                                            <button 
                                                onClick={handleSeedReuse}
                                                className="px-2 py-1 rounded bg-black/50 backdrop-blur border border-white/10 text-[9px] font-bold font-mono text-emerald-400 hover:text-white flex items-center gap-1 shadow-lg transition-colors"
                                                title="Reuse Seed"
                                            >
                                                <Hash size={10}/> {activeData.settings.seed} <Lock size={8}/>
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

                                    {/* DIRECTOR'S VOICE INPUT */}
                                    {!isVideo && !isEditing && (
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
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-pink-600 text-white transition-colors disabled:opacity-50"
                                                >
                                                    {isRefining ? <Loader size={12} /> : <Send size={12} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <PreviewControls 
                                        onRefine={handleRefine}
                                        onSetReference={handleSetReference}
                                        onRestore={handleRestore}
                                        onTogglePrompt={() => setShowPrompt(!showPrompt)}
                                        onEdit={() => setIsEditing(true)}
                                        onShare={handleShare}
                                        onDownload={handleDownload}
                                        showPrompt={showPrompt}
                                        hasSettings={!!activeData.settings}
                                        isVideo={!!isVideo}
                                    />

                                    {/* Comparison Toggle */}
                                    {previousVersion && !isVideo && !isEditing && (
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
                                    {activeData.prompt || (activeData as any).finalPrompt}
                                </pre>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center opacity-30 z-10"><Scan size={64} className="mx-auto mb-4" /><h2 className="text-2xl font-bold">{t('PRE_READY')}</h2></div>
                )}
            </div>

            {assets.length > 0 && !showBio && <AssetFilmstrip assets={assets.slice(0, 15)} selectedId={activeData?.id} onSelect={onAssetSelect!} />}
        </div>
    );
});
