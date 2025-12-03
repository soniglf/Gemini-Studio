
import { create } from 'zustand';
import { AppMode, ToastMessage } from '../types';

interface UIState {
    mode: AppMode;
    toasts: ToastMessage[];
    mobileTab: 'EDITOR' | 'PREVIEW';
    previewTab: 'ASSET' | 'BIO';
    bioFocus: 'BODY' | 'FACE' | 'BIO'; 
    isPro: boolean;
    isMobile: boolean;
    isPreviewCollapsed: boolean;
    isSidebarOpen: boolean;
    
    setMode: (mode: AppMode) => void;
    addToast: (msg: string, type?: 'success'|'error'|'info'|'warning') => void;
    removeToast: (id: string) => void;
    setMobileTab: (tab: 'EDITOR' | 'PREVIEW') => void;
    setPreviewTab: (tab: 'ASSET' | 'BIO') => void;
    setBioFocus: (focus: 'BODY' | 'FACE' | 'BIO') => void;
    togglePro: () => void;
    setIsMobile: (isMobile: boolean) => void;
    togglePreviewCollapse: () => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    mode: AppMode.DIRECTOR,
    toasts: [],
    mobileTab: 'EDITOR',
    previewTab: 'ASSET',
    bioFocus: 'BODY',
    isPro: false,
    isMobile: false,
    isPreviewCollapsed: false,
    isSidebarOpen: false,

    setMode: (mode) => set((state) => ({ 
        mode,
        previewTab: mode === AppMode.CREATOR ? 'BIO' : 'ASSET',
        isSidebarOpen: false // Auto-close on mobile nav
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
    
    togglePreviewCollapse: () => set((state) => ({ isPreviewCollapsed: !state.isPreviewCollapsed })),
    
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open })
}));
