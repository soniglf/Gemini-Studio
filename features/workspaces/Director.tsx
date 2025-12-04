
import React, { memo, useRef, useEffect, useState } from 'react';
import { Button, TextArea, Card, Input, BiometricSlider } from '../../components/UI';
import { Sparkles, Play, CheckCircle, Loader2, AlertCircle, Clapperboard, UserCheck, Lightbulb, ChevronDown, Sliders, RotateCcw, XCircle, RefreshCw, MessageSquare, Trash2, Edit2, Check, Plus, Flame, Grid, List, Download } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useDirectorStore } from '../../stores/directorStore';
import { useModelStore } from '../../stores/modelStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';
import { useGalleryStore } from '../../stores/galleryStore';
import { AppMode, DirectorShot } from '../../types';
import { AuditPanel } from '../director/AuditPanel';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import JSZip from 'jszip';

export const DirectorWorkspace = memo(() => {
    const { 
        brief, setBrief, plan, isPlanning, isShooting, createPlan, executePlan, 
        castModel, setCastModel, suggestBrief, updateShot, deleteShot, addShot, 
        runAudit, auditReport, isAuditing, intensity, setIntensity,
        editingShotId, rejectingShotId, feedbackText,
        startEditing, cancelEditing, startRejection, cancelRejection, setFeedbackText, submitRejection
    } = useDirectorStore();
    const { savedModels } = useModelStore();
    const { hydrateFromDirector } = useGenerationStore();
    const { assets } = useGalleryStore();
    const { setMode, addToast } = useUIStore();
    const { t } = useTranslation();
    
    const [isCastingOpen, setIsCastingOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'PLAN' | 'AUDIT'>('PLAN');
    const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('GRID');
    const [isExporting, setIsExporting] = useState(false);
    const castingRef = useRef<HTMLDivElement>(null);

    useKeyboardShortcuts({ onGenerate: executePlan }); 

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (castingRef.current && !castingRef.current.contains(event.target as Node)) setIsCastingOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTune = (shot: DirectorShot) => {
        hydrateFromDirector(shot);
        const targetMode = shot.type === 'STUDIO' ? AppMode.STUDIO : AppMode.INFLUENCER;
        setMode(targetMode);
        addToast(`Shot loaded in ${shot.type} Mode`, 'success');
    };

    const handleAddMissingShots = (shots: string[]) => {
        setBrief(shots.join(". "));
        setActiveTab('PLAN');
    };

    const handleExportCampaign = async () => {
        if (!plan) return;
        setIsExporting(true);
        try {
            const zip = new JSZip();
            const campaignFolder = zip.folder(plan.campaignName.replace(/\s+/g, '_'));
            
            // Add Metadata
            campaignFolder?.file("brief.txt", brief);
            campaignFolder?.file("plan.json", JSON.stringify(plan, null, 2));
            
            // Add Assets
            for (const shot of plan.shots) {
                if (shot.resultAssetId) {
                    const asset = assets.find(a => a.id === shot.resultAssetId);
                    if (asset && asset.blob) {
                        const ext = asset.type === 'VIDEO' ? 'mp4' : 'png';
                        const filename = `${shot.type}_${shot.id}.${ext}`;
                        campaignFolder?.file(filename, asset.blob);
                    }
                }
            }
            
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${plan.campaignName}_Package.zip`;
            a.click();
            URL.revokeObjectURL(url);
            addToast("Campaign Exported", 'success');
        } catch (e) {
            console.error(e);
            addToast("Export Failed", 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const selectedName = castModel ? `${castModel.name} (${castModel.ethnicity})` : t('DIR_NEW_FACE');

    return (
        <div className="space-y-6 pb-32 animate-in fade-in">
             <div className="flex gap-4 border-b border-white/10 mb-4 justify-between items-center">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('PLAN')} 
                        className={`pb-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'PLAN' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Planning
                    </button>
                    <button 
                        onClick={() => setActiveTab('AUDIT')} 
                        className={`pb-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'AUDIT' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Campaign Audit
                    </button>
                </div>
                {plan && activeTab === 'PLAN' && (
                    <div className="flex gap-2 pb-2">
                        <button onClick={() => setViewMode('LIST')} className={`p-1 rounded ${viewMode === 'LIST' ? 'text-white bg-white/10' : 'text-white/40'}`}><List size={14}/></button>
                        <button onClick={() => setViewMode('GRID')} className={`p-1 rounded ${viewMode === 'GRID' ? 'text-white bg-white/10' : 'text-white/40'}`}><Grid size={14}/></button>
                    </div>
                )}
            </div>

            {activeTab === 'AUDIT' ? (
                <AuditPanel 
                    report={auditReport} 
                    isAuditing={isAuditing} 
                    onRunAudit={runAudit} 
                    onAddMissing={handleAddMissingShots}
                />
            ) : (
                <>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-pink-400">
                            <Clapperboard size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">{t('LBL_BRIEF')}</span>
                        </div>
                        <button onClick={suggestBrief} className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
                            <Lightbulb size={12}/> {t('LBL_SURPRISE')}
                        </button>
                    </div>

                    <TextArea 
                        label="What are we shooting today?" 
                        value={brief} 
                        onChange={(e) => setBrief(e.target.value)} 
                        placeholder={t('DIR_PLACEHOLDER')}
                        disabled={isPlanning || isShooting}
                    />

                    {!plan && (
                        <>
                            <div className="bg-slate-900/40 p-4 rounded-xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flame size={14} className="text-orange-400" />
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Cinematic Intensity</span>
                                </div>
                                <BiometricSlider 
                                    label={`Drama Level: ${intensity}%`} 
                                    value={intensity} 
                                    onChange={setIntensity}
                                    leftLabel="Natural / Candid"
                                    rightLabel="Edgy / High Fashion"
                                />
                            </div>

                            <div className="bg-slate-900/40 p-3 rounded-lg border border-white/10 flex items-center gap-3" ref={castingRef}>
                                <UserCheck className="text-purple-400" size={20} />
                                <div className="flex-1 relative group">
                                    <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">{t('LBL_CASTING')}</label>
                                    <button 
                                        onClick={() => !isPlanning && !isShooting && !plan && setIsCastingOpen(!isCastingOpen)}
                                        className="w-full bg-slate-800 text-sm font-bold text-white p-2 rounded border border-white/10 flex items-center justify-between hover:border-pink-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isPlanning || isShooting || !!plan}
                                    >
                                        <span>{selectedName}</span>
                                        <ChevronDown size={14} className={`text-white/50 transition-transform ${isCastingOpen ? 'rotate-180' : ''}`}/>
                                    </button>
                                    
                                    {isCastingOpen && (
                                        <div className="absolute top-[110%] left-0 w-full bg-[#0B1121] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                            <div onClick={() => { setCastModel(null); setIsCastingOpen(false); }} className="p-2 text-sm text-white hover:bg-white/10 cursor-pointer border-b border-white/5">{t('DIR_NEW_FACE')}</div>
                                            {savedModels.map(m => (
                                                <div key={m.id} onClick={() => { setCastModel(m); setIsCastingOpen(false); }} className="p-2 text-sm text-white hover:bg-white/10 cursor-pointer">
                                                    {m.name} <span className="text-white/40 text-xs">({m.ethnicity})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button onClick={createPlan} isLoading={isPlanning} className="w-full bg-gradient-to-r from-pink-600 to-purple-600">
                                <Sparkles size={16} className="mr-2" /> {isPlanning ? t('DIR_PLANNING') : t('BTN_GENERATE')}
                            </Button>
                        </>
                    )}
                </div>

                {plan && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{plan.campaignName}</h2>
                                <p className="text-xs text-white/50">Model: {plan.modelBrief.name} ({plan.modelBrief.ethnicity}, {plan.modelBrief.vibe})</p>
                            </div>
                            <div className="flex gap-2">
                                {!isShooting && plan.shots.some(s => s.status === 'DONE') && (
                                    <button onClick={handleExportCampaign} disabled={isExporting} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-white/70 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors">
                                        {isExporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} Export
                                    </button>
                                )}
                                 {!isShooting && plan.shots.some(s => s.status === 'PENDING' || s.status === 'FAILED') && (
                                    <Button onClick={executePlan} variant="primary" className="px-6 bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20">
                                        <Play size={16} className="mr-2 fill-current" /> {t('DIR_ACTION')}
                                    </Button>
                                )}
                                 <Button onClick={() => { setBrief(""); useDirectorStore.getState().setPlan(null); }} variant="secondary" className="px-3">
                                    <RotateCcw size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className={`space-y-3 ${viewMode === 'GRID' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0' : ''}`}>
                            {plan.shots.map((shot, idx) => {
                                const isEditable = editingShotId === shot.id;
                                const asset = shot.resultAssetId ? assets.find(a => a.id === shot.resultAssetId) : null;
                                
                                return (
                                    <Card key={shot.id} className={`p-4 flex flex-col gap-4 relative overflow-hidden bg-slate-800/50 group border transition-all ${shot.status === 'FAILED' ? 'border-red-500/30 bg-red-900/5' : 'border-white/5 hover:border-white/10'}`}>
                                        <div className={`flex ${viewMode === 'GRID' ? 'flex-col' : 'flex-row items-start'} gap-4`}>
                                            <div className={`shrink-0 ${viewMode === 'GRID' ? 'w-full aspect-square' : 'w-24 aspect-square'}`}>
                                                {/* Visual Proofing (Dailies) */}
                                                <div className="w-full h-full rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative">
                                                    {shot.status === 'PENDING' && <div className="w-3 h-3 rounded-full bg-white/20" />}
                                                    {shot.status === 'GENERATING' && <Loader2 size={18} className="animate-spin text-pink-500" />}
                                                    {shot.status === 'DONE' && asset ? (
                                                        <img src={asset.url} className="w-full h-full object-cover animate-in fade-in" />
                                                    ) : (
                                                        shot.status === 'DONE' && <CheckCircle size={18} className="text-emerald-500" />
                                                    )}
                                                    {shot.status === 'FAILED' && <AlertCircle size={18} className="text-red-500" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 ${shot.type === 'STUDIO' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`} onClick={() => isEditable && updateShot(shot.id, { type: shot.type === 'STUDIO' ? 'INFLUENCER' : 'STUDIO' })}>
                                                            {shot.type}
                                                        </span>
                                                        <span className="text-xs font-bold text-white/80">{t('DIR_SCENE')} {idx + 1}</span>
                                                    </div>
                                                    {!isShooting && (shot.status === 'PENDING' || shot.status === 'FAILED') && !isEditable && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditing(shot.id)} className="p-1 text-white/40 hover:text-white"><Edit2 size={12}/></button>
                                                            <button onClick={() => deleteShot(shot.id)} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={12}/></button>
                                                        </div>
                                                    )}
                                                </div>
                                                {isEditable ? (
                                                    <div className="space-y-2 animate-in fade-in">
                                                        <TextArea label="Description" value={shot.description} onChange={(e) => updateShot(shot.id, { description: e.target.value })} className="h-20 mb-2"/>
                                                        <Input label="Visual Details" value={shot.visualDetails} onChange={(e) => updateShot(shot.id, { visualDetails: e.target.value })} />
                                                        <div className="flex justify-end"><Button onClick={cancelEditing} className="h-8 text-xs"><Check size={14} className="mr-1"/> Done</Button></div>
                                                    </div>
                                                ) : (
                                                    <><p className="text-sm text-white font-medium line-clamp-2">{shot.description}</p><p className="text-[10px] text-white/40 mt-1 line-clamp-1">{shot.visualDetails}</p></>
                                                )}
                                                {shot.feedback && <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-300 flex items-center gap-2 animate-in slide-in-from-left-2"><MessageSquare size={10} /> Critique: "{shot.feedback}"</div>}
                                            </div>
                                        </div>
                                        {shot.status === 'GENERATING' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />}
                                        <div className="flex justify-end gap-2 border-t border-white/5 pt-2 mt-2">
                                            {shot.status === 'FAILED' && !isShooting && <button onClick={() => updateShot(shot.id, { status: 'PENDING' })} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"><RefreshCw size={12}/> Reset for Retry</button>}
                                            {shot.status === 'DONE' && rejectingShotId !== shot.id && !isShooting && (
                                                <>
                                                    <button onClick={() => startRejection(shot.id)} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"><XCircle size={12}/> Reject</button>
                                                    <button onClick={() => handleTune(shot)} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"><Sliders size={12} /> Tune</button>
                                                </>
                                            )}
                                            {rejectingShotId === shot.id && (
                                                <div className="w-full animate-in slide-in-from-right-2">
                                                    <div className="flex gap-2 mb-2">
                                                        <input autoFocus placeholder="Critique (e.g. Too dark)" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="flex-1 bg-black/50 border border-red-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500" onKeyDown={e => e.key === 'Enter' && submitRejection()}/>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={cancelRejection} className="px-3 py-1 text-white/50 hover:text-white text-[10px]">Cancel</button>
                                                        <button onClick={submitRejection} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold flex items-center gap-1"><RefreshCw size={12}/> Regen</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                            {!isShooting && <button onClick={addShot} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/30 hover:text-white hover:border-pink-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest min-h-[100px]"><Plus size={14} /> Add Shot</button>}
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    );
});
