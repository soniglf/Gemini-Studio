
import React, { useState, useEffect, memo } from 'react';
import { GeneratedAsset } from '../../types';
import { Video, Image as ImageIcon, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { db } from '../../services/db';

interface AssetCardProps {
    asset: GeneratedAsset;
    isSelected: boolean;
    isSelectionMode: boolean;
    onClick: (asset: GeneratedAsset) => void;
    onDelete: (id: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = memo(({ asset, isSelected, isSelectionMode, onClick, onDelete }) => {
    const { ref, isInView } = useInView({ rootMargin: '200px' });
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    // [Citadel Update] Lazy Hydration from IndexedDB
    useEffect(() => {
        let active = true;

        const loadBlob = async () => {
            if (objectUrl) return; // Already loaded
            
            // 1. Try Asset (if passed directly via props, e.g., pending items)
            if (asset.blob) {
                if (active) setObjectUrl(URL.createObjectURL(asset.blob));
                return;
            }

            // 2. Fetch from DB (Lazy Load)
            if (isInView && !asset.id.startsWith('pending-')) {
                try {
                    const fullAsset = await db.assets.get(asset.id);
                    if (active && fullAsset?.blob) {
                        setObjectUrl(URL.createObjectURL(fullAsset.blob));
                    }
                } catch (e) {
                    console.error("Lazy load failed", e);
                    setError(true);
                }
            }
        };

        loadBlob();

        return () => {
            active = false;
            // Cleanup URL on unmount to free memory
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [isInView, asset.blob, asset.id]);

    const displayUrl = objectUrl || (asset.url && !asset.url.startsWith('blob:') ? asset.url : null);

    return (
        <div 
            ref={ref}
            className={`relative group rounded-lg overflow-hidden border bg-slate-900/50 aspect-square cursor-pointer transition-all ${isSelected ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-white/10 hover:border-pink-500/50'}`} 
            onClick={() => onClick(asset)}
        >
            {/* Placeholder / Loading State */}
            {!displayUrl && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white/20">
                    <AlertCircle size={24} className="mb-2"/>
                    <span className="text-[9px] font-bold uppercase">Media Error</span>
                </div>
            )}

            {/* Media Content */}
            {displayUrl && !error && (
                asset.type === 'VIDEO' ? (
                    <div className="w-full h-full relative">
                        <video 
                            src={displayUrl} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                            muted loop 
                            onError={() => setError(true)}
                            onMouseOver={e => !isSelectionMode && e.currentTarget.play()} 
                            onMouseOut={e => !isSelectionMode && e.currentTarget.pause()} 
                        />
                        <div className="absolute top-2 left-2 bg-black/50 p-1 rounded backdrop-blur"><Video size={12} className="text-purple-400"/></div>
                    </div>
                ) : (
                    <div className="w-full h-full relative">
                        <img 
                            src={displayUrl} 
                            alt={asset.prompt} 
                            onError={() => setError(true)} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        />
                        <div className="absolute top-2 left-2 bg-black/50 p-1 rounded backdrop-blur"><ImageIcon size={12} className="text-pink-400"/></div>
                    </div>
                )
            )}
            
            {/* Selection Overlay */}
            {isSelectionMode && (
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center ${isSelected ? 'bg-pink-600 border-pink-500' : 'bg-black/50'}`}>
                    {isSelected && <CheckCircle size={14} className="text-white"/>}
                </div>
            )}

            {/* Hover Actions */}
            {!isSelectionMode && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                        <p className="text-[10px] text-white/80 line-clamp-2 leading-tight mb-2">{asset.prompt}</p>
                        {asset.tags && (
                            <div className="flex gap-1 flex-wrap">
                                {asset.tags.slice(0, 2).map((t, i) => <span key={i} className="text-[8px] bg-white/10 px-1 rounded text-white/70">{t}</span>)}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }} 
                        className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 text-white shadow-lg pointer-events-auto"
                    >
                        <X size={12}/>
                    </button>
                </>
            )}
        </div>
    );
});
