import React, { useState, useEffect, ReactNode } from 'react';
import { StateHydrator } from '../../services/stateHydrator';
import { Sparkles } from 'lucide-react';

export const Bootloader: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBooted, setIsBooted] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const boot = async () => {
            try {
                await StateHydrator.bootApp();
                // A small delay to make the transition feel smoother
                setTimeout(() => setIsBooted(true), 500);
            } catch (e) {
                setError(e instanceof Error ? e : new Error("Unknown boot error"));
            }
        };
        boot();
    }, []);

    if (error) {
        // This can be a more designed error screen if needed
        return (
            <div className="w-screen h-screen flex items-center justify-center text-center text-red-400 p-4">
                <div>
                    <h1 className="text-xl font-bold mb-2">Fatal Boot Error</h1>
                    <p className="text-sm text-red-300/70">{error.message}</p>
                </div>
            </div>
        );
    }
    
    if (!isBooted) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center gap-4 bg-[#020617]">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.5)] animate-pulse">
                    <Sparkles size={32} className="text-white fill-current" />
                </div>
                <div className="text-center">
                    <h1 className="font-black text-2xl tracking-widest text-white brand-font">GEMINI STUDIO</h1>
                    <p className="text-[10px] font-mono text-pink-400/80 animate-pulse">Initializing State Hydration...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};