
import React, { useRef, useEffect, useState, memo } from 'react';
import { Eraser, Paintbrush } from 'lucide-react';

interface CanvasMaskProps {
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    onMaskChange: (blob: Blob | null) => void;
    brushSize?: number;
    clearSignal?: number;
}

export const CanvasMask: React.FC<CanvasMaskProps> = memo(({ 
    width, 
    height, 
    originalWidth, 
    originalHeight, 
    onMaskChange, 
    brushSize = 20, 
    clearSignal 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [mode, setMode] = useState<'DRAW' | 'ERASE'>('DRAW');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // This is the display resolution
        canvas.width = width;
        canvas.height = height;
        
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
        }
    }, [width, height]);

    useEffect(() => {
        if (ctx) {
            ctx.clearRect(0, 0, width, height);
            onMaskChange(null);
        }
    }, [clearSignal]);

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!ctx) return;
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !ctx) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        // Adjust brush size relative to display size to feel consistent
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = mode === 'ERASE' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)'; // Semantic Pink 50% - Visual Feedback only
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDraw = () => {
        if (!isDrawing || !ctx || !canvasRef.current) return;
        setIsDrawing(false);
        ctx.closePath();
        exportMask();
    };

    const exportMask = () => {
        if (!canvasRef.current) return;

        // CREATE OFFSCREEN CANVAS FOR HIGH-RES OUTPUT
        const offscreen = document.createElement('canvas');
        offscreen.width = originalWidth;
        offscreen.height = originalHeight;
        const offCtx = offscreen.getContext('2d');
        
        if (!offCtx) return;

        // Fill black (transparent part of mask for Gemini) 
        // Note: Gemini interprets White as "Edit this" and Black/Transparent as "Keep this".
        // Our canvas has transparent background. 
        // We need to ensure we strictly render the mask layer.
        
        // Draw the Display Canvas scaled up to the Original Size
        // We use drawImage which handles the interpolation.
        // For a brush mask, linear interpolation is acceptable.
        
        // Important: The UI draws in semi-transparent pink for user feedback.
        // The API needs a solid mask (usually white on black).
        // So we need to process the image data or redraw.
        
        // Strategy: 
        // 1. Draw the UI canvas onto offscreen.
        // 2. Use composite operation to turn all non-transparent pixels to Pure White.
        
        offCtx.drawImage(canvasRef.current, 0, 0, originalWidth, originalHeight);
        
        // Turn pixels White
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = 'white';
        offCtx.fillRect(0, 0, originalWidth, originalHeight);

        // Export
        offscreen.toBlob((blob) => {
            onMaskChange(blob);
        }, 'image/png');
    };

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    return (
        <div className="absolute inset-0 z-50 touch-none">
            <canvas 
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
            />
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-xl pointer-events-auto">
                 <button onClick={() => setMode('DRAW')} className={`p-2 rounded-full transition-all ${mode === 'DRAW' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-white/50 hover:bg-white/10'}`}>
                     <Paintbrush size={16} />
                 </button>
                 <button onClick={() => setMode('ERASE')} className={`p-2 rounded-full transition-all ${mode === 'ERASE' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-white/50 hover:bg-white/10'}`}>
                     <Eraser size={16} />
                 </button>
            </div>
        </div>
    );
});
