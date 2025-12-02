
import React, { memo, useState } from 'react';
import { GeneratedAsset } from '../../types';
import { X, Video, Image, FolderOpen, CheckCircle, Download, Trash2, BoxSelect, ArrowDownCircle, Loader2, Tag, Filter, FolderPlus, Folder, MoveRight, Layers } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useGalleryStore } from '../../stores/galleryStore';
import { useProjectStore } from '../../stores/projectStore';
import JSZip from 'jszip';

export const GalleryWorkspace: React.FC<{ onSelect: (asset: GeneratedAsset) => void }> = memo(({ onSelect }) => {
    const { t } = useTranslation();
    const { 
        assets, deleteAsset, loadMore, hasMore, isLoadingMore, 
        activeTags, toggleTag, getFilteredAssets, getAvailableTags,
        collections, createCollection, deleteCollection, activeCollectionId, setActiveCollection, moveAssetsToCollection 
    } = useGalleryStore();
    const { activeProject } = useProjectStore();
    
    // Batch Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [showCreateCol, setShowCreateCol] = useState(false);

    const filteredAssets = getFilteredAssets();
    const availableTags = getAvailableTags();

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if(newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleCardClick = (asset: GeneratedAsset) => {
        if(isSelectionMode) {
            toggleSelection(asset.id);
        } else {
            onSelect(asset);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm('Delete this asset?')) {
            await deleteAsset(id);
        }
    };

    const handleBatchDelete = async () => {
        if(!confirm(`Delete ${selectedIds.size} items?`)) return;
        setIsProcessing(true);
        for(const id of selectedIds) {
            await deleteAsset(id);
        }
        setSelectedIds(new Set());
        setIsProcessing(false);
    };

    const handleCreateCollection = async () => {
        if(newCollectionName.trim()) {
            await createCollection(newCollectionName);
            setNewCollectionName("");
            setShowCreateCol(false);
        }
    };

    const handleMoveToCollection = async (targetId: string | null) => {
        if (selectedIds.size === 0) return;
        await moveAssetsToCollection(Array.from(selectedIds), targetId);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleBatchDownload = async () => {
        setIsProcessing(true);
        try {
            const zip = new JSZip();
            const targets = assets.filter(a => selectedIds.has(a.id));
            
            for (const asset of targets) {
                if (asset.blob) {
                    const ext = asset.type === 'VIDEO' ? 'mp4' : 'png';
                    const filename = `gemini_${asset.id}_${asset.projectId}.${ext}`;
                    zip.file(filename, asset.blob);
                }
            }
            
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeProject?.name || 'campaign'}_assets.zip`;
            link.click();
            
            // CRITICAL: Revoke URL to prevent memory leaks
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (e) {
            console.error("Zip download failed", e);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!activeProject) return <div className="p-10 text-center text-white/30">{t('GAL_SELECT')}</div>;

    return (
        <div className="flex h-full pb-32 animate-in fade-in relative">
            
            {/* LEFT SIDEBAR: STUDIO RACKS */}
            <div className="w-48 border-r border-white/5 pr-4 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-white/50 mb-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-widest">Racks</span>
                    <button onClick={() => setShowCreateCol(!showCreateCol)} className="hover:text-pink-400"><FolderPlus size={14}/></button>
                </div>
                
                {showCreateCol && (
                    <div className="flex gap-1 mb-2">
                        <input 
                            value={newCollectionName} 
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded text-xs px-2 py-1 text-white"
                            placeholder="Name..."
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                        />
                    </div>
                )}

                <button 
                    onClick={() => setActiveCollection(null)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeCollectionId === null ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                    <Layers size={14}/> All Assets
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    {collections.map(col => (
                        <div key={col.id} className="group relative">
                             <button 
                                onClick={() => setActiveCollection(col.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeCollectionId === col.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                <Folder size={14} className={activeCollectionId === col.id ? "text-pink-400" : ""} />
                                <span className="truncate">{col.name}</span>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={10}/>
                            </button>
                        </div>
                    ))}
                    {collections.length === 0 && (
                        <div className="text-[9px] text-white/20 italic px-3 py-2">No collections created.</div>
                    )}
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="flex-1 pl-4 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between text-white/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <FolderOpen size={16} />
                        <span className="text-xs uppercase tracking-widest">{activeProject.name} <span className="text-white/30">/ {collections.find(c => c.id === activeCollectionId)?.name || "All"}</span></span>
                    </div>
                    
                    {assets.length > 0 && (
                        <button 
                            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
                            className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${isSelectionMode ? 'bg-pink-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}
                        >
                            <BoxSelect size={14} /> {isSelectionMode ? 'Cancel' : 'Select'}
                        </button>
                    )}
                </div>

                {/* VISUAL FILTER BAR */}
                {availableTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1 mr-2 shrink-0">
                            <Filter size={10} /> Filters:
                        </div>
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${activeTags.includes(tag) ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-slate-800 text-white/40 hover:text-white hover:bg-slate-700'}`}
                            >
                                <Tag size={8} /> {tag}
                            </button>
                        ))}
                        {activeTags.length > 0 && (
                            <button onClick={() => activeTags.forEach(t => toggleTag(t))} className="ml-2 text-[9px] text-white/30 hover:text-white flex items-center gap-1">
                                <X size={10} /> Clear
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {filteredAssets.map(a => {
                        const isSelected = selectedIds.has(a.id);
                        return (
                            <div 
                                key={a.id} 
                                className={`relative group rounded-lg overflow-hidden border bg-slate-900/50 aspect-square cursor-pointer transition-all ${isSelected ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-white/10 hover:border-pink-500/50'}`} 
                                onClick={() => handleCardClick(a)}
                            >
                                {a.type === 'VIDEO' ? (
                                    <div className="w-full h-full relative">
                                        <video src={a.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop onMouseOver={e => !isSelectionMode && e.currentTarget.play()} onMouseOut={e => !isSelectionMode && e.currentTarget.pause()} />
                                        <div className="absolute top-2 left-2 bg-black/50 p-1 rounded backdrop-blur"><Video size={12} className="text-purple-400"/></div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full relative">
                                        <img src={a.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-2 left-2 bg-black/50 p-1 rounded backdrop-blur"><Image size={12} className="text-pink-400"/></div>
                                    </div>
                                )}
                                
                                {/* Selection Checkbox Overlay */}
                                {isSelectionMode && (
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center ${isSelected ? 'bg-pink-600 border-pink-500' : 'bg-black/50'}`}>
                                        {isSelected && <CheckCircle size={14} className="text-white"/>}
                                    </div>
                                )}

                                {!isSelectionMode && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                                            <p className="text-[10px] text-white/80 line-clamp-2 leading-tight mb-2">{a.prompt}</p>
                                            {a.tags && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {a.tags.slice(0, 2).map((t, i) => <span key={i} className="text-[8px] bg-white/10 px-1 rounded text-white/70">{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={(e) => handleDelete(e, a.id)} className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 text-white shadow-lg pointer-events-auto">
                                            <X size={12}/>
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                    
                    {hasMore && assets.length > 0 && activeTags.length === 0 && (
                        <div className="col-span-full flex justify-center py-4">
                            <button 
                                onClick={() => loadMore()} 
                                disabled={isLoadingMore}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isLoadingMore ? <Loader2 size={16} className="animate-spin"/> : <ArrowDownCircle size={16}/>}
                                {isLoadingMore ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Batch Action Bar */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-4 z-50">
                    <div className="bg-[#030712] border border-white/10 rounded-xl p-3 shadow-2xl flex items-center justify-between">
                         <span className="text-xs font-bold text-white px-2">{selectedIds.size} Selected</span>
                         <div className="flex items-center gap-2">
                             
                             {/* Move to Collection Dropdown */}
                             <div className="group relative">
                                 <button className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                     <MoveRight size={14}/> Move to Rack
                                 </button>
                                 <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#0B1121] border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
                                     <button onClick={() => handleMoveToCollection(null)} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10">All Assets (Unsorted)</button>
                                     {collections.map(c => (
                                         <button key={c.id} onClick={() => handleMoveToCollection(c.id)} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 truncate">{c.name}</button>
                                     ))}
                                 </div>
                             </div>

                             <div className="w-px h-6 bg-white/10 mx-2"></div>

                             <button onClick={handleBatchDelete} disabled={isProcessing} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                 <Trash2 size={14}/> Delete
                             </button>
                             <button onClick={handleBatchDownload} disabled={isProcessing} className="bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                 {isProcessing ? 'Zipping...' : <><Download size={14}/> Download Zip</>}
                             </button>
                         </div>
                    </div>
                </div>
            )}
            
            {assets.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 pointer-events-none">
                    <Image size={48} className="mb-4 opacity-50"/>
                    <p className="text-sm font-bold uppercase">{t('GAL_EMPTY')}</p>
                </div>
            )}
        </div>
    );
});
