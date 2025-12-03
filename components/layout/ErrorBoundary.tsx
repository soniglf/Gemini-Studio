
import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    handleReset = () => {
        // Factory Reset: Clear potentially corrupt state
        localStorage.removeItem('gemini-generation-store');
        localStorage.removeItem('gemini-director-store');
        localStorage.removeItem('gemini-presets');
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
             return (
                 <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
                     <div className="max-w-md w-full bg-slate-900/50 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
                         <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                             <AlertTriangle size={32} className="text-red-500" />
                         </div>
                         <h2 className="text-2xl font-bold text-white mb-2">Critical Failure</h2>
                         <p className="text-sm text-white/50 mb-6">
                             The application encountered an unrecoverable error. This usually happens due to browser storage limits or network issues.
                         </p>
                         
                         <div className="bg-black/40 rounded-lg p-4 mb-6 text-left border border-white/5 overflow-hidden">
                             <code className="text-[10px] font-mono text-red-300 break-words block">
                                 {this.state.error?.message || "Unknown Error"}
                             </code>
                         </div>

                         <div className="flex gap-3">
                             <button 
                                onClick={() => window.location.reload()} 
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                             >
                                 <RefreshCcw size={14}/> Reload App
                             </button>
                             <button 
                                onClick={this.handleReset} 
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20"
                             >
                                 <Trash2 size={14}/> System Reset
                             </button>
                         </div>
                         <p className="text-[9px] text-white/20 mt-4">System Reset clears local settings to fix corruption.</p>
                     </div>
                 </div>
             );
        }
        return (this as any).props.children;
    }
}
