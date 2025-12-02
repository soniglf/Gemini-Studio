
import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, DollarSign, Download, Upload, Trash2, Folder, Save, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectPacker } from '../../services/io/projectPacker';
import { Button, Input, TextArea } from '../UI';

export const ProjectSettingsModal: React.FC = () => {
    const { isSettingsOpen, setSettingsOpen, addToast } = useUIStore();
    const { activeProject, updateProject, deleteProject, loadProjects } = useProjectStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contextText, setContextText] = useState("");
    const [budgetInput, setBudgetInput] = useState("");
    const [projectName, setProjectName] = useState("");

    // Sync state when modal opens
    useEffect(() => {
        if (isSettingsOpen && activeProject) {
            setContextText(activeProject.customInstructions || "");
            setBudgetInput(activeProject.budget?.toString() || "");
            setProjectName(activeProject.name);
        }
    }, [isSettingsOpen, activeProject]);

    if (!isSettingsOpen || !activeProject) return null;

    const handleSave = async () => {
        await updateProject(activeProject.id, {
            name: projectName,
            customInstructions: contextText,
            budget: parseFloat(budgetInput) || undefined
        });
        setSettingsOpen(false);
    };

    const handleDelete = async () => {
        if (confirm(`Delete campaign "${activeProject.name}"? This cannot be undone.`)) {
            await deleteProject(activeProject.id);
            setSettingsOpen(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await ProjectPacker.pack(activeProject.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeProject.name.replace(/\s+/g, '_')}.gemini`;
            a.click();
            URL.revokeObjectURL(url);
            addToast("Campaign Exported (.gemini)", 'success');
        } catch(e) {
            console.error(e);
            addToast("Export Failed", 'error');
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        
        try {
            await ProjectPacker.unpack(file);
            await loadProjects();
            addToast("Campaign Imported", 'success');
            setSettingsOpen(false); // Close to refresh/show new project logic if needed
        } catch(err) {
            console.error(err);
            addToast("Import Failed: Invalid .gemini File", 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-2xl bg-[#0B1121] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-white">
                            <Folder size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Campaign Settings</h2>
                            <p className="text-xs text-white/50">{activeProject.id}</p>
                        </div>
                    </div>
                    <button onClick={() => setSettingsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    
                    {/* General */}
                    <section>
                        <h3 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-4">General Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Campaign Name" 
                                value={projectName} 
                                onChange={e => setProjectName(e.target.value)} 
                            />
                            <div className="flex flex-col mb-6 w-full">
                                <label className="text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] ml-1 mb-2 block">Max Spend Limit (USD)</label>
                                <div className="flex items-center gap-2 bg-slate-900/40 border border-white/10 rounded-lg px-4 py-3">
                                    <DollarSign size={16} className="text-emerald-400"/>
                                    <input 
                                        className="w-full bg-transparent text-white placeholder:text-white/20 focus:outline-none"
                                        placeholder="No Limit"
                                        type="number"
                                        value={budgetInput}
                                        onChange={e => setBudgetInput(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Brand Bible */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-xs font-bold text-pink-400 uppercase tracking-widest">Brand Bible (Context)</h3>
                            <FileText size={14} className="text-white/30"/>
                        </div>
                        <TextArea 
                            label="Global Instructions" 
                            placeholder="e.g. Always use high contrast. Subject should look confident. No vintage filters. Key color is Neon Pink."
                            value={contextText}
                            onChange={e => setContextText(e.target.value)}
                            className="h-32"
                        />
                        <p className="text-[10px] text-white/30 mt-2">These instructions are injected into the 'PromptBuilder' for every generation in this campaign.</p>
                    </section>

                    {/* Data Sovereignty */}
                    <section className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Data & Lifecycle</h3>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleExport} className="flex-1 text-xs h-10">
                                <Download size={14} className="mr-2"/> Export .gemini
                            </Button>
                            <Button variant="secondary" onClick={handleImportClick} className="flex-1 text-xs h-10">
                                <Upload size={14} className="mr-2"/> Import Project
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".gemini,.zip" onChange={handleImportFile}/>
                            
                            <Button variant="danger" onClick={handleDelete} className="flex-1 text-xs h-10">
                                <Trash2 size={14} className="mr-2"/> Delete Project
                            </Button>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="px-8">
                        <Save size={16} className="mr-2"/> Save Changes
                    </Button>
                </div>

            </div>
        </div>
    );
};
