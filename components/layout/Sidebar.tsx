import React, { memo, useState } from 'react';
import { AppMode, Project } from '../../types';
import { User, Camera, Globe, Film, Layers, CreditCard, Sparkles, Folder, Plus, ChevronDown, Clapperboard, Trash2, Edit2, Check, Languages, Settings, FileText, X } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';

interface NavItemProps {
    mode: AppMode;
    current: AppMode;
    icon: React.ElementType;
    label: string;
    setMode: (mode: AppMode) => void;
}

const NavItem = memo(({ mode, current, icon: Icon, label, setMode }: NavItemProps) => (
    <button onClick={() => setMode(mode)} className={`relative flex items-center gap-3 p-3 w-full rounded-xl transition-all ${current === mode ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
        <Icon size={20} className={current === mode ? 'text-pink-400' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {current === mode && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-pink-500 rounded-r-full shadow-[0_0_10px_#ec4899]"></div>}
    </button>
));

export const Sidebar: React.FC = memo(() => {
    const { mode, setMode, setSettingsOpen } = useUIStore();
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

    const handleDelete = (e: React.MouseEvent, p: Project) => {
        e.stopPropagation();
        if (projects.length > 1 && confirm(`Delete campaign "${p.name}"? This cannot be undone.`)) {
            deleteProject(p.id);
        }
    };

    return (
        <div className="w-64 h-full glass-panel border-r border-white/5 flex flex-col shrink-0 z-20 hidden lg:flex">
            <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
                <Sparkles className="text-pink-500 animate-pulse" />
                <h1 className="font-bold text-lg tracking-widest brand-font">GEMINI<span className="text-pink-500">STUDIO</span></h1>
            </div>

            {/* Project Selector */}
            <div className="p-4 relative space-y-2">
                <button 
                    onClick={() => setIsProjectOpen(!isProjectOpen)}
                    className="w-full flex items-center justify-between bg-slate-800/50 border border-white/10 rounded-lg p-3 hover:bg-slate-800 transition-colors group"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Folder size={16} className="text-emerald-400 shrink-0"/>
                        <div className="flex flex-col items-start truncate">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t('LBL_CAMPAIGN')}</span>
                            <span className="text-xs font-bold truncate text-white">{activeProject?.name || "Loading..."}</span>
                        </div>
                    </div>
                    <ChevronDown size={14} className={`text-white/30 transition-transform ${isProjectOpen ? 'rotate-180' : ''}`}/>
                </button>

                {/* Command Center (Settings) */}
                <button 
                    onClick={() => setSettingsOpen(true)}
                    className="w-full flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-lg p-2 text-white/50 hover:text-white hover:bg-slate-800 transition-colors text-xs group"
                    title="Campaign Settings (Bible, Budget, Export)"
                >
                    <Settings size={14} className="group-hover:rotate-45 transition-transform"/>
                    <span className="font-medium">Campaign Settings</span>
                    {activeProject?.budget && <span className="ml-auto text-emerald-400 text-[10px] bg-emerald-500/10 px-1 rounded">${activeProject.budget}</span>}
                </button>

                {/* Project Dropdown */}
                {isProjectOpen && (
                    <div className="absolute top-[85%] left-4 right-4 bg-[#0B1121] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {projects.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => { if(editingId !== p.id) { setActiveProject(p); setIsProjectOpen(false); }}} 
                                    className={`w-full text-left p-3 text-xs font-bold border-b border-white/5 flex items-center justify-between hover:bg-white/5 cursor-pointer ${activeProject?.id === p.id ? 'text-emerald-400 bg-white/5' : 'text-slate-400'}`}
                                >
                                    {editingId === p.id ? (
                                        <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                            <input 
                                                autoFocus
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="bg-black/50 text-white w-full rounded px-1 py-0.5 outline-none border border-pink-500/50"
                                                onKeyDown={e => { if(e.key === 'Enter') saveEdit(e as any, p.id); }}
                                            />
                                            <button onClick={(e) => saveEdit(e, p.id)} className="p-1 text-emerald-400 hover:bg-white/10 rounded"><Check size={14}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Folder size={14} /> 
                                                <span className="truncate">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => startEditing(e, p)} className="p-1.5 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors" title="Rename"><Edit2 size={12}/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <button onClick={handleCreate} className="w-full p-3 text-xs font-bold text-pink-400 hover:bg-white/5 flex items-center gap-2 justify-center border-t border-white/5">
                            <Plus size={14}/> {t('BTN_CREATE')}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2 no-scrollbar">
                <NavItem mode={AppMode.DIRECTOR} current={mode} icon={Clapperboard} label={t('NAV_DIRECTOR')} setMode={setMode} />
                <div className="h-px bg-white/10 my-2 mx-4"></div>
                <NavItem mode={AppMode.CREATOR} current={mode} icon={User} label={t('NAV_CREATOR')} setMode={setMode} />
                <NavItem mode={AppMode.STUDIO} current={mode} icon={Camera} label={t('NAV_STUDIO')} setMode={setMode} />
                <NavItem mode={AppMode.INFLUENCER} current={mode} icon={Globe} label={t('NAV_INFLUENCER')} setMode={setMode} />
                <NavItem mode={AppMode.MOTION} current={mode} icon={Film} label={t('NAV_MOTION')} setMode={setMode} />
                <div className="h-px bg-white/10 my-4 mx-2"></div>
                <NavItem mode={AppMode.GALLERY} current={mode} icon={Layers} label={t('NAV_GALLERY')} setMode={setMode} />
                <NavItem mode={AppMode.BILLING} current={mode} icon={CreditCard} label={t('NAV_BILLING')} setMode={setMode} />
            </div>

            <div className="p-4 border-t border-white/5">
                <button 
                    onClick={() => setLanguage(language === 'EN' ? 'ES' : 'EN')}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/40 text-xs font-bold text-white/50 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <Languages size={14} />
                    <span>{language === 'EN' ? 'English' : 'Español'}</span>
                </button>
            </div>
        </div>
    );
});