
import React, { useState, useEffect } from 'react';

interface LoaderProps {
    size?: number;
    className?: string;
    hideText?: boolean;
}

const LOADING_PHRASES = [
    "Reading Biometric Data...",
    "Constructing Wireframe...",
    "Synthesizing Skin Texture...",
    "Calculating Light Paths...",
    "Injecting DNA Sequence...",
    "Finalizing Render..."
];

export const Loader: React.FC<LoaderProps> = ({ size, className, hideText }) => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const isIconMode = typeof size === 'number';
    const shouldHideText = hideText ?? isIconMode;

    const sizeStyle = size ? { width: size, height: size } : undefined;
    const sizeClass = size ? '' : 'w-12 h-12';
    const borderClass = size && size < 20 ? 'border-2' : 'border-4';

    useEffect(() => {
        if (shouldHideText) return;
        const interval = setInterval(() => {
            setPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
        }, 1800); // Cycle phrases
        return () => clearInterval(interval);
    }, [shouldHideText]);

    return (
        <div className={`flex flex-col items-center justify-center ${isIconMode ? '' : 'p-8'} ${className || ''}`}>
            <div className="relative">
                {/* Outer Ring */}
                <div 
                    className={`${sizeClass} ${borderClass} border-slate-800 rounded-full`}
                    style={sizeStyle}
                ></div>
                {/* Spinning Sector */}
                <div 
                    className={`absolute inset-0 ${sizeClass} ${borderClass} border-pink-500 border-t-transparent rounded-full animate-spin`}
                    style={sizeStyle}
                ></div>
                {/* Inner Pulse */}
                {!isIconMode && <div className="absolute inset-0 m-auto w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>}
            </div>
            
            {!shouldHideText && (
                <div className="mt-4 flex flex-col items-center h-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] animate-pulse mb-1">
                        Processing
                    </span>
                    <span className="text-[9px] font-mono text-pink-400/80 transition-opacity duration-300 key={phraseIndex}">
                        {LOADING_PHRASES[phraseIndex]}
                    </span>
                </div>
            )}
        </div>
    );
};
