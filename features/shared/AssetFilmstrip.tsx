
import React, { memo, useMemo } from 'react';
import { GeneratedAsset } from '../../types';
import { Film, Layers } from 'lucide-react';

interface AssetFilmstripProps {
    assets: GeneratedAsset[];
    selectedId?: string;
    onSelect: (a: GeneratedAsset) => void;
}

export const AssetFilmstrip: React.FC<AssetFilmstripProps> = memo(({ assets, selectedId, onSelect }) => {
    if (!assets || assets.length === 0) return null;

    // Group assets by Session ID
    const sessions = useMemo(() => {
        const groups: { id: string, assets: GeneratedAsset[] }[] = [];
        let currentSessionId = "";
        let currentGroup: GeneratedAsset[] = [];

        assets.forEach(asset => {
            const sid = asset.sessionId || "legacy";
            if (sid !== currentSessionId) {
                if (currentGroup.length > 0) {
                    groups.push({ id: currentSessionId, assets: currentGroup });
                }
                currentSessionId = sid;
                currentGroup = [asset];
            } else {
                currentGroup.push(asset);
            }
        });
        if (currentGroup.length > 0) groups.push({ id: currentSessionId, assets: currentGroup });
        return groups;
    }, [assets]);

    return (
        <div className="h-28 w-full border-t border-white/5 bg-[#030712]/80 backdrop-blur shrink-0 flex items-center px-4 gap-4 overflow-x-auto no-scrollbar z-30">
            {sessions.map((session, sIdx) => (
                <div key={session.id} className="flex gap-2 p-2 bg-white/5 rounded-xl border border-white/5 items-center shrink-0">
                    {/* Session Indicator */}
                    {session.id !== 'legacy' && (
                        <div className="flex flex-col items-center justify-center w-4 h-full border-r border-white/10 mr-1 opacity-30">
                            <span className="text-[8px] font-mono -rotate-90 whitespace-nowrap">BATCH {sIdx + 1}</span>
                        </div>
                    )}
                    
                    {session.assets.map(asset => (
                        <button 
                            key={asset.id}
                            onClick={() => onSelect(asset)}
                            className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all group ${selectedId === asset.id ? 'border-pink-500 scale-105 ring-2 ring-pink-500/20' : 'border-white/10 hover:border-white/30'}`}
                        >
                            {asset.type === 'VIDEO' ? (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film size={12}/></div>
                            ) : (
                                <img src={asset.url} className="w-full h-full object-cover" />
                            )}
                            {selectedId === asset.id && <div className="absolute inset-0 bg-pink-500/20"/>}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
});
