import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
             return (
                 <div className="p-8 text-center text-red-400 border border-red-500/20 bg-red-900/10 rounded-xl m-4">
                     <h2>Component Crashed</h2>
                     <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 rounded text-white">Reload App</button>
                 </div>
             );
        }
        return this.props.children;
    }
}