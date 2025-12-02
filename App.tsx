
import React from 'react';
import { AppMode } from './types';
import { Sidebar, MobileNav, PreviewPanel, ToastDisplay, ErrorBoundary } from './components/Layout';
import { DragDropZone } from './components/layout/DragDropZone';
import { CommandPalette } from './components/layout/CommandPalette';
import { PromptReviewModal } from './components/layout/PromptReviewModal';
import { ProjectSettingsModal } from './components/modals/ProjectSettingsModal';
import { CreatorWorkspace, StudioWorkspace, InfluencerWorkspace, BillingWorkspace, MotionWorkspace, GalleryWorkspace, DirectorWorkspace, LiveWorkspace } from './features/Workspaces';
import { useTranslation } from './contexts/LanguageContext';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppController } from './hooks/useAppController';

export default function App() {
  return (
    <ErrorBoundary>
        <DragDropZone>
            <MainApp />
            <CommandPalette />
            <PromptReviewModal />
            <ProjectSettingsModal />
        </DragDropZone>
    </ErrorBoundary>
  );
}

function MainApp() {
  const { t } = useTranslation();
  const { 
      mode, mobileTab, isPro, isMobile, toasts,
      setMobileTab, togglePro, removeToast, handleAssetSelect
  } = useAppController();

  return (
    <div className="flex h-screen bg-transparent text-white font-sans overflow-hidden relative">
      <ToastDisplay toasts={toasts} remove={removeToast} />
      {/* Ambient Glows handled by Nebula in index.html */}

      <Sidebar />

      <main className="flex-1 flex flex-col lg:flex-row relative z-10 h-full overflow-hidden">
        {isMobile && (
            <div className="h-16 flex items-center justify-between px-4 bg-[#030712]/80 backdrop-blur border-b border-white/10 shrink-0">
                <span className="font-bold brand-font tracking-widest text-lg">GEMINI<span className="text-pink-500">STUDIO</span></span>
                <div className="flex bg-slate-800 rounded-lg p-1"><button onClick={() => setMobileTab('EDITOR')} className={`p-2 rounded-md ${mobileTab === 'EDITOR' ? 'bg-pink-600' : 'text-slate-400'}`}>Edit</button><button onClick={() => setMobileTab('PREVIEW')} className={`p-2 rounded-md ${mobileTab === 'PREVIEW' ? 'bg-pink-600' : 'text-slate-400'}`}>View</button></div>
            </div>
        )}

        <div className={`flex-1 lg:max-w-lg xl:max-w-xl h-full flex flex-col border-r border-white/5 bg-slate-900/30 backdrop-blur-sm ${isMobile && mobileTab !== 'EDITOR' ? 'hidden' : 'flex'}`}>
            <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/40 backdrop-blur shrink-0 z-20">
                <h2 className="text-xl font-bold cyber-font tracking-wider" data-testid="app-mode-header">{t(`NAV_${mode}`)}</h2>
                {mode !== AppMode.BILLING && mode !== AppMode.GALLERY && mode !== AppMode.DIRECTOR && mode !== AppMode.LIVE && <button onClick={togglePro} className="text-[10px] uppercase font-bold flex items-center gap-2 text-slate-400">{isPro ? t("LBL_PRO_MODE") : "Simple"} {isPro ? <ToggleRight className="text-pink-400"/> : <ToggleLeft/>}</button>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-32">
                <ErrorBoundary>
                    {mode === AppMode.CREATOR && <CreatorWorkspace />}
                    {mode === AppMode.STUDIO && <StudioWorkspace />}
                    {mode === AppMode.INFLUENCER && <InfluencerWorkspace />}
                    {mode === AppMode.MOTION && <MotionWorkspace />}
                    {mode === AppMode.LIVE && <LiveWorkspace />}
                    {mode === AppMode.BILLING && <BillingWorkspace />}
                    {mode === AppMode.GALLERY && <GalleryWorkspace onSelect={handleAssetSelect} />}
                    {mode === AppMode.DIRECTOR && <DirectorWorkspace />}
                </ErrorBoundary>
            </div>
        </div>

        <div className={`${isMobile && mobileTab !== 'PREVIEW' ? 'hidden' : 'flex'} flex-1`}>
            <PreviewPanel 
                onAssetSelect={handleAssetSelect}
            />
        </div>
      </main>
      
      {isMobile && <MobileNav />}
    </div>
  );
}
