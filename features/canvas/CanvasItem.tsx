
import React, { memo, useState, useRef, useEffect } from 'react';
import { CanvasItemState, GeneratedAsset, NodeType, ModifierType } from '../../types';
import { useCanvasStore } from '../../stores/canvasStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';
import { useModelStore } from '../../stores/modelStore';
import { Video, Image as ImageIcon, Maximize2, X, Plus, Upload, Play, Shirt, Star, Check, RotateCcw } from 'lucide-react';
import { ImageUpload, TextArea } from '../../components/UI';

interface CanvasItemProps {
    itemState: CanvasItemState;
    asset?: GeneratedAsset;
    onView?: () => void;
    isLinkedTo?: boolean; 
}

export const CanvasItem: React.FC<CanvasItemProps> = memo(({ itemState, asset, onView, isLinkedTo }) => {
    const { updateItemPosition, selectItem, startLinking, completeLinking, items, links, selectedIds } = useCanvasStore();
    const { generateWithModifier } = useGenerationStore();
    const { updateReferenceImage } = useModelStore();
    const { tier, addToast } = useUIStore();
    
    // Local state for smooth dragging without global re-renders
    const [localPos, setLocalPos] = useState({ x: itemState.x, y: itemState.y });
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const [modifierPrompt, setModifierPrompt] = useState(itemState.modifierData?.prompt || "");
    const [isPromptSaved, setIsPromptSaved] = useState(!!itemState.modifierData?.prompt);

    const isSelected = selectedIds.has(itemState.id);

    // Sync local state when external updates happen (e.g. undo, layout changes)
    useEffect(() => {
        if (!isDragging) {
            setLocalPos({ x: itemState.x, y: itemState.y });
        }
    }, [itemState.x, itemState.y, isDragging]);

    // --- DRAG LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault(); 
        setIsDragging(true);
        selectItem(itemState.id, e.shiftKey);
        startPos.current = { x: e.clientX, y: e.clientY };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !startPos.current) return;
            const scale = useCanvasStore.getState().view.scale;
            const deltaX = (e.clientX - startPos.current.x) / scale;
            const deltaY = (e.clientY - startPos.current.y) / scale;
            
            // Update local state for 60fps smoothness
            setLocalPos(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }));
            
            startPos.current = { x: e.clientX, y: e.clientY };
        };
        
        const handleMouseUp = () => { 
            if (isDragging) {
                setIsDragging(false); 
                startPos.current = null;
                // Commit final position to store (with optional grid snapping inside store)
                updateItemPosition(itemState.id, localPos.x, localPos.y);
            }
        };
        
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, itemState.id, updateItemPosition, localPos]);

    // --- PORT LOGIC ---
    const handlePortDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Calculate center based on *current* local position to be accurate while moving
        const cx = localPos.x + itemState.width / 2;
        const cy = localPos.y + itemState.height / 2;
        startLinking(itemState.id, cx, cy);
    };

    const handlePortUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        completeLinking(itemState.id);
    };

    // --- MODIFIER LOGIC ---
    const handleUpdateModifier = (field: string, val: any) => {
        if (field === 'prompt') setModifierPrompt(val);
        useCanvasStore.getState().updateModifierData(itemState.id, { [field]: val });
    };

    const handleInjectPrompt = () => {
        setIsPromptSaved(true);
        handleUpdateModifier('prompt', modifierPrompt);
    };

    const handleGenerate = async () => {
        const link = links.find(l => l.fromId === itemState.id || l.toId === itemState.id);
        if (!link) return;
        const otherId = link.fromId === itemState.id ? link.toId : link.fromId;
        const modifierNode = items[otherId];
        
        if (modifierNode && modifierNode.nodeType === NodeType.MODIFIER && asset?.blob) {
            await generateWithModifier(asset, modifierNode, tier);
        }
    };

    const handleSetReference = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!asset?.url) return;
        
        if(confirm("Set this node as Primary Model Reference?")) {
            try {
                let blob: Blob;
                if (asset.blob) {
                    blob = asset.blob;
                } else {
                    const response = await fetch(asset.url);
                    blob = await response.blob();
                }
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    updateReferenceImage(base64);
                    addToast("Primary Reference Updated", "success");
                };
                reader.readAsDataURL(blob);
            } catch(e) {
                addToast("Failed to set reference", "error");
            }
        }
    };

    const connectedModifierId = links.find(l => (l.fromId === itemState.id || l.toId === itemState.id)) 
        ? (links.find(l => l.fromId === itemState.id) ? links.find(l => l.fromId === itemState.id)?.toId : links.find(l => l.toId === itemState.id)?.fromId)
        : null;
    const isConnectedToModifier = connectedModifierId ? items[connectedModifierId]?.nodeType === NodeType.MODIFIER : false;

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`absolute flex flex-col rounded-xl shadow-2xl overflow-visible group will-change-transform ${isSelected ? 'ring-2 ring-pink-500 z-50' : 'z-10'}`}
            style={{
                width: itemState.width,
                minHeight: itemState.height,
                transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0) rotate(${itemState.rotation || 0}deg)`,
                backgroundColor: itemState.nodeType === NodeType.MODIFIER ? '#1e1b4b' : '#0f172a',
                border: itemState.nodeType === NodeType.MODIFIER ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none'
            }}
        >
            {/* PORT HANDLES */}
            {itemState.nodeType !== NodeType.PENDING && ['right', 'left'].map(pos => (
                <div 
                    key={pos}
                    className={`absolute ${pos === 'right' ? '-right-3' : '-left-3'} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-slate-900 cursor-crosshair hover:scale-125 transition-transform z-50 flex items-center justify-center shadow-lg group/port`}
                    onMouseDown={handlePortDown}
                    onMouseUp={handlePortUp}
                >
                    <div className="w-2 h-2 bg-pink-500 rounded-full group-hover/port:bg-pink-400 group-hover/port:scale-150 transition-transform" />
                </div>
            ))}

            {/* NODE CONTENT */}
            {itemState.nodeType === NodeType.PENDING ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white/50 animate-pulse bg-slate-900/50 rounded-xl">
                    <div className="relative mb-4">
                        <div className="w-12 h-12 border-4 border-pink-500/30 rounded-full" />
                        <div className="absolute inset-0 w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Rendering</span>
                    <span className="text-[10px] mt-1 text-white/30">Gemini Engine Running...</span>
                </div>
            ) : itemState.nodeType === NodeType.MODIFIER ? (
                <div className="flex flex-col h-full cursor-default overflow-hidden rounded-xl" onMouseDown={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center gap-2 p-3 text-indigo-400 bg-white/5 border-b border-white/5" onMouseDown={handleMouseDown} style={{cursor: 'grab'}}>
                        {itemState.modifierType === ModifierType.CLOTHING && <Shirt size={14}/>}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{itemState.modifierType} MODIFIER</span>
                        {itemState.modifierData?.referenceImage && (
                            <button 
                                onClick={() => handleUpdateModifier('referenceImage', null)} 
                                className="ml-auto text-indigo-400 hover:text-white p-1 rounded hover:bg-white/10"
                                title="Redo / Clear Image"
                            >
                                <RotateCcw size={12} />
                            </button>
                        )}
                    </div>
                    
                    {/* Body: Visual Card or Upload Form */}
                    <div className="flex-1 flex flex-col p-2 space-y-2">
                        {itemState.modifierData?.referenceImage ? (
                            <div className="flex-1 relative rounded-lg overflow-hidden border border-indigo-500/30 group/img">
                                <img src={itemState.modifierData.referenceImage} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[9px] text-white/70 text-center backdrop-blur">
                                    Reference Active
                                </div>
                            </div>
                        ) : (
                            <div className="h-24 bg-black/40 rounded-lg overflow-hidden border border-white/5 relative">
                                <ImageUpload 
                                    label="" 
                                    value={null} 
                                    onChange={(v) => handleUpdateModifier('referenceImage', v)} 
                                    compact
                                    className="mb-0" // Align fix
                                />
                            </div>
                        )}

                        {/* Prompt Area with Injection Check */}
                        <div className="relative">
                            <textarea 
                                className={`w-full bg-black/20 border rounded-lg p-2 text-[10px] text-white resize-none h-16 focus:outline-none transition-colors ${isPromptSaved ? 'border-emerald-500/50 text-emerald-300' : 'border-white/10 focus:border-indigo-500/50'}`}
                                placeholder="Describe change..."
                                value={modifierPrompt}
                                onChange={(e) => { setModifierPrompt(e.target.value); setIsPromptSaved(false); }}
                            />
                            {!isPromptSaved && modifierPrompt.trim().length > 0 && (
                                <button 
                                    onClick={handleInjectPrompt}
                                    className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg animate-in fade-in"
                                    title="Inject Prompt"
                                >
                                    <Check size={10} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ASSET NODE */}
                    <div className="flex-1 relative overflow-hidden bg-black/20 rounded-t-xl">
                        {asset?.type === 'VIDEO' ? (
                            <video src={asset.url} className="w-full h-full object-cover pointer-events-none" muted loop />
                        ) : (
                            <img src={asset?.url} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                        )}
                        
                        <div className="absolute top-2 left-2 bg-black/50 p-1.5 rounded-lg backdrop-blur">
                            {asset?.type === 'VIDEO' ? <Video size={12} className="text-purple-400"/> : <ImageIcon size={12} className="text-pink-400"/>}
                        </div>

                        {onView && (
                            <button onClick={(e) => { e.stopPropagation(); onView(); }} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg text-white hover:bg-pink-600 transition-colors pointer-events-auto" title="Maximize View">
                                <Maximize2 size={12}/>
                            </button>
                        )}

                        {/* Set Reference Action */}
                        <button 
                            onClick={handleSetReference} 
                            className="absolute top-2 right-10 bg-black/50 p-1.5 rounded-lg text-white hover:text-yellow-400 transition-colors pointer-events-auto opacity-0 group-hover:opacity-100"
                            title="Set as Primary Reference"
                        >
                            <Star size={12} fill="currentColor"/>
                        </button>
                        
                        {/* GENERATE ACTION OVERLAY */}
                        {isConnectedToModifier && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-xl hover:scale-105 transition-transform animate-in slide-in-from-bottom-2 pointer-events-auto"
                                >
                                    <Play size={12} fill="currentColor"/> GENERATE
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-8 bg-[#0B1121] border-t border-white/5 flex items-center px-2 rounded-b-xl" onMouseDown={handleMouseDown}>
                        <span className="text-[9px] text-white/40 font-mono truncate select-none">{asset?.prompt}</span>
                    </div>
                </>
            )}
        </div>
    );
});
