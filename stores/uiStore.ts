
import { create } from 'zustand';
import { AppMode, ToastMessage } from '../types';

interface UIState {
    mode: AppMode;
    toasts: ToastMessage[];
    mobileTab: 'EDITOR' | 'PREVIEW';
    previewTab: 'ASSET' | 'BIO';
    bioFocus: 'BODY' | 'FACE'; // New state for mesh focus
    isPro: boolean;
    isMobile: boolean;
    isSettingsOpen: boolean;
    
    setMode: (mode: AppMode) => void;
    addToast: (msg: string, type?: 'success'|'error'|'info'|'warning') => void;
    removeToast: (id: string) => void;
    setMobileTab: (tab: 'EDITOR' | 'PREVIEW') => void;
    setPreviewTab: (tab: 'ASSET' | 'BIO') => void;
    setBioFocus: (focus: 'BODY' | 'FACE') => void;
    togglePro: () => void;
    setIsMobile: (isMobile: boolean) => void;
    setSettingsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    mode: AppMode.DIRECTOR,
    toasts: [],
    mobileTab: 'EDITOR',
    previewTab: 'ASSET',
    bioFocus: 'BODY',
    isPro: false,
    isMobile: false,
    isSettingsOpen: false,

    setMode: (mode) => set((state) => ({ 
        mode,
        // Auto-switch preview tab based on mode, but default to ASSET for most
        previewTab: mode === AppMode.CREATOR ? 'BIO' : 'ASSET'
    })),
    
    addToast: (message, type = 'info') => {
        const id = Date.now().toString();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, 5000);
    },
    
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
    
    setMobileTab: (tab) => set({ mobileTab: tab }),
    setPreviewTab: (tab) => set({ previewTab: tab }),
    setBioFocus: (focus) => set({ bioFocus: focus }),
    
    togglePro: () => set((state) => ({ isPro: !state.isPro })),
    
    setIsMobile: (isMobile) => set({ isMobile }),

    setSettingsOpen: (open) => set({ isSettingsOpen: open })
}));
