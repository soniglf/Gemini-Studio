import React, { useState } from 'react';
import { Button, ImageUpload, BiometricSlider, TextArea } from '../../components/UI';
import { ScanFace, Zap, Info, Upload, ChevronDown, FileText } from 'lucide-react';
import { GenerationService } from '../../services/ai/generationService';
import { ImageOptimizer } from '../../services/utils/imageOptimizer';
import { useUIStore } from '../../stores/uiStore';
import { useModelStore } from '../../stores/modelStore';

export const CloneEngine: React.FC = () => {
    // [Project Synapse] Component is autonomous, connects directly to store.
    const { model, setModel } = useModelStore();
    const { addToast } = useUIStore();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showDNA, setShowDNA] = useState(false);

    const handleBatchAddImages = async (files: File[]) => {
        const valid = files.filter(f => f.type.startsWith('image/'));
        if (!valid.length) return;

        const newImages = await Promise.all(valid.map(file => ImageOptimizer.optimize(file).catch(e => { console.error(e); return null; })));
        const successful = newImages.filter(Boolean) as string[];

        if (successful.length > 0) {
            const combined = [...(model.referenceImages || []), ...successful].slice(0, 5);
            addToast(`Added ${successful.length} face reference(s)`, 'success');
            setModel({ ...model, referenceImages: combined, referenceImage: model.referenceImage || combined[0] });
        }
    };

    const handleAnalyze = async () => {
        if (!model.referenceImages?.length) return addToast("Upload a reference image", "warning");
        setIsAnalyzing(true);
        try {
            // [Project Chimera] Use the unified GenerationService
            const result = await GenerationService.analyze(model.referenceImages);
            setModel({ ...model, ...result });
            setShowDNA(true);
            addToast(`DNA Extracted`, "success");
        } catch (e) { addToast("Analysis Failed", "error"); } finally {
            setIsAnalyzing(false);
        }
    };

    const updateRefImage = (index: number, url: string | null) => {
        const current = [...(model.referenceImages || [])];
        if (url) current[index] = url; else current.splice(index, 1);
        setModel({ ...model, referenceImages: current, referenceImage: index === 0 ? url : model.referenceImage });
    };

    return (
        <div 
            className={`bg-slate-900/40 p-4 rounded-xl border transition-all ${isDragging ? 'border-pink-500' : 'border-white/5'}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); await handleBatchAddImages(Array.from(e.dataTransfer.files)); }}
            onPaste={async (e) => { await handleBatchAddImages(Array.from(e.clipboardData.files)); }}
            data-no-global-drop="true"
        >
            {isDragging && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"><Upload size={32} className="text-pink-500"/></div>}
            
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-blue-400"><ScanFace size={16} /> <span className="text-[10px] font-bold uppercase">Clone Engine</span></div>
                <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="h-6 text-[10px] px-3 bg-blue-600/20 text-blue-300"><Zap size={10} /> Extract DNA</Button>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
                {[...Array(5)].map((_, idx) => <ImageUpload key={idx} label="" value={model.referenceImages?.[idx] || null} onChange={(v) => updateRefImage(idx, v)} compact />)}
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-3">
                <BiometricSlider label={`Identity Lock: ${model.strictness}%`} value={model.strictness} onChange={(v) => setModel({...model, strictness:v})} />
                <div className="pt-2 border-t border-white/5">
                    <button onClick={() => setShowDNA(!showDNA)} className="flex items-center justify-between w-full text-[9px] text-white/40"><span className="flex items-center gap-1"><FileText size={10}/> Synthetic DNA</span><ChevronDown size={10} /></button>
                    {showDNA && <TextArea label="" value={model.syntheticDNA || ""} onChange={(e) => setModel({...model, syntheticDNA:e.target.value})} className="h-24 mt-2 text-[10px] font-mono"/>}
                </div>
                <p className="text-[9px] text-white/40 mt-1 flex items-center gap-1"><Info size={10}/> 0% = Vibe. 100% = Clone. Drop or paste images.</p>
            </div>
        </div>
    );
};
