
import React, { memo } from 'react';
import { ModelMorphology, Gender } from '../../types';

interface MorphProps {
    morphology: ModelMorphology;
    gender: Gender;
    mode: 'BODY' | 'FACE';
    className?: string;
}

export const MorphologyVisualizer: React.FC<MorphProps> = memo(({ morphology, gender, mode, className }) => {
    const { 
        height, weight, muscle, curves, chest,
        faceWidth, jawLine, cheekbones, eyeSize, noseSize, lipFullness 
    } = morphology;

    // Normalizing values (0-100 to factor)
    const h = (height - 50) / 50; 
    const w = (weight - 50) / 50;
    const m = (muscle - 50) / 50;
    const c = (curves - 50) / 50; // Chest width for male, Hips for female

    if (mode === 'BODY') {
        // BODY PARAMETRIC PATHS
        // We simulate a skeleton and create a hull around it.
        // Simplified SVG logic for visual feedback.
        
        const isMale = gender === 'MALE';
        
        // Base Dimensions
        const shoulderWidth = isMale ? 70 + (m * 20) + (w * 10) : 50 + (m * 10) + (w * 10);
        const hipWidth = isMale ? 45 + (w * 15) : 55 + (c * 25) + (w * 15);
        const waistWidth = isMale ? 45 + (w * 20) : 35 + (w * 20);
        const torsoHeight = 80 + (h * 10);
        
        // Path Construction (Mirror X)
        // Center X is 100.
        
        const pHeadTop = [100, 20];
        const pNeckL = [92, 45];
        const pShoulderL = [100 - (shoulderWidth/2), 55];
        const pArmpitL = [100 - (shoulderWidth/2) + 5, 75];
        const pWaistL = [100 - (waistWidth/2), 55 + (torsoHeight/2)];
        const pHipL = [100 - (hipWidth/2), 55 + torsoHeight];
        const pLegL = [100 - (hipWidth/4), 180 + (h * 20)];
        const pFootL = [90 - (hipWidth/4), 200 + (h * 20)];

        const pathD = `
            M ${pHeadTop[0]} ${pHeadTop[1]}
            C 110 20, 110 40, 108 45
            L 100 45 L ${pNeckL[0]} 45
            L ${pShoulderL[0]} ${pShoulderL[1]}
            Q ${pArmpitL[0] - (m*10)} ${pArmpitL[1]}, ${pArmpitL[0]} ${pArmpitL[1]}
            L ${pWaistL[0]} ${pWaistL[1]}
            Q ${pHipL[0] - (c*5)} ${pHipL[1] - 10}, ${pHipL[0]} ${pHipL[1]}
            L ${pLegL[0]} ${pLegL[1]}
            L ${pFootL[0]} ${pFootL[1]}
            L 100 ${pFootL[1]}
            L 100 200
            
            M ${pHeadTop[0]} ${pHeadTop[1]}
            C 90 20, 90 40, 92 45
            L 100 45 L 108 45
            L ${200 - pShoulderL[0]} ${pShoulderL[1]}
            Q ${200 - (pArmpitL[0] - (m*10))} ${pArmpitL[1]}, ${200 - pArmpitL[0]} ${pArmpitL[1]}
            L ${200 - pWaistL[0]} ${pWaistL[1]}
            Q ${200 - (pHipL[0] - (c*5))} ${pHipL[1] - 10}, ${200 - pHipL[0]} ${pHipL[1]}
            L ${200 - pLegL[0]} ${pLegL[1]}
            L ${200 - pFootL[0]} ${pFootL[1]}
            L 100 ${pFootL[1]}
        `;

        return (
            <div className={`w-full aspect-[1/2] bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center p-4 ${className}`}>
                 <svg viewBox="0 0 200 250" className="h-full drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                    <path d={pathD} fill={isMale ? "#60a5fa" : "#ec4899"} fillOpacity="0.2" stroke={isMale ? "#3b82f6" : "#db2777"} strokeWidth="2" strokeLinecap="round" />
                    {/* Muscle overlay */}
                    {muscle > 60 && (
                        <path d={`M ${pShoulderL[0]} ${pShoulderL[1]} Q ${pShoulderL[0]-5} ${pShoulderL[1]+10} ${pArmpitL[0]} ${pArmpitL[1]}`} stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
                    )}
                 </svg>
            </div>
        );
    } else {
        // FACE PARAMETRIC PATHS
        // Jaw, Cheeks, Eyes
        
        const fW = (faceWidth - 50) / 2; // -25 to 25
        const jS = (jawLine - 50) / 2; // -25 to 25
        const cB = (cheekbones - 50) / 3;
        
        const pChin = [100, 180 + (jS/4)];
        const pJawL = [65 - (fW/2) + (jS/2), 150 - (jS/2)];
        const pCheekL = [60 - (fW), 110 - cB];
        const pTempleL = [65 - (fW/1.5), 80];
        
        // Eyes
        const eS = (eyeSize - 50) / 5;
        const nS = (noseSize - 50) / 4;
        const lF = (lipFullness - 50) / 5;

        const facePath = `
            M 100 20
            C 130 20, 140 50, ${200 - pTempleL[0]} ${pTempleL[1]}
            Q ${200 - pCheekL[0]} ${pCheekL[1]}, ${200 - pJawL[0]} ${pJawL[1]}
            L ${pChin[0]} ${pChin[1]}
            L ${pJawL[0]} ${pJawL[1]}
            Q ${pCheekL[0]} ${pCheekL[1]}, ${pTempleL[0]} ${pTempleL[1]}
            C 60 50, 70 20, 100 20
        `;

        return (
            <div className={`w-full aspect-square bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center p-4 ${className}`}>
                <svg viewBox="0 0 200 200" className="h-full drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                    <path d={facePath} fill="#ec4899" fillOpacity="0.1" stroke="#db2777" strokeWidth="2" />
                    
                    {/* Eyes */}
                    <ellipse cx="70" cy="90" rx={8 + eS} ry={5 + eS} fill="none" stroke="white" strokeWidth="1.5" />
                    <ellipse cx="130" cy="90" rx={8 + eS} ry={5 + eS} fill="none" stroke="white" strokeWidth="1.5" />
                    
                    {/* Nose */}
                    <path d={`M 100 90 L 95 125 L ${100+nS} 130 L 100 90`} fill="none" stroke="white" strokeWidth="1" opacity="0.5"/>
                    
                    {/* Lips */}
                    <path d={`M 80 150 Q 100 ${155 + lF} 120 150 Q 100 ${165 + lF} 80 150`} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="1" />
                </svg>
            </div>
        );
    }
});