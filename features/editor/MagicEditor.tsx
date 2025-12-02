
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CanvasMask } from '../../components/ui/CanvasMask';
import { Button } from '../../components/UI';
import { Wand2, X, Eraser, Paintbrush } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { GeneratedAsset, GenerationResult } from '../../types';

interface MagicEditorProps {
    asset: GeneratedAsset | GenerationResult;
    onApply: (mask: Blob, prompt: string) => void;
    onCancel: () => void;
}

export const MagicEditor: React.FC<MagicEditorProps> = ({ asset, onApply, onCancel }) => {
    const { t } = useTranslation();
    const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
    const [prompt, setPrompt] = useState("");
    const [clearSignal, setClearSignal] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    
    // Exact dimensions of the rendered image on screen (for UI canvas)
    const [displayDims, setDisplayDims] = useState({ w: 0, h: 0, top: 0, left: 0 });
    // Exact dimensions of the source image file (for Output mask)
    const [naturalDims, setNaturalDims] = useState({ w: 0, h: 0 });

    const updateDimensions = useCallback(() => {
        if (containerRef.current && imgRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            const img = imgRef.current.getBoundingClientRect();

            // Calculate image position relative to container
            setDisplayDims({
                w: img.width,
                h: img.height,
                top: img.top - container.top,
                left: img.left - container.left
            });
            
            setNaturalDims({
                w: imgRef.current.naturalWidth,
                h: imgRef.current.naturalHeight
            });
        }
    }, []);

    useEffect(() => {
        // Initial check
        const timer = setTimeout(updateDimensions, 100);
        
        window.addEventListener('resize', updateDimensions);
        
        // Robust ResizeObserver for container
        const ro = new ResizeObserver(() => {
            requestAnimationFrame(updateDimensions);
        });
        
        if (containerRef.current) ro.observe(containerRef.current);
        if (imgRef.current) ro.observe(imgRef.current);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateDimensions);
            ro.disconnect();
        };
    }, [updateDimensions]);

    const handleApply = () => {
        if(maskBlob && prompt) onApply(maskBlob, prompt);
    };

    return (
        <div className="relative w-full h-full flex flex-col group bg-[#0f172a] overflow-hidden" ref={containerRef}>
            {/* Image Layer */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                 <img 
                    ref={imgRef}
                    src={asset.url} 
                    className="max-w-full max-h-full object-contain shadow-2xl" 
                    alt="Editing target"
                    onLoad={updateDimensions}
                 />
            </div>

            {/* Mask Layer - Constrained EXACTLY to image bounds */}
            {displayDims.w > 0 && naturalDims.w > 0 && (
                <div 
                    className="absolute z-40"
                    style={{
                        width: displayDims.w,
                        height: displayDims.h,
                        top: displayDims.top,
                        left: displayDims.left
                    }}
                >
                    <CanvasMask 
                        width={displayDims.w} 
                        height={displayDims.h}
                        originalWidth={naturalDims.w}
                        originalHeight={naturalDims.h}
                        onMaskChange={setMaskBlob}
                        clearSignal={clearSignal}
                    />
                </div>
            )}
            
            {/* UI Overlay - Top Badge */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
                 <div className="bg-pink-600 text-white px-6 py-1.5 rounded-full text-xs font-bold shadow-xl border border-pink-400/50 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <Wand2 size={12} className="text-white" />
                    {t('EDT_MODE')}
                 </div>
            </div>

            {/* UI Overlay - Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#030712]/90 backdrop-blur-xl border-t border-white/10 p-4 z-[60] flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between text-pink-400 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('EDT_INSTRUCTION')}</span>
                    <button onClick={() => setClearSignal(p => p+1)} className="text-[10px] hover:text-white transition-colors flex items-center gap-1">
                        <Eraser size={12}/> {t('EDT_CLEAR')}
                    </button>
                </div>
                <div className="flex gap-2">
                    <input 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('EDT_PLACEHOLDER')}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all font-light"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && maskBlob && prompt.trim() && handleApply()}
                    />
                    <Button onClick={handleApply} disabled={!maskBlob || !prompt.trim()} className="px-6 bg-gradient-to-r from-pink-600 to-purple-600">
                        <Wand2 size={18} />
                    </Button>
                    <Button variant="secondary" onClick={onCancel} className="px-4">
                        <X size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
