
import React, { memo, useState, useRef, useEffect } from 'react';
import { Button, TextArea, Card, Input, BiometricSlider } from '../../components/UI';
import { Sparkles, Play, CheckCircle, Loader2, AlertCircle, Clapperboard, UserCheck, Lightbulb, ChevronDown, Sliders, ArrowRight, RotateCcw, XCircle, RefreshCw, MessageSquare, Trash2, Edit2, Check, Plus, ClipboardCheck, BarChart, Flame } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useDirectorStore } from '../../stores/directorStore';
import { useModelStore } from '../../stores/modelStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';
import { AppMode, DirectorShot } from '../../types';

export const DirectorWorkspace = memo(() => {
    const { brief, setBrief, plan, isPlanning, isShooting, createPlan, executePlan, castModel, setCastModel, suggestBrief, regenerateShot, updateShot, deleteShot, addShot, runAudit, auditReport, isAuditing, intensity, setIntensity } = useDirectorStore();
    const { savedModels } = useModelStore();
    const { hydrateFromDirector } = useGenerationStore();
    const { setMode, addToast } = useUIStore();
    const { t } = useTranslation();
    
    const [isCastingOpen, setIsCastingOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'PLAN' | 'AUDIT'>('PLAN');
    const castingRef = useRef<HTMLDivElement>(null);
    
    const [rejectingShotId, setRejectingShotId] = useState<string | null>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [editingShotId, setEditingShotId] = useState<string | null>(null);

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

    const handleRejectClick = (shotId: string) => {
        setRejectingShotId(shotId);
        setFeedbackText("");
    };

    const confirmRejection = async () => {
        if(rejectingShotId && feedbackText.trim()) {
            await regenerateShot(rejectingShotId, feedbackText);
            setRejectingShotId(null);
            setFeedbackText("");
        }
    };

    const selectedName = castModel ? `${castModel.name} (${castModel.ethnicity})` : t('DIR_NEW_FACE');

    return (
        <div className="space-y-6 pb-32 animate-in fade-in">
             <div className="flex gap-4 border-b border-white/10 mb-4">
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

            {activeTab === 'AUDIT' ? (
                <div className="space-y-6 animate-in slide-in-from-right-2">
                    <div className="bg-slate-900/40 p-6 rounded-xl border border-white/10 text-center">
                        <ClipboardCheck size={48} className="mx-auto text-emerald-400 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Campaign Intelligence</h2>
                        <p className="text-xs text-white/50 mb-6 max-w-xs mx-auto">
                            The Audit Agent analyzes your generated assets against your Brand Bible to find gaps and inconsistency.
                        </p>
                        <Button onClick={runAudit} isLoading={isAuditing} className="bg-emerald-600 hover:bg-emerald-500 mx-auto">
                            Run Full Audit
                        </Button>
                    </div>

                    {auditReport && (
                        <div className="space-y-4 animate-in fade-in">
                            <Card className="p-4 bg-slate-900/50 border-emerald-500/20">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Campaign Score</span>
                                    <span className="text-3xl font-black text-white">{auditReport.score}/100</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${auditReport.score}%` }} />
                                </div>
                                <p className="text-sm text-white/80 italic">"{auditReport.analysis}"</p>
                            </Card>

                             <Card className="p-4 bg-slate-900/50">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Consistency Check</h3>
                                <p className="text-sm text-white">{auditReport.consistencyCheck}</p>
                            </Card>

                            <Card className="p-4 bg-slate-900/50 border-red-500/10">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">Missing Shots</h3>
                                <ul className="space-y-2">
                                    {auditReport.missingShots.map((shot, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                                            <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                            {shot}
                                        </li>
                                    ))}
                                </ul>
                                <Button onClick={() => { setBrief(auditReport.missingShots.join(". ")); setActiveTab('PLAN'); }} className="w-full mt-4 text-xs h-8" variant="secondary">
                                    <Plus size={14}/> Add Missing Shots to Plan
                                </Button>
                            </Card>
                        </div>
                    )}
                </div>
            ) : (
                <>
                {/* EXISTING DIRECTOR UI */}
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
                                    <div 
                                        onClick={() => { setCastModel(null); setIsCastingOpen(false); }}
                                        className="p-2 text-sm text-white hover:bg-white/10 cursor-pointer border-b border-white/5"
                                    >
                                        {t('DIR_NEW_FACE')}
                                    </div>
                                    {savedModels.map(m => (
                                        <div 
                                            key={m.id}
                                            onClick={() => { setCastModel(m); setIsCastingOpen(false); }}
                                            className="p-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                                        >
                                            {m.name} <span className="text-white/40 text-xs">({m.ethnicity})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {!plan && (
                        <Button onClick={createPlan} isLoading={isPlanning} className="w-full bg-gradient-to-r from-pink-600 to-purple-600">
                            <Sparkles size={16} className="mr-2" /> {isPlanning ? t('DIR_PLANNING') : t('BTN_GENERATE')}
                        </Button>
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
                                 {!isShooting && plan.shots.some(s => s.status === 'PENDING') && (
                                    <Button onClick={executePlan} variant="primary" className="px-6 bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20">
                                        <Play size={16} className="mr-2 fill-current" /> {t('DIR_ACTION')}
                                    </Button>
                                )}
                                 <Button onClick={() => { setBrief(""); useDirectorStore.getState().setPlan(null); }} variant="secondary" className="px-3">
                                    <RotateCcw size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {plan.shots.map((shot, idx) => {
                                const isEditable = editingShotId === shot.id;
                                
                                return (
                                    <Card key={shot.id} className="p-4 flex flex-col gap-4 relative overflow-hidden bg-slate-800/50 group border border-white/5 transition-all hover:border-white/10">
                                        <div className="flex items-start gap-4">
                                            <div className="shrink-0 w-8 flex justify-center mt-1">
                                                {shot.status === 'PENDING' && <div className="w-3 h-3 rounded-full bg-white/20" />}
                                                {shot.status === 'GENERATING' && <Loader2 size={18} className="animate-spin text-pink-500" />}
                                                {shot.status === 'DONE' && <CheckCircle size={18} className="text-emerald-500" />}
                                                {shot.status === 'FAILED' && <AlertCircle size={18} className="text-red-500" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 ${shot.type === 'STUDIO' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`} onClick={() => isEditable && updateShot(shot.id, { type: shot.type === 'STUDIO' ? 'INFLUENCER' : 'STUDIO' })}>
                                                            {shot.type}
                                                        </span>
                                                        <span className="text-xs font-bold text-white/80">{t('DIR_SCENE')} {idx + 1}</span>
                                                    </div>
                                                    
                                                    {!isShooting && shot.status === 'PENDING' && !isEditable && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setEditingShotId(shot.id)} className="p-1 text-white/40 hover:text-white"><Edit2 size={12}/></button>
                                                            <button onClick={() => deleteShot(shot.id)} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={12}/></button>
                                                        </div>
                                                    )}
                                                </div>

                                                {isEditable ? (
                                                    <div className="space-y-2 animate-in fade-in">
                                                        <TextArea 
                                                            label="Description" 
                                                            value={shot.description} 
                                                            onChange={(e) => updateShot(shot.id, { description: e.target.value })} 
                                                            className="h-20 mb-2"
                                                        />
                                                        <Input 
                                                            label="Visual Details" 
                                                            value={shot.visualDetails} 
                                                            onChange={(e) => updateShot(shot.id, { visualDetails: e.target.value })} 
                                                        />
                                                        <div className="flex justify-end">
                                                            <Button onClick={() => setEditingShotId(null)} className="h-8 text-xs"><Check size={14} className="mr-1"/> Done</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-white font-medium">{shot.description}</p>
                                                        <p className="text-[10px] text-white/40 mt-1">{shot.visualDetails}</p>
                                                    </>
                                                )}
                                                
                                                {shot.feedback && (
                                                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-300 flex items-center gap-2">
                                                        <MessageSquare size={10} /> Critique: "{shot.feedback}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {shot.status === 'GENERATING' && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
                                        )}

                                        <div className="flex justify-end gap-2 border-t border-white/5 pt-2 mt-2">
                                            {shot.status === 'DONE' && rejectingShotId !== shot.id && !isShooting && (
                                                <>
                                                    <button 
                                                        onClick={() => handleRejectClick(shot.id)} 
                                                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <XCircle size={12}/> Reject & Regenerate
                                                    </button>
                                                    <button 
                                                        onClick={() => handleTune(shot)} 
                                                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <Sliders size={12} /> Tune in {shot.type === 'STUDIO' ? 'Studio' : 'Influencer'}
                                                    </button>
                                                </>
                                            )}

                                            {rejectingShotId === shot.id && (
                                                <div className="w-full animate-in slide-in-from-right-2">
                                                    <div className="flex gap-2 mb-2">
                                                        <input 
                                                            autoFocus
                                                            placeholder="Why is this shot rejected? (e.g. Too dark, wrong angle)"
                                                            value={feedbackText}
                                                            onChange={e => setFeedbackText(e.target.value)}
                                                            className="flex-1 bg-black/50 border border-red-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                                                            onKeyDown={e => e.key === 'Enter' && confirmRejection()}
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setRejectingShotId(null)} className="px-3 py-1 text-white/50 hover:text-white text-[10px]">Cancel</button>
                                                        <button onClick={confirmRejection} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold flex items-center gap-1">
                                                            <RefreshCw size={12}/> Regenerate
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                            
                            {!isShooting && (
                                <button 
                                    onClick={addShot}
                                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/30 hover:text-white hover:border-pink-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                                >
                                    <Plus size={14} /> Add Shot
                                </button>
                            )}
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    );
});
