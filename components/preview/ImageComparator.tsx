
import React, { useState, useRef, useEffect } from 'react';
import { Columns } from 'lucide-react';

interface ImageComparatorProps {
    originalSrc: string;
    modifiedSrc: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ originalSrc, modifiedSrc }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            setSliderPos(percentage);
        }
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) handleMove(e.clientX);
    };
    
    // Touch support
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging) handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full select-none cursor-col-resize overflow-hidden"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            {/* Modified Image (Background) */}
            <img src={modifiedSrc} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            
            {/* Original Image (Foreground, clipped) */}
            <div 
                className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-pink-500"
                style={{ width: `${sliderPos}%` }}
            >
                <img src={originalSrc} className="absolute inset-0 w-full h-full object-contain max-w-none" style={{ width: containerRef.current?.clientWidth }} />
            </div>

            {/* Slider Handle */}
            <div 
                className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="w-8 h-8 rounded-full bg-pink-500 shadow-xl flex items-center justify-center border border-white">
                    <Columns size={14} className="text-white" />
                </div>
            </div>
            
            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-[10px] font-bold text-white pointer-events-none">ORIGINAL</div>
            <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-[10px] font-bold text-pink-400 pointer-events-none">RESULT</div>
        </div>
    );
};
