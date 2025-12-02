import React, { memo, useState, useEffect } from 'react';
import { Button, VisualGridSelect } from '../../components/UI';
import { Power, Activity, Signal } from 'lucide-react';
import { LiveService } from '../../services/ai/liveService';
import { useTranslation } from '../../contexts/LanguageContext';
import { OPTIONS } from '../../data/constants';
import { useUIStore } from '../../stores/uiStore';

// Initialize service singleton
const liveService = new LiveService();

export const LiveWorkspace = memo(() => {
    const { t } = useTranslation();
    const { addToast } = useUIStore();
    const [isConnected, setIsConnected] = useState(false);
    const [volume, setVolume] = useState(0);
    const [selectedVoice, setSelectedVoice] = useState(OPTIONS.voices[0]);
    const [status, setStatus] = useState("Ready to Connect");

    useEffect(() => {
        return () => {
            liveService.disconnect();
        };
    }, []);

    const toggleConnection = async () => {
        if (isConnected) {
            await liveService.disconnect();
            setIsConnected(false);
            setVolume(0);
            setStatus("Disconnected");
        } else {
            setStatus("Connecting...");
            try {
                await liveService.connect({
                    voiceName: selectedVoice,
                    systemInstruction: "You are a professional creative director assisting with a photoshoot campaign. Be concise, professional, and artistic."
                }, (vol) => setVolume(vol));
                setIsConnected(true);
                setStatus("Live Session Active");
            } catch (e: any) {
                console.error(e);
                setStatus("Connection Failed");
                addToast("Connection failed: " + e.message, 'error');
                setIsConnected(false);
            }
        }
    };

    const voiceOptions = OPTIONS.voices.map(v => ({ value: v, label: v }));
    const scale = 1 + (volume / 200);

    return (
        <div className="h-full flex flex-col items-center justify-center relative pb-32 animate-in fade-in space-y-12">
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs font-mono text-pink-500/50 uppercase tracking-widest">
                <span>FREQ: 16K/24K</span>
                <span className="flex items-center gap-2">
                    <Signal size={12} className={isConnected ? "text-emerald-400 animate-pulse" : "text-slate-600"}/>
                    {status}
                </span>
            </div>

            <div className="relative group">
                <div 
                    className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center transition-all duration-75 ease-out"
                    style={{
                        boxShadow: isConnected 
                            ? `0 0 ${volume}px ${volume/2}px rgba(236, 72, 153, 0.2)` 
                            : 'none'
                    }}
                >
                    <div 
                        className="w-48 h-48 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center transition-transform duration-75 ease-linear"
                        style={{ transform: `scale(${scale})` }}
                    >
                        <div className={`transition-colors duration-500 ${isConnected ? 'text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]' : 'text-slate-700'}`}>
                             <Activity size={64} strokeWidth={1} />
                        </div>
                    </div>
                </div>

                {isConnected && (
                    <>
                        <div className="absolute inset-0 border border-pink-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-4 border border-blue-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                    </>
                )}
            </div>

            <div className="w-full max-w-sm space-y-6 z-10">
                <div className="bg-[#0B1121]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="mb-6">
                        <VisualGridSelect 
                            label="Voice Persona" 
                            value={selectedVoice} 
                            options={voiceOptions} 
                            onChange={(e: any) => setSelectedVoice(e.target.value)} 
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            onClick={toggleConnection} 
                            className={`flex-1 h-12 text-xs ${isConnected ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' : 'bg-pink-600 hover:bg-pink-500'}`}
                        >
                            <Power size={16} className="mr-2" />
                            {isConnected ? 'DISCONNECT' : 'INITIALIZE UPLINK'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});