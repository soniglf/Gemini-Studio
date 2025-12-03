
import React, { useMemo } from 'react';
import { ModelMorphology, Gender } from '../../types';

interface BioMeshProps {
    morphology: ModelMorphology;
    gender: Gender | 'MALE' | 'FEMALE';
    view?: 'FRONT' | 'SIDE' | 'BACK';
    className?: string;
    onPartSelect?: (part: string) => void;
}

// --- PATH DATA (Simplified for schematic look) ---
const MALE_PATHS = {
    head: "M100 20 C 115 20, 120 35, 120 50 C 120 65, 115 80, 100 80 C 85 80, 80 65, 80 50 C 80 35, 85 20, 100 20 Z",
    chest: "M65 110 L135 110 L130 150 C 130 150, 100 160, 70 150 L65 110 Z",
    abs: "M75 150 L125 150 L120 200 L80 200 Z",
    arms: "M40 120 L45 145 L35 180 M160 120 L155 145 L165 180",
    legs: "M75 215 L65 250 L70 340 M125 215 L135 250 L130 340"
};

const FEMALE_PATHS = {
    head: "M100 25 C 113 25, 118 38, 118 50 C 118 62, 113 75, 100 75 C 87 75, 82 62, 82 50 C 82 38, 87 25, 100 25 Z",
    chest: "M75 105 L125 105 L120 145 C 120 145, 100 155, 80 145 L75 105 Z",
    abs: "M80 145 L120 145 L115 190 L85 190 Z",
    arms: "M55 115 L60 135 L50 170 M145 115 L140 135 L150 170",
    legs: "M75 210 L60 245 L65 330 M125 210 L140 245 L135 330"
};

export const BioMeshVisualizer: React.FC<BioMeshProps> = ({ 
    morphology, gender, className 
}) => {
    // Determine active highlight areas
    const highlights = useMemo(() => {
        const muscle = morphology.muscleMass;
        const curves = morphology.hipsWaistRatio;
        const chest = morphology.bustChest;
        
        return {
            chest: Math.max(0.1, chest / 100),
            abs: Math.max(0.1, muscle / 100 * 0.8),
            arms: Math.max(0.1, muscle / 100),
            legs: Math.max(0.1, gender === 'FEMALE' ? curves / 100 : muscle / 100)
        };
    }, [morphology, gender]);

    const paths = gender === 'MALE' ? MALE_PATHS : FEMALE_PATHS;

    const getFill = (intensity: number = 0) => {
        const baseOpacity = 0.2;
        const addedOpacity = intensity * 0.6;
        return gender === 'MALE' 
            ? `rgba(6, 182, 212, ${baseOpacity + addedOpacity})` 
            : `rgba(236, 72, 153, ${baseOpacity + addedOpacity})`;
    };

    // Height & Mass Scaling
    const scaleY = 0.9 + (morphology.height / 100) * 0.2; 
    const scaleX = 0.85 + (morphology.bodyFat / 100) * 0.3;
    const transform = `translate(100, 225) scale(${scaleX}, ${scaleY}) translate(-100, -225)`;

    return (
        <div className={`relative w-full h-full flex items-center justify-center bg-[#030712] overflow-hidden ${className}`}>
             {/* Simple Grid */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                 }} 
            />
            
            <svg viewBox="0 0 200 450" className="h-[90%] w-auto opacity-50">
                <g transform={transform}>
                    {Object.entries(paths).map(([part, d]) => {
                        const intensity = highlights[part as keyof typeof highlights] || 0;
                        return (
                            <path
                                key={part}
                                d={d}
                                fill={getFill(intensity)}
                                stroke="white"
                                strokeWidth="1"
                                strokeOpacity="0.5"
                            />
                        );
                    })}
                </g>
            </svg>
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/20">DNA_VIS_v2</div>
        </div>
    );
};
