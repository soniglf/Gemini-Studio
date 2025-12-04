import React, { useState } from 'react';
import { Button, BiometricSlider, TextArea } from '../../components/UI';
import { ScanFace, Zap, Info, Upload, ChevronDown, FileText, X, Trash2, CheckCircle2, RotateCcw, GripVertical } from 'lucide-react';
import { GenerationService } from '../../services/ai/generationService';
import { ImageOptimizer } from '../../services/utils/imageOptimizer';
import { useUIStore } from '../../stores/uiStore';
import { useModelStore } from '../../stores/modelStore';
import { ModelAttributes } from '../../types';
import { DEFAULT_MORPHOLOGY } from '../../data/defaults';

export const CloneEngine: React.FC = () => {
    const { model, setModel } = useModelStore();
    const { addToast, tier } = useUIStore(); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showDNA, setShowDNA] = useState(true);
    
    // Drag and Drop Ordering State
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const images = model.referenceImages || [];
    const imageCount = images.length;
    const maxImages = 10;
    const hasDNA = !!model.syntheticDNA;

    const handleBatchAddImages = async (files: File[]) => {
        const valid = files.filter(f => f.type.startsWith('image/'));
        if (!valid.length) return;

        const remainingSlots = maxImages - imageCount;
        if (remainingSlots <= 0) {
            addToast("Maximum 10 reference images allowed.", "warning");
            return;
        }

        const filesToProcess = valid.slice(0, remainingSlots);
        if (filesToProcess.length < valid.length) {
            addToast(`Only added first ${remainingSlots} images (Limit reached).`, "info");
        }

        const newImages = await Promise.all(filesToProcess.map(file => ImageOptimizer.optimize(file).catch(e => { console.error(e); return null; })));
        const successful = newImages.filter(Boolean) as string[];

        if (successful.length > 0) {
            const combined = [...images, ...successful];
            addToast(`Added ${successful.length} reference(s)`, 'success');
            setModel({ ...model, referenceImages: combined, referenceImage: combined[0] });
        }
    };

    const removeImage = (index: number) => {
        const current = [...images];
        current.splice(index, 1);
        setModel({ 
            ...model, 
            referenceImages: current, 
            referenceImage: current.length > 0 ? current[0] : null 
        });
    };

    const handleResetDNA = () => {
        if(confirm("Reset entire DNA profile? This will clear images, biometrics, and description.")) {
            setModel({
                ...model,
                referenceImages: [],
                referenceImage: null,
                morphology: { ...DEFAULT_MORPHOLOGY },
                syntheticDNA: "",
                ethnicity: "Mixed", // Soft reset
                distinctiveFeatures: ""
            });
            addToast("DNA Reset to Default", 'info');
        }
    };

    const handleAnalyze = async () => {
        if (!imageCount) return addToast("Upload a reference image", "warning");
        setIsAnalyzing(true);
        try {
            // Pass the current tier (Sketch/Render) to the service
            const result = await GenerationService.analyze(images, tier);
            const description = GenerationService.generatePhenotypeDescription(result);
            
            // Create a deep copy of the current model to avoid mutation issues
            const updatedModel = { ...model };

            // Merge Top Level Fields if they exist in result
            (Object.keys(result) as Array<keyof ModelAttributes>).forEach(key => {
                if (key !== 'morphology' && result[key] !== undefined && result[key] !== null) {
                    // @ts-ignore
                    updatedModel[key] = result[key];
                }
            });

            // Deep Merge Morphology
            if (result.morphology) {
                updatedModel.morphology = {
                    ...updatedModel.morphology,
                    ...result.morphology
                };
            }
            
            // Populate Synthetic DNA Description
            updatedModel.syntheticDNA = description;

            setModel(updatedModel);
            setShowDNA(true);
            addToast(`DNA Extracted: ${result.ethnicity || 'Unknown'}`, "success");
        } catch (e) { 
            console.error(e);
            addToast("Analysis Failed", "error"); 
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- DRAG AND DROP REORDERING ---
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        // Required for Firefox
        e.dataTransfer.effectAllowed = 'move';
        // Set ghost image or data if needed, usually defaults work fine
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const updatedImages = [...images];
        const [movedItem] = updatedImages.splice(draggedIndex, 1);
        updatedImages.splice(dropIndex, 0, movedItem);

        setModel({ 
            ...model, 
            referenceImages: updatedImages,
            referenceImage: updatedImages[0] // Primary is always first
        });
        setDraggedIndex(null);
    };

    return (
        <div 
            className={`bg-slate-900/40 p-4 rounded-xl border transition-all ${isDragging ? 'border-pink-500 ring-1 ring-pink-500/50' : 'border-white/5'}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); await handleBatchAddImages(Array.from(e.dataTransfer.files)); }}
            onPaste={async (e) => { await handleBatchAddImages(Array.from(e.clipboardData.files)); }}
            data-no-global-drop="true"
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-blue-400">
                    <ScanFace size={16} /> 
                    <span className="text-[10px] font-bold uppercase">Clone Engine</span>
                </div>
                <div className="flex gap-2 items-center">
                    {hasDNA && (
                        <button 
                            onClick={handleAnalyze} 
                            className="h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                            title="Re-Scan (Refresh DNA)"
                        >
                            <RotateCcw size={12}/>
                        </button>
                    )}
                    {imageCount > 0 && (
                        <button onClick={handleResetDNA} className="h-6 w-6 flex items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20" title="Reset DNA">
                            <Trash2 size={12}/>
                        </button>
                    )}
                    
                    {hasDNA ? (
                        <div className="h-6 px-3 rounded flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wide cursor-default">
                            <CheckCircle2 size={12} />
                            DNA Extracted
                        </div>
                    ) : (
                        <Button onClick={handleAnalyze} isLoading={isAnalyzing} disabled={imageCount === 0} className="h-6 text-[10px] px-3 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30">
                            <Zap size={10} className="mr-1" /> Extract DNA
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Gallery Grid with Reordering */}
            {imageCount > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-4 animate-in slide-in-from-top-2">
                    {images.map((img, idx) => (
                        <div 
                            key={idx} 
                            className={`relative group aspect-square rounded-lg overflow-hidden border bg-black/50 shadow-sm ${draggedIndex === idx ? 'opacity-50 border-blue-500 dashed' : 'border-white/20'}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDrop={(e) => onDrop(e, idx)}
                        >
                            <img src={img} className="w-full h-full object-cover pointer-events-none" alt={`Ref ${idx}`} />
                            
                            {/* Drag Handle Overlay */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing">
                                <GripVertical className="text-white/50" size={16} />
                            </div>

                            {/* Correctly Positioned Delete Button */}
                            <button 
                                onClick={() => removeImage(idx)} 
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-400 hover:scale-110 transition-all z-20 opacity-0 group-hover:opacity-100"
                                title="Remove Image"
                            >
                                <X size={10} />
                            </button>

                            {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-[8px] font-bold text-white text-center py-0.5 pointer-events-none">PRIMARY</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Drop Zone */}
            {imageCount < maxImages && (
                <div 
                    className={`
                        border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden mb-4
                        ${isDragging ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                    `}
                    onClick={() => document.getElementById('clone-upload')?.click()}
                >
                    <div className="p-3 rounded-full bg-slate-800/50 mb-2 group-hover:scale-110 transition-transform">
                        <Upload size={20} className={`transition-colors ${isDragging ? 'text-pink-400' : 'text-white/30 group-hover:text-white'}`} />
                    </div>
                    <span className="text-xs font-bold text-white/70">Drop or Paste Images</span>
                    <span className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">{imageCount}/{maxImages} Uploaded</span>
                    
                    <input 
                        id="clone-upload" 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                            if (e.target.files) handleBatchAddImages(Array.from(e.target.files));
                            e.target.value = ''; // Reset
                        }} 
                    />
                </div>
            )}
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-3">
                <BiometricSlider label={`Identity Lock: ${model.strictness}%`} value={model.strictness} onChange={(v) => setModel({...model, strictness:v})} />
                <div className="pt-2 border-t border-white/5">
                    <button onClick={() => setShowDNA(!showDNA)} className="flex items-center justify-between w-full text-[9px] text-white/40 hover:text-white transition-colors">
                        <span className="flex items-center gap-1"><FileText size={10}/> Synthetic DNA</span>
                        <ChevronDown size={10} className={`transition-transform ${showDNA ? 'rotate-180' : ''}`} />
                    </button>
                    {showDNA && (
                        <div className="animate-in slide-in-from-top-2">
                            <TextArea 
                                label="" 
                                value={model.syntheticDNA || ""} 
                                onChange={(e) => setModel({...model, syntheticDNA:e.target.value})} 
                                className="h-24 mt-2 text-[10px] font-mono"
                                placeholder="Extracted visual traits will appear here..."
                            />
                        </div>
                    )}
                </div>
                <p className="text-[9px] text-white/40 mt-1 flex items-center gap-1"><Info size={10}/> 0% = Vibe. 100% = Clone. Primary image takes priority.</p>
            </div>
        </div>
    );
};