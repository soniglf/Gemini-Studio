
import React, { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useGalleryStore } from '../../stores/galleryStore';
import { useUIStore } from '../../stores/uiStore';
import { CanvasItem } from './CanvasItem';
import { Magnet, Undo2, Redo2, ZoomIn, ZoomOut, Shirt, Sparkles, Image as ImageIcon, Zap, MousePointer2, Move } from 'lucide-react';
import { ModifierType, NodeType, GenerationTier, CanvasItemState } from '../../types';
import { usePlatform } from '../../hooks/usePlatform';

interface NeuralCanvasProps {
    onViewItem?: (id: string) => void;
}

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({ onViewItem }) => {
    const { assets } = useGalleryStore();
    const { 
        items, links, view, initializeBoard, panView, zoomView, 
        snapEnabled, toggleSnap, undo, redo, 
        addModifierNode, isLinking, updateTempLink,
        clearSelection, cancelLinking
    } = useCanvasStore();
    const { modifierKey } = usePlatform();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (assets.length > 0) initializeBoard(assets);
    }, [assets, initializeBoard]);

    // --- FORCE NON-PASSIVE EVENT LISTENER FOR ZOOM ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation(); 
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                zoomView(delta);
            } else {
                e.preventDefault(); 
                e.stopPropagation(); 
                panView(-e.deltaX, -e.deltaY);
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [zoomView, panView]);

    // --- PANNING LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === containerRef.current && (e.button === 0 || e.button === 1)) {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            clearSelection();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isLinking) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const x = (e.clientX - rect.left - view.x) / view.scale;
                    const y = (e.clientY - rect.top - view.y) / view.scale;
                    updateTempLink(x, y);
                }
            }

            if (!isPanning || !lastMousePos.current) return;
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            panView(dx, dy);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => { 
            setIsPanning(false); 
            lastMousePos.current = null;
            if (isLinking) {
                cancelLinking();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning, isLinking, panView, updateTempLink, view, cancelLinking]);

    const getPath = (x1: number, y1: number, x2: number, y2: number) => {
        const dist = Math.abs(x2 - x1) * 0.5;
        return `M ${x1} ${y1} C ${x1 + dist} ${y1}, ${x2 - dist} ${y2}, ${x2} ${y2}`;
    };

    return (
        <div 
            ref={containerRef}
            className={`relative w-full h-full bg-[#050914] overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
        >
            {/* GRID BACKGROUND */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
                    backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`,
                    backgroundPosition: `${view.x}px ${view.y}px`
                }}
            />

            {/* CONTENT LAYER */}
            <div 
                className="absolute transform-gpu origin-top-left will-change-transform"
                style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
            >
                {/* LINKS LAYER (SVG) */}
                <svg className="absolute overflow-visible top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {links.map(link => {
                        const from = items[link.fromId];
                        const to = items[link.toId];
                        if (!from || !to) return null;
                        
                        const x1 = from.x + from.width / 2;
                        const y1 = from.y + from.height / 2;
                        const x2 = to.x + to.width / 2;
                        const y2 = to.y + to.height / 2;

                        return (
                            <path 
                                key={link.id}
                                d={getPath(x1, y1, x2, y2)}
                                stroke="#6366f1"
                                strokeWidth="2"
                                fill="none"
                                className="opacity-50"
                            />
                        );
                    })}
                    {isLinking && useCanvasStore.getState().tempLinkEnd && (
                        <path 
                            d={getPath(
                                isLinking.startX, 
                                isLinking.startY, 
                                useCanvasStore.getState().tempLinkEnd!.x, 
                                useCanvasStore.getState().tempLinkEnd!.y
                            )}
                            stroke="#ec4899"
                            strokeWidth="3"
                            strokeDasharray="5,5"
                            fill="none"
                            className="animate-pulse"
                        />
                    )}
                </svg>

                {/* NODES LAYER */}
                {Object.values(items).map((item: CanvasItemState) => {
                    const asset = item.nodeType === NodeType.ASSET && item.assetId 
                        ? assets.find(a => a.id === item.assetId) 
                        : undefined;
                    
                    return (
                        <CanvasItem 
                            key={item.id} 
                            itemState={item} 
                            asset={asset}
                            onView={() => item.assetId && onViewItem && onViewItem(item.assetId)}
                        />
                    );
                })}
            </div>

            {/* CONTROLS OVERLAY - Left Bottom Guide */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-2 pointer-events-none opacity-60 hover:opacity-100 transition-opacity z-[100]">
                <div className="bg-black/60 backdrop-blur rounded-lg p-3 text-[10px] text-white space-y-2 border border-white/5 shadow-xl pointer-events-auto" title="Canvas Navigation Guide">
                    <div className="flex items-center gap-2"><MousePointer2 size={12} className="text-white/70"/> <span>Drag background to Pan</span></div>
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 px-1 rounded text-white font-bold font-mono">{modifierKey}</span> 
                        <span> + Scroll to Zoom</span>
                    </div>
                    <div className="flex items-center gap-2"><Move size={12} className="text-white/70"/> <span>Drag Nodes to Move</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div> <span>Drag Ports to Link</span></div>
                </div>
            </div>

            {/* TOOLBAR - Centered Bottom */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-4 z-[100] shadow-2xl">
                <div className="flex gap-2">
                    <button onClick={() => addModifierNode(ModifierType.CLOTHING)} className="p-3 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-full text-indigo-400 transition-colors tooltip" title="Add Clothing Modifier">
                        <Shirt size={18}/>
                    </button>
                    <button onClick={() => addModifierNode(ModifierType.STYLE)} className="p-3 bg-white/5 hover:bg-pink-600 hover:text-white rounded-full text-pink-400 transition-colors" title="Add Style Modifier">
                        <Sparkles size={18}/>
                    </button>
                </div>
                
                <div className="w-px h-8 bg-white/10"></div>

                <div className="flex gap-1">
                    <button onClick={undo} className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full" title="Undo"><Undo2 size={18}/></button>
                    <button onClick={redo} className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full" title="Redo"><Redo2 size={18}/></button>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <div className="flex gap-1 items-center">
                    <button onClick={() => zoomView(-0.2)} className="p-3 text-white/50 hover:text-white rounded-full" title="Zoom Out"><ZoomOut size={18}/></button>
                    <button onClick={() => toggleSnap()} className={`p-3 rounded-full transition-colors ${snapEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/50'}`} title="Toggle Snap Grid"><Magnet size={18}/></button>
                    <button onClick={() => zoomView(0.2)} className="p-3 text-white/50 hover:text-white rounded-full" title="Zoom In"><ZoomIn size={18}/></button>
                </div>
            </div>
        </div>
    );
};
