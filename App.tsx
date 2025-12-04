
import React, { useEffect, Suspense } from 'react';
import { AppMode, GeneratedAsset, GenerationTier } from './types';
import { Sidebar, ToastDisplay, ErrorBoundary, HealthStatusBanner, Bootloader } from './components/Layout';
import { PreviewPanel, FloatingPreview } from './components/layout/PreviewPanel';
import { DragDropZone } from './components/layout/DragDropZone';
import { CommandPalette } from './components/layout/CommandPalette';
import { PromptReviewModal } from './components/layout/PromptReviewModal';
import { ProjectSettingsModal } from './components/modals/ProjectSettingsModal';
import { useTranslation } from './contexts/LanguageContext';
import { ToggleLeft, ToggleRight, Sparkles, Layout, Menu, Zap, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useUIStore } from './stores/uiStore';
import { useGenerationStore } from './stores/generationStore';
import { useSystemHealth } from './hooks/useSystemHealth';
import { TaskRunner } from './components/layout/TaskRunner';
import { MODE_COLORS } from './data/theme';

// --- LAZY LOAD WORKSPACES ---
// This drastically reduces initial bundle size
const CreatorWorkspace = React.lazy(() => import('./features/workspaces/Creator').then(module => ({ default: module.CreatorWorkspace })));
const StudioWorkspace = React.lazy(() => import('./features/workspaces/Studio').then(module => ({ default: module.StudioWorkspace })));
const InfluencerWorkspace = React.lazy(() => import('./features/workspaces/Influencer').then(module => ({ default: module.InfluencerWorkspace })));
const MotionWorkspace = React.lazy(() => import('./features/workspaces/Motion').then(module => ({ default: module.MotionWorkspace })));
const DirectorWorkspace = React.lazy(() => import('./features/workspaces/Director').then(module => ({ default: module.DirectorWorkspace })));
const GalleryWorkspace = React.lazy(() => import('./features/workspaces/Gallery').then(module => ({ default: module.GalleryWorkspace })));
const BillingWorkspace = React.lazy(() => import('./features/workspaces/Billing').then(module => ({ default: module.BillingWorkspace })));

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
  const { mode, mobileTab, isPro, isMobile, toasts, setMobileTab, togglePro, removeToast, setIsMobile, isPreviewCollapsed, isPreviewFullScreen, togglePreviewCollapse, toggleSidebar, tier, setTier } = useUIStore();
  const { isGenerating, setLastGenerated } = useGenerationStore();
  const health = useSystemHealth();

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 1024);
    chk(); window.addEventListener('resize', chk);
    return () => window.removeEventListener('resize', chk);
  }, [setIsMobile]);

  useEffect(() => { 
      if(isGenerating && isMobile) setMobileTab('PREVIEW'); 
  }, [isGenerating, isMobile, setMobileTab]);

  const handleAssetSelect = (asset: GeneratedAsset) => {
      setLastGenerated(asset);
  };

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

      {!isPreviewFullScreen && <Sidebar />}

      <main className="flex-1 flex flex-col lg:flex-row relative z-10 h-full overflow-hidden min-w-0">
        
        {isMobile && !isPreviewFullScreen && (
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

        {!isPreviewFullScreen && (
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
                        
                        {mode !== AppMode.BILLING && mode !== AppMode.GALLERY && (
                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                <button 
                                    onClick={() => setTier(GenerationTier.SKETCH)} 
                                    className={`px-3 py-1 text-[9px] font-bold uppercase rounded transition-all flex items-center gap-1 ${tier === GenerationTier.SKETCH ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Zap size={10} className={tier === GenerationTier.SKETCH ? "text-yellow-400" : ""} /> Sketch
                                </button>
                                <button 
                                    onClick={() => setTier(GenerationTier.RENDER)} 
                                    className={`px-3 py-1 text-[9px] font-bold uppercase rounded transition-all flex items-center gap-1 ${tier === GenerationTier.RENDER ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    <ImageIcon size={10} /> Render
                                </button>
                            </div>
                        )}

                        {isPreviewCollapsed && !isMobile && (
                            <button 
                                onClick={togglePreviewCollapse}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all animate-in fade-in"
                                title="Restore Preview Panel"
                            >
                                <Layout size={16} />
                            </button>
                        )}
                    </div>
                    
                    {mode !== AppMode.BILLING && mode !== AppMode.GALLERY && mode !== AppMode.DIRECTOR && <button onClick={togglePro} className="text-[10px] uppercase font-bold flex items-center gap-2 text-slate-400">{isPro ? t("LBL_PRO_MODE") : "Simple"} {isPro ? <ToggleRight className="text-[var(--neon-primary)]"/> : <ToggleLeft/>}</button>}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-32">
                    <ErrorBoundary>
                        <Suspense fallback={<div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-pink-500"/></div>}>
                            {mode === AppMode.CREATOR && <CreatorWorkspace />}
                            {mode === AppMode.STUDIO && <StudioWorkspace />}
                            {mode === AppMode.INFLUENCER && <InfluencerWorkspace />}
                            {mode === AppMode.MOTION && <MotionWorkspace />}
                            {mode === AppMode.BILLING && <BillingWorkspace />}
                            {mode === AppMode.GALLERY && <GalleryWorkspace onSelect={handleAssetSelect} />}
                            {mode === AppMode.DIRECTOR && <DirectorWorkspace />}
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        )}

        <div 
            className={`
                ${isMobile && mobileTab !== 'PREVIEW' ? 'hidden' : 'flex'} 
                ${isPreviewCollapsed && !isPreviewFullScreen ? 'w-0 opacity-0 overflow-hidden border-none' : 'flex-1 opacity-100'} 
                transition-all duration-300 ease-in-out min-w-0 flex flex-col relative
            `}
        >
            <PreviewPanel 
                onAssetSelect={handleAssetSelect}
            />
        </div>
        
        {isPreviewCollapsed && !isMobile && !isPreviewFullScreen && <FloatingPreview />}

      </main>
    </div>
  );
}
