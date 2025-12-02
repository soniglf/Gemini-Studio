
import React, { useCallback, useState } from 'react';
import { UploadCloud, FileJson } from 'lucide-react';
import { PngMetadataService } from '../../services/utils/pngMetadata';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';
import { usePresetStore } from '../../stores/presetStore';

export const DragDropZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dropType, setDropType] = useState<'IMAGE' | 'PRESET'>('IMAGE');
    const { restoreState } = useGenerationStore();
    const { importPreset } = usePresetStore();
    const { addToast } = useUIStore();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
             const item = e.dataTransfer.items[0];
             if (item.type === 'application/json' || item.kind === 'file') {
                 // Hard to strictly detect .style extension here without file access, assume based on context later
                 // But we can check if it looks like an image
                 if (item.type.includes('image')) setDropType('IMAGE');
                 else setDropType('PRESET');
             }
        }
    }, []);
  
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);
  
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        
        if (!file) return;

        // CASE 1: DNA REHYDRATION
        if (file.type === 'image/png') {
            try {
                const metadata = await PngMetadataService.extractMetadata(file);
                if (metadata && metadata.settings) {
                    restoreState(metadata);
                } else {
                    addToast("No Gemini DNA found in this image", 'info');
                }
            } catch (e) {
                console.error(e);
            }
        } 
        // CASE 2: PRESET IMPORT (.style or .json)
        else if (file.name.endsWith('.style') || file.name.endsWith('.json')) {
            try {
                const text = await file.text();
                const json = JSON.parse(text);
                if (json.name && json.settings && json.mode) {
                    importPreset(json);
                    addToast(`Style "${json.name}" Imported`, 'success');
                } else {
                    addToast("Invalid Style File", 'error');
                }
            } catch (e) {
                console.error(e);
                addToast("Failed to import style", 'error');
            }
        }
    }, [restoreState, importPreset, addToast]);

    return (
        <div 
            className="h-screen w-screen relative overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm animate-in fade-in">
                    {dropType === 'IMAGE' ? (
                        <>
                            <UploadCloud size={64} className="text-pink-500 mb-4 animate-bounce" />
                            <h2 className="text-2xl font-bold text-white">Drop to Rehydrate</h2>
                            <p className="text-white/50">Restoring workspace from Gemini DNA</p>
                        </>
                    ) : (
                        <>
                            <FileJson size={64} className="text-emerald-500 mb-4 animate-bounce" />
                            <h2 className="text-2xl font-bold text-white">Import Style</h2>
                            <p className="text-white/50">Adding preset to your library</p>
                        </>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};
