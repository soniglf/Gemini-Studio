import React, { useMemo, useState, memo } from 'react';

// --- TYPES (Integrados para portabilidad inmediata) ---
export type Gender = 'MALE' | 'FEMALE';

export interface ModelMorphology {
    height: number; // 0-100
    weight: number; // 0-100
    muscle: number; // 0-100
    curves: number; // 0-100 (Hip/Waist ratio)
    chest: number;  // 0-100
}

interface BioMeshProps {
    morphology: ModelMorphology;
    gender: Gender;
    className?: string;
    onPartSelect?: (part: string) => void;
}

// --- CONSTANTS & CONFIG ---
const THEME = {
    primary: '#00f3ff',   // Neon Cyan (Cyberpunk)
    secondary: '#00ffc8', // Teal (Medical/Bio)
    alert: '#ff0055',     // Red (Error/Critical)
    gridDim: 'rgba(0, 243, 255, 0.1)',
    gridBright: 'rgba(0, 243, 255, 0.3)',
};

export const BioMeshVisualizer: React.FC<BioMeshProps> = memo(({ 
    morphology, 
    gender, 
    className,
    onPartSelect 
}) => {
    // Fail-safe defaults
    const { height = 50, weight = 50, muscle = 50, curves = 50, chest = 50 } = morphology || {};
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);

    const isMale = gender === 'MALE';

    // --- MATH ENGINE (Normalized 0.0 - 1.0) ---
    // Convertimos los sliders de 0-100 a factores multiplicadores sutiles
    const h = (height - 50) / 100; // -0.5 to 0.5
    const w = (weight - 50) / 100;
    const m = (muscle - 50) / 100;
    const c = (curves - 50) / 100;
    const b = (chest - 50) / 100;

    // --- GEOMETRY GENERATOR ---
    const mesh = useMemo(() => {
        const cx = 100; // Center X Axis
        
        // Vertical Landmarks (Y positions)
        // Escalamos Y basado en altura, pero mantenemos la cabeza fija
        const scaleY = 1 + (h * 0.15);
        
        const yHeadTop = 20;
        const yChin = 55;
        const yNeckBase = 65; 
        const yShoulder = 75 + (isMale ? 0 : 2); // Mujeres hombros un poco más bajos visualmente
        const yChest = 105;
        const yWaist = 145 * scaleY;
        const yPelvis = 175 * scaleY;
        const yKnee = 280 * scaleY;
        const yAnkle = 390 * scaleY;
        const yFoot = 410 * scaleY;

        // Widths (X Offsets) - LA MAGIA OCURRE AQUÍ
        const baseWidth = 1 + (w * 0.4); // Peso afecta ancho global
        
        // Cabeza
        const wHead = 13 * (1 + w * 0.1);
        
        // Cuello (Músculo afecta grosor)
        const wNeck = (isMale ? 12 : 9) + (m * 8) + (w * 5);
        
        // Hombros (Dimorfismo sexual clave)
        const wShoulder = (isMale ? 48 : 36) + (m * 15) + (w * 5);
        
        // Pecho/Dorsal
        // Hombres: Dorsal ancho (V-Taper). Mujeres: Pecho más estrecho estructuralmente.
        const wChest = (isMale ? 36 : 30) + (m * 12) + (w * 10) + (b * 5);
        
        // Cintura
        // Hombres: Recta o ancha por peso. Mujeres: Estrecha (Reloj de arena).
        const wWaist = (isMale ? 28 : 21) + (w * 25) - (isMale ? 0 : (c * 5)); 
        
        // Caderas
        const wHip = (isMale ? 30 : 38) + (w * 15) + (c * 15);
        
        // Muslos
        const wThigh = (isMale ? 16 : 18) + (m * 10) + (w * 12);
        const wKnee = 11 * baseWidth;
        const wCalf = (isMale ? 13 : 12) + (m * 8);
        const wAnkle = 8 * baseWidth;

        // --- PATH CONSTRUCTION (SVG Commands) ---
        // 'M' = Move to, 'L' = Line to, 'Q' = Quadratic Bezier (ControlPoint, EndPoint)

        // 1. HEAD (Hex Mesh)
        const headPath = `
            M ${cx - wHead*0.7} ${yHeadTop} 
            L ${cx + wHead*0.7} ${yHeadTop} 
            L ${cx + wHead} ${yHeadTop + 15}
            L ${cx + wHead*0.8} ${yChin - 5}
            L ${cx} ${yChin}
            L ${cx - wHead*0.8} ${yChin - 5}
            L ${cx - wHead} ${yHeadTop + 15}
            Z
        `;
        const headWire = `M ${cx} ${yHeadTop} L ${cx} ${yChin} M ${cx - wHead} ${yHeadTop + 18} L ${cx + wHead} ${yHeadTop + 18}`;

        // 2. TORSO (Organic V2.0)
        // Corrección del "Cuello Flotante": Usamos Trapecios
        const trapSlope = isMale ? 5 : 8; // Pendiente del trapecio
        
        const torsoPath = `
            M ${cx - wNeck} ${yNeckBase}
            // Trapecio Izq
            L ${cx - wNeck - 2} ${yNeckBase + 2} 
            L ${cx - wShoulder + 5} ${yShoulder - trapSlope} 
            L ${cx - wShoulder} ${yShoulder}
            
            // Lado Izq (Curvas)
            // De Hombro a Pecho (Dorsal curve)
            Q ${cx - wChest - (m*5)} ${yChest - 10} ${cx - wChest} ${yChest}
            // De Pecho a Cintura (V-Taper o Hourglass)
            Q ${cx - wWaist - (isMale ? 2 : 5)} ${yChest + 20} ${cx - wWaist} ${yWaist}
            // De Cintura a Cadera (Curva Pélvica)
            Q ${cx - wHip * 0.9} ${yWaist + 15} ${cx - wHip} ${yPelvis}
            
            // Cierre Inferior (Ingle)
            L ${cx} ${yPelvis + 15}
            
            // Lado Der (Espejo)
            L ${cx + wHip} ${yPelvis}
            Q ${cx + wHip * 0.9} ${yWaist + 15} ${cx + wWaist} ${yWaist}
            Q ${cx + wWaist + (isMale ? 2 : 5)} ${yChest + 20} ${cx + wChest} ${yChest}
            Q ${cx + wChest + (m*5)} ${yChest - 10} ${cx + wShoulder} ${yShoulder}
            
            // Trapecio Der
            L ${cx + wShoulder - 5} ${yShoulder - trapSlope}
            L ${cx + wNeck + 2} ${yNeckBase + 2}
            L ${cx + wNeck} ${yNeckBase}
            Z
        `;

        // 3. ARMS (Muscle Definition)
        const armL = `
            M ${cx - wShoulder} ${yShoulder} 
            // Deltoides/Bicep curve
            Q ${cx - wShoulder - 15 - (m*10)} ${yShoulder + 35} ${cx - wShoulder - 8} ${yWaist - 10}
            // Antebrazo
            L ${cx - wShoulder - 12} ${yWaist + 40} 
            L ${cx - wChest} ${yChest + 10} 
            Z
        `;
        const armR = `
            M ${cx + wShoulder} ${yShoulder} 
            Q ${cx + wShoulder + 15 + (m*10)} ${yShoulder + 35} ${cx + wShoulder + 8} ${yWaist - 10}
            L ${cx + wShoulder + 12} ${yWaist + 40} 
            L ${cx + wChest} ${yChest + 10} 
            Z
        `;

        // 4. LEGS (Athletic Stance)
        const legL = `
            M ${cx - wHip*0.8} ${yPelvis + 5} 
            // Muslo exterior (Curve)
            Q ${cx - wThigh - 5} ${yPelvis + 40} ${cx - wKnee} ${yKnee} 
            // Pantorrilla exterior (Curve)
            Q ${cx - wCalf - 5} ${yKnee + 50} ${cx - wAnkle} ${yAnkle} 
            L ${cx - wAnkle - 5} ${yFoot}
            L ${cx - 5} ${yFoot} 
            // Interior Pierna
            L ${cx - 2} ${yPelvis + 15} 
            Z
        `;
        const legR = `
            M ${cx + wHip*0.8} ${yPelvis + 5} 
            Q ${cx + wThigh + 5} ${yPelvis + 40} ${cx + wKnee} ${yKnee} 
            Q ${cx + wCalf + 5} ${yKnee + 50} ${cx + wAnkle} ${yAnkle} 
            L ${cx + wAnkle + 5} ${yFoot}
            L ${cx + 5} ${yFoot} 
            L ${cx + 2} ${yPelvis + 15} 
            Z
        `;

        // Tactical Joints
        const joints = [
            { x: cx, y: yNeckBase, id: 'spine-c1' },
            { x: cx - wShoulder, y: yShoulder, id: 'sh-l' },
            { x: cx + wShoulder, y: yShoulder, id: 'sh-r' },
            { x: cx, y: yWaist, id: 'spine-l3' },
            { x: cx - wKnee + 4, y: yKnee, id: 'kn-l' },
            { x: cx + wKnee - 4, y: yKnee, id: 'kn-r' },
        ];

        return { 
            head: { path: headPath, wire: headWire },
            torso: { path: torsoPath, wire: '' },
            armL: { path: armL, wire: '' },
            armR: { path: armR, wire: '' },
            legL: { path: legL, wire: '' },
            legR: { path: legR, wire: '' },
            joints
        };
    }, [h, w, m, c, b, isMale]);

    // --- INTERACTION HANDLER ---
    const handleClick = (partId: string) => {
        if (onPartSelect) onPartSelect(partId);
    };

    return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center font-mono select-none ${className}`}>
            
            {/* 1. BACKGROUND GRID (CSS Generated for performance) */}
            <div className="absolute inset-0 z-0 pointer-events-none" 
                 style={{ 
                     backgroundImage: `
                        linear-gradient(${THEME.gridDim} 1px, transparent 1px), 
                        linear-gradient(90deg, ${THEME.gridDim} 1px, transparent 1px)
                     `,
                     backgroundSize: '40px 40px',
                     opacity: 0.4
                 }} 
            />

            {/* 2. MAIN SVG RENDERER */}
            <svg 
                viewBox="0 0 200 450" 
                className="w-full h-full max-w-[400px] z-10"
                style={{ filter: `drop-shadow(0 0 8px ${THEME.gridDim})` }}
            >
                <defs>
                    {/* Pattern de Rejilla Técnica para el relleno */}
                    <pattern id="bioGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                        <path d="M 6 0 L 0 0 0 6" fill="none" stroke={THEME.primary} strokeWidth="0.5" opacity="0.15"/>
                    </pattern>
                    
                    {/* Gradiente de Escaneo */}
                    <linearGradient id="scannerBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={THEME.primary} stopOpacity="0" />
                        <stop offset="50%" stopColor={THEME.primary} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={THEME.primary} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* --- BODY MESH --- */}
                <g id="biomesh-group">
                    {Object.entries(mesh).map(([key, data]) => {
                        if (key === 'joints') return null;
                        const part = data as { path: string, wire: string };
                        const isHovered = hoveredPart === key;

                        return (
                            <g key={key} 
                               onMouseEnter={() => setHoveredPart(key)}
                               onMouseLeave={() => setHoveredPart(null)}
                               onClick={() => handleClick(key)}
                               className="cursor-pointer transition-all duration-300 ease-out"
                               style={{ transformOrigin: 'center' }}
                            >
                                {/* MAIN SHAPE */}
                                <path 
                                    d={part.path} 
                                    fill={isHovered ? `rgba(0, 243, 255, 0.2)` : "url(#bioGrid)"}
                                    stroke={isHovered ? "#fff" : THEME.primary}
                                    strokeWidth={isHovered ? 1.5 : 0.8}
                                    strokeLinejoin="round"
                                />
                                
                                {/* WIREFRAME DETAIL (Solo si existe) */}
                                {part.wire && (
                                    <path d={part.wire} fill="none" stroke={THEME.primary} strokeWidth="0.5" opacity="0.6"/>
                                )}
                            </g>
                        );
                    })}
                </g>

                {/* --- TACTICAL NODES (JOINTS) --- */}
                <g id="joints-layer" className="pointer-events-none">
                    {mesh.joints.map((j, i) => (
                        <g key={i}>
                            <circle cx={j.x} cy={j.y} r={2.5} fill="#050505" stroke={THEME.primary} strokeWidth="1" />
                            {hoveredPart && (
                                <circle cx={j.x} cy={j.y} r={4} fill="none" stroke={THEME.secondary} strokeWidth="0.5" opacity="0.5">
                                    <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
                                </circle>
                            )}
                        </g>
                    ))}
                </g>

                {/* --- ANIMATED SCANNER BAR --- */}
                <rect x="-20" y="0" width="240" height="15" fill="url(#scannerBeam)" opacity="0.6" pointerEvents="none">
                    <animate attributeName="y" values="-20;460;-20" dur="6s" repeatCount="indefinite" keyTimes="0;0.5;1" />
                </rect>

            </svg>

            {/* 3. HUD OVERLAY (Tech UI Text) */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                <div className="text-[10px] text-[#00f3ff] opacity-80 font-bold tracking-wider space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse"></span>
                        SYSTEM: ONLINE
                    </div>
                    <div>CLASS: {gender}</div>
                    <div>SECTOR: {hoveredPart ? hoveredPart.toUpperCase() : 'IDLE'}</div>
                </div>
                
                {/* Random Data Block Decoration */}
                <div className="text-[9px] text-[#00ffc8] opacity-50 text-right space-y-0.5 font-mono">
                    <div>x_COORD: {(100 + w * 100).toFixed(2)}</div>
                    <div>y_COORD: {(200 + h * 100).toFixed(2)}</div>
                    <div>MSH_DNSTY: 100%</div>
                </div>
            </div>

        </div>
    );
});

export default BioMeshVisualizer;