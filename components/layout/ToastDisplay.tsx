import React from 'react';
import { ToastMessage } from '../../types';

export const ToastDisplay: React.FC<{ toasts: ToastMessage[], remove: (id:string)=>void }> = ({ toasts, remove }) => (
    <div className="fixed bottom-36 md:bottom-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} onClick={() => remove(t.id)} className={`pointer-events-auto p-4 rounded-lg shadow-xl backdrop-blur-md border border-white/10 text-white w-64 animate-in slide-in-from-right ${t.type === 'error' ? 'bg-red-500/80' : 'bg-slate-800/80'}`}>
                <span className="text-xs font-bold">{t.message}</span>
            </div>
        ))}
    </div>
);