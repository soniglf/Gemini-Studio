
import React, { memo } from 'react';
import { ModelMorphology, Gender } from '../../types';

interface MorphProps {
    morphology: ModelMorphology;
    gender: Gender;
    mode: 'BODY' | 'FACE';
    className?: string;
}

export const MorphologyVisualizer: React.FC<MorphProps> = memo(({ morphology, gender, mode, className }) => {
    // Mapping for SVG rendering
    const height = morphology.height;
    const weight = morphology.bodyFat; 
    const muscle = morphology.muscleMass;
    const curves = morphology.hipsWaistRatio;
    
    // Normalizing values (0-100 to factor)
    const h = (height - 50) / 50; 
    const w = (weight - 50) / 50;
    const m = (muscle - 50) / 50;
    const c = (curves - 50) / 50; 

    // Simple placeholder SVG to prevent crash if still used somewhere
    return (
         <div className={`w-full aspect-[1/2] bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center p-4 ${className}`}>
             <svg viewBox="0 0 200 250" className="h-full opacity-30">
                <rect x="80" y="50" width="40" height="150" fill="white" />
             </svg>
        </div>
    );
});
