
import React, { useEffect } from 'react';
import { AppMode, GeneratedAsset } from './types';
import { Sidebar, ToastDisplay, ErrorBoundary, HealthStatusBanner, Bootloader } from './components/Layout';
import { PreviewPanel, FloatingPreview } from './components/layout/PreviewPanel';
import { DragDropZone } from './components/layout/DragDropZone';
import { CommandPalette } from './components/layout/CommandPalette';
import { PromptReviewModal } from './components/layout/PromptReviewModal';
import { ProjectSettingsModal } from './components/modals/ProjectSettingsModal';
import { CreatorWorkspace, StudioWorkspace, InfluencerWorkspace, BillingWorkspace, MotionWorkspace, GalleryWorkspace, DirectorWorkspace } from './features/Workspaces';
import { useTranslation } from './contexts/LanguageContext';
import { ToggleLeft, ToggleRight, Sparkles, Layout, Menu } from 'lucide-react';
import { useUIStore } from './stores/uiStore';
import { useGenerationStore } from './stores/generationStore';
import { useSystemHealth } from './hooks/useSystemHealth';
import { TaskRunner } from './components/layout/TaskRunner';
import { MODE_COLORS } from './data/theme';

export default function App() {
  return (
    <ErrorBoundary>
        <Bootloader>
            <DragDropZone>
                <MainApp />
                <CommandPalette />
                <PromptReviewModal />
                <ProjectSettingsModal />
            </DragDropZone>
        </Bootloader>
    </ErrorBoundary>
  );
}

function MainApp() {
  const { t } = useTranslation();
  const { mode, mobileTab, isPro, isMobile, toasts, setMobileTab, togglePro, removeToast, setIsMobile, isPreviewCollapsed, togglePreviewCollapse, toggleSidebar } = useUIStore();
  const { isGenerating, setLastGenerated } = useGenerationStore();
  const health = useSystemHealth();

  // Initialization (Mobile check)
  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 1024);
    chk(); window.addEventListener('resize', chk);
    return () => window.removeEventListener('resize', chk);
  }, [setIsMobile]);

  // Auto-switch mobile tabs
  useEffect(() => { 
      if(isGenerating && isMobile) setMobileTab('PREVIEW'); 
  }, [isGenerating, isMobile, setMobileTab]);

  const handleAssetSelect = (asset: GeneratedAsset) => {
      setLastGenerated(asset);
  };

  // --- REACTIVE ATMOSPHERE ENGINE ---
  useEffect(() => {
      const colors = MODE_COLORS[mode] || MODE_COLORS[AppMode.CREATOR];
      const root = document.documentElement;
      root.style.setProperty('--neon-primary', colors.primary);
      root.style.setProperty('--neon-secondary', colors.secondary);
  }, [mode]);

  return (
    <div className="flex h-screen bg-transparent text-white font-sans overflow-hidden relative">
      {health.status !== 'OK' && <HealthStatusBanner status={health.status} message={health.message!} />}
      <ToastDisplay toasts={toasts} remove={removeToast} />
      <TaskRunner />

      <Sidebar />

      <main className="flex-1 flex flex-col lg:flex-row relative z-10 h-full overflow-hidden min-w-0">
        {isMobile && (
            <div className="h-16 flex items-center justify-between px-4 bg-[#030712]/95 backdrop-blur border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={toggleSidebar} className="p-1 text-white/70 hover:text-white">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-[var(--neon-primary)]" size={18}/>
                        <span className="font-bold text-lg tracking-widest text-white">GEMINI</span>
                    </div>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1"><button onClick={() => setMobileTab('EDITOR')} className={`p-2 rounded-md ${mobileTab === 'EDITOR' ? 'bg-[var(--neon-primary)]' : 'text-slate-400'}`}>Edit</button><button onClick={() => setMobileTab('PREVIEW')} className={`p-2 rounded-md ${mobileTab === 'PREVIEW' ? 'bg-[var(--neon-primary)]' : 'text-slate-400'}`}>View</button></div>
            </div>
        )}

        <div 
            className={`
                h-full flex flex-col border-r border-white/5 bg-slate-900/70 backdrop-blur-xl transition-all duration-300 ease-in-out min-w-0
                ${isMobile && mobileTab !== 'EDITOR' ? 'hidden' : 'flex'}
                ${isPreviewCollapsed ? 'flex-1 w-full max-w-none' : 'flex-1 lg:max-w-lg xl:max-w-xl'}
            `}
        >
            <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold cyber-font tracking-wider" data-testid="app-mode-header">{t(`NAV_${mode}`)}</h2>
                    {/* Redundant Layout Toggle for when Preview is collapsed */}
                    {isPreviewCollapsed && !isMobile && (
                        <button 
                            onClick={togglePreviewCollapse}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all animate-in fade-in"
                            title="Restore Preview Panel"
                        >
                            <Layout size={16} />
                            <span className="text-[10px] font-bold uppercase">Show Preview</span>
                        </button>
                    )}
                </div>
                
                {mode !== AppMode.BILLING && mode !== AppMode.GALLERY && mode !== AppMode.DIRECTOR && <button onClick={togglePro} className="text-[10px] uppercase font-bold flex items-center gap-2 text-slate-400">{isPro ? t("LBL_PRO_MODE") : "Simple"} {isPro ? <ToggleRight className="text-[var(--neon-primary)]"/> : <ToggleLeft/>}</button>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-32">
                <ErrorBoundary>
                    {mode === AppMode.CREATOR && <CreatorWorkspace />}
                    {mode === AppMode.STUDIO && <StudioWorkspace />}
                    {mode === AppMode.INFLUENCER && <InfluencerWorkspace />}
                    {mode === AppMode.MOTION && <MotionWorkspace />}
                    {mode === AppMode.BILLING && <BillingWorkspace />}
                    {mode === AppMode.GALLERY && <GalleryWorkspace onSelect={handleAssetSelect} />}
                    {mode === AppMode.DIRECTOR && <DirectorWorkspace />}
                </ErrorBoundary>
            </div>
        </div>

        <div 
            className={`
                ${isMobile && mobileTab !== 'PREVIEW' ? 'hidden' : 'flex'} 
                ${isPreviewCollapsed ? 'w-0 opacity-0 overflow-hidden border-none' : 'flex-1 opacity-100'} 
                transition-all duration-300 ease-in-out min-w-0 flex flex-col relative
            `}
        >
            <PreviewPanel 
                onAssetSelect={handleAssetSelect}
            />
        </div>
        
        {/* Floating PiP Preview when Collapsed */}
        {isPreviewCollapsed && !isMobile && <FloatingPreview />}

      </main>
    </div>
  );
}
