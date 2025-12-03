
import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { AppMode } from '../../types';

interface HealthStatusBannerProps {
    status: 'WARNING' | 'CRITICAL';
    message: string;
}

export const HealthStatusBanner: React.FC<HealthStatusBannerProps> = ({ status, message }) => {
    const { setMode } = useUIStore();

    const isCritical = status === 'CRITICAL';
    const bgColor = isCritical ? 'bg-red-500/80 border-red-400/50' : 'bg-amber-500/80 border-amber-400/50';
    const Icon = isCritical ? ShieldAlert : AlertTriangle;

    const handleNavigate = () => {
        if (message.includes('database')) {
            if(confirm("This will clear all local data to fix the database. Are you sure?")) {
                localStorage.clear();
                window.location.reload();
            }
        } else {
            setMode(AppMode.BILLING);
        }
    };

    return (
        <div className={`fixed top-0 left-0 right-0 z-[101] p-3 text-white text-xs font-bold text-center backdrop-blur-md border-b ${bgColor}`}>
            <div className="flex items-center justify-center gap-4">
                <Icon size={16} />
                <span>{message}</span>
                <button 
                    onClick={handleNavigate}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-bold"
                >
                    {message.includes('database') ? 'Reset System' : 'Go to Settings'}
                </button>
            </div>
        </div>
    );
};
