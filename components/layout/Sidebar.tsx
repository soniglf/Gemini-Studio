
import React, { memo, useState } from 'react';
import { AppMode, Project } from '../../types';
import { User, Camera, Globe, Film, Layers, CreditCard, Folder, Plus, ChevronDown, Clapperboard, Edit2, Check, Languages, Settings, Sparkles, Cloud, RefreshCw, X } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useModalStore } from '../../stores/modalStore';
import { SoniNewMediaLogo } from '../icons/SoniLogo';

interface NavItemProps {
    mode: AppMode;
    current: AppMode;
    icon: React.ElementType;
    label: string;
    setMode: (mode: AppMode) => void;
}

const NavItem = memo(({ mode, current, icon: Icon, label, setMode }: NavItemProps) => (
    <button 
        onClick={() => setMode(mode)} 
        className={`relative flex items-center gap-3 p-3 w-full rounded-xl transition-all duration-300 group ${current === mode ? 'bg-white/10 text-white shadow-lg translate-x-1' : 'text-white/40 hover:text-white hover:bg-white/5 hover:translate-x-1'}`}
    >
        <Icon size={20} className={`transition-colors duration-300 ${current === mode ? 'text-[var(--neon-primary)] drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'group-hover:text-white'}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {current === mode && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[var(--neon-primary)] shadow-[0_0_10px_var(--neon-primary)] animate-pulse"></div>}
    </button>
));

export const Sidebar: React.FC = memo(() => {
    const { mode, setMode, isSidebarOpen, setSidebarOpen, isMobile } = useUIStore();
    const { openModal } = useModalStore();
    const { projects, activeProject, setActiveProject, createProject, deleteProject, renameProject } = useProjectStore();
    
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    
    const { t, language, setLanguage } = useTranslation();

    const handleCreate = () => {
        const name = prompt("New Campaign Name:");
        if (name) createProject(name);
    };

    const startEditing = (e: React.MouseEvent, p: Project) => {
        e.stopPropagation();
        setEditingId(p.id);
        setEditName(p.name);
    };

    const saveEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (editName.trim()) {
            renameProject(id, editName);
        }
        setEditingId(null);
    };

    const handleSettingsClick = () => {
        openModal('PROJECT_SETTINGS');
        if (isMobile) setSidebarOpen(false);
    };

    const Backdrop = () => (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
            onClick={() => setSidebarOpen(false)}
        />
    );

    return (
        <>
            {isSidebarOpen && isMobile && <Backdrop />}
            
            <div className={`
                h-full glass-panel border-r border-white/5 flex flex-col shrink-0 z-50 transition-transform duration-300
                w-64 lg:static fixed top-0 left-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div>
                    <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 gap-3 group">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMode(AppMode.CREATOR)}>
                            <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-primary)] to-[var(--neon-secondary)] rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--neon-primary)] group-hover:shadow-[0_0_25px_var(--neon-primary)] transition-all duration-500 relative overflow-hidden">
                                <Sparkles size={18} className="text-white fill-current animate-pulse relative z-10" />
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rotate-45"></div>
                            </div>
                            <div className="flex flex-col leading-none select-none">
                                <span className="font-black text-lg tracking-widest text-white brand-font drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-pulse">GEMINI</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold tracking-[0.3em] text-[var(--neon-primary)] group-hover:text-pink-400 transition-colors">STUDIO</span>
                                </div>
                            </div>
                        </div>
                        {isMobile && <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white"><X size={20} /></button>}
                    </div>

                    <div className="p-4 relative space-y-2">
                        <button onClick={() => setIsProjectOpen(!isProjectOpen)} className="w-full flex items-center justify-between bg-slate-800/50 border border-white/10 rounded-lg p-3 hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Folder size={16} className="text-emerald-400 shrink-0"/>
                                <div className="flex flex-col items-start truncate">
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t('LBL_CAMPAIGN')}</span>
                                    <span className="text-xs font-bold truncate text-white">{activeProject?.name || "Loading..."}</span>
                                </div>
                            </div>
                            <ChevronDown size={14} className={`text-white/30 transition-transform ${isProjectOpen ? 'rotate-180' : ''}`}/>
                        </button>

                        <button onClick={handleSettingsClick} className="w-full flex items-center gap-2 bg-slate-800/30 border border-white/5 rounded-lg p-2 text-white/50 hover:text-white hover:bg-slate-800 transition-colors text-xs group" title="Campaign Settings">
                            <Settings size={14} className="group-hover:rotate-45 transition-transform"/>
                            <span className="font-medium">Campaign Settings</span>
                            {activeProject?.budget && <span className="ml-auto text-emerald-400 text-[10px] bg-emerald-500/10 px-1 rounded">${activeProject.budget}</span>}
                        </button>

                        {isProjectOpen && (
                            <div className="absolute top-[85%] left-4 right-4 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden backdrop-blur-xl">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {projects.map(p => (
                                        <div key={p.id} onClick={() => { if(editingId !== p.id) { setActiveProject(p); setIsProjectOpen(false); }}} className={`w-full text-left p-3 text-xs font-bold border-b border-white/5 flex items-center justify-between hover:bg-white/5 cursor-pointer ${activeProject?.id === p.id ? 'text-emerald-400 bg-white/5' : 'text-slate-400'}`}>
                                            {editingId === p.id ? (
                                                <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="bg-black/50 text-white w-full rounded px-1 py-0.5 outline-none border border-pink-500/50" onKeyDown={e => { if(e.key === 'Enter') saveEdit(e as any, p.id); }}/>
                                                    <button onClick={(e) => saveEdit(e, p.id)} className="p-1 text-emerald-400 hover:bg-white/10 rounded"><Check size={14}/></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 overflow-hidden"><Folder size={14} /> <span className="truncate">{p.name}</span></div>
                                                    <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => startEditing(e, p)} className="p-1.5 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors" title="Rename"><Edit2 size={12}/></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleCreate} className="w-full p-3 text-xs font-bold text-pink-400 hover:bg-white/5 flex items-center gap-2 justify-center border-t border-white/5"><Plus size={14}/> {t('BTN_CREATE')}</button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2 custom-scrollbar">
                        <NavItem mode={AppMode.CREATOR} current={mode} icon={User} label={t('NAV_CREATOR')} setMode={setMode} />
                        <NavItem mode={AppMode.STUDIO} current={mode} icon={Camera} label={t('NAV_STUDIO')} setMode={setMode} />
                        <NavItem mode={AppMode.INFLUENCER} current={mode} icon={Globe} label={t('NAV_INFLUENCER')} setMode={setMode} />
                        <NavItem mode={AppMode.MOTION} current={mode} icon={Film} label={t('NAV_MOTION')} setMode={setMode} />
                        <div className="h-px bg-white/10 my-2 mx-4"></div>
                        <NavItem mode={AppMode.DIRECTOR} current={mode} icon={Clapperboard} label={t('NAV_DIRECTOR')} setMode={setMode} />
                        <NavItem mode={AppMode.GALLERY} current={mode} icon={Layers} label={t('NAV_GALLERY')} setMode={setMode} />
                        <NavItem mode={AppMode.BILLING} current={mode} icon={CreditCard} label={t('NAV_BILLING')} setMode={setMode} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="mx-6 py-2 border-t border-white/5 flex items-center justify-between text-[9px] text-white/30 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Cloud size={10} className="text-[var(--neon-secondary)]" /> Sync Active</span>
                        <RefreshCw size={10} className="animate-spin duration-[3000ms] text-[var(--neon-primary)] opacity-50"/>
                    </div>
                    <div className="px-4">
                        <button onClick={() => setLanguage(language === 'EN' ? 'ES' : 'EN')} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/40 text-xs font-bold text-white/50 hover:text-white hover:bg-slate-800 transition-colors">
                            <Languages size={14} /><span>{language === 'EN' ? 'English' : 'Español'}</span>
                        </button>
                    </div>
                    {/* CUSTOM LOGO INTEGRATION */}
                    <div className="px-6 pb-6 pt-2 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default group flex justify-center">
                        <SoniNewMediaLogo className="w-24 h-24 text-white group-hover:text-white/90 transition-colors" />
                    </div>
                </div>
            </div>
        </>
    );
});
