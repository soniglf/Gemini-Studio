
import React, { memo, useState, useRef, useEffect } from 'react';
import { ModelAttributes, GenerationTier, ModelMorphology } from '../../types';
import { Button, Input, VisualGridSelect, BiometricSlider, ImageUpload, TextArea, SliderGroup } from '../../components/UI';
import { Plus, Trash2, Dna, Copy, ScanFace, Activity, Fingerprint, Layers, Sparkles, Zap, ToggleRight, ToggleLeft, Cpu, ActivitySquare, Wand2, Stars, Info, Dices, ChevronRight, TestTube, Scale, BoxSelect, ChevronLeft, Undo2, Redo2, Upload, User, Eye, Smile, FileText, ChevronDown } from 'lucide-react';
import { OPTIONS, DEFAULT_MORPHOLOGY, formatHeight, FULL_PRESETS_FEMALE, FULL_PRESETS_MALE, SLIDER_LABELS, MUTATION_TRAITS, GENDER_CONFIG } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useModelStore } from '../../stores/modelStore';
import { useGenerationStore } from '../../stores/generationStore';
import { useUIStore } from '../../stores/uiStore';
import { AnalysisAgent } from '../../services/ai/agents/analysisAgent';
import { IdentityAgent } from '../../services/ai/agents/identityAgent';
import { ImageOptimizer } from '../../services/utils/imageOptimizer';

export const CreatorWorkspace = memo(() => {
    const { model, setModel, savedModels, createProfile, deleteProfile, forkProfile } = useModelStore();
    const { generate, isGenerating } = useGenerationStore();
    const { addToast, isPreviewCollapsed } = useUIStore();
    const { t } = useTranslation();
    
    const [activeTab, setActiveTab] = useState<'GENETICS' | 'ANATOMY' | 'STYLING'>('GENETICS');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [musePrompt, setMusePrompt] = useState("");
    
    const [proRealism, setProRealism] = useState(false);
    const [simpleRealism, setSimpleRealism] = useState(50);
    const [showDNA, setShowDNA] = useState(false);
    
    // Drag & Drop State for Clone Engine
    const [isDraggingRef, setIsDraggingRef] = useState(false);
    
    // --- SMART HISTORY STACK ---
    const [history, setHistory] = useState<ModelAttributes[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize history with current model on load
    useEffect(() => {
        if (model && history.length === 0) {
            setHistory([model]);
            setHistoryIndex(0);
        }
    }, []);

    const pushToHistory = (newModel: ModelAttributes) => {
        if (historyTimeout.current) clearTimeout(historyTimeout.current);
        
        historyTimeout.current = setTimeout(() => {
            setHistory(prev => {
                const current = prev.slice(0, historyIndex + 1);
                // Prevent duplicate entries if nothing changed substantially
                if (current.length > 0 && JSON.stringify(current[current.length-1]) === JSON.stringify(newModel)) return prev;
                return [...current, newModel];
            });
            setHistoryIndex(prev => prev + 1);
        }, 500); // Debounce history pushes for slider dragging
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            setModel(prev); // Directly update store without pushing to history loop
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            setModel(next);
        }
    };
    
    const presetContainerRef = useRef<HTMLDivElement>(null);

    // --- BATCH IMAGE HANDLING (Drop & Paste) ---
    const handleBatchAddImages = async (files: File[]) => {
        if (!files.length) return;
        
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (!validFiles.length) return;

        const newImages: string[] = [];
        for (const file of validFiles) {
            try {
                const optimized = await ImageOptimizer.optimize(file);
                newImages.push(optimized);
            } catch (e) {
                console.error("Failed to process image", e);
            }
        }

        if (newImages.length > 0) {
            const current = model.referenceImages || [];
            // Append new images, respecting limit of 5
            const updatedList = [...current, ...newImages].slice(0, 5);
            
            const updated = { ...model, referenceImages: updatedList };
            // If primary ref image is empty, set it to the first one
            if (!model.referenceImage && updatedList.length > 0) {
                updated.referenceImage = updatedList[0];
            }
            
            setModel(updated);
            pushToHistory(updated);
            addToast(`Added ${newImages.length} reference images`, 'success');
        }
    };

    const onRefDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingRef(true);
    };

    const onRefDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingRef(false);
    };

    const onRefDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop Global DragDropZone from firing
        setIsDraggingRef(false);
        const files = Array.from(e.dataTransfer.files) as File[];
        await handleBatchAddImages(files);
    };

    // Paste Listener
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (activeTab !== 'GENETICS') return;
            // Only capture paste if not focusing an input
            if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) files.push(file);
                }
            }
            
            if (files.length > 0) {
                e.preventDefault();
                await handleBatchAddImages(files);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [activeTab, model.referenceImages]);


    if(!model) return null;

    const morph = model.morphology || DEFAULT_MORPHOLOGY;
    const presets = model.gender === 'FEMALE' ? FULL_PRESETS_FEMALE : FULL_PRESETS_MALE;
    const genderConfig = model.gender === 'FEMALE' ? GENDER_CONFIG.FEMALE : GENDER_CONFIG.MALE;

    const updateModel = (field: keyof ModelAttributes, value: any) => {
        const updated = { ...model, [field]: value };
        setModel(updated);
        pushToHistory(updated);
    };

    const updateMorph = (field: keyof ModelMorphology, value: number) => {
        const updated = { ...model, morphology: { ...morph, [field]: value } };
        setModel(updated);
        pushToHistory(updated);
    };

    const updateRefImage = (index: number, url: string | null) => {
        const current = [...(model.referenceImages || [])];
        if (url) current[index] = url;
        else current.splice(index, 1);
        
        const updated = { ...model, referenceImages: current };
        if (index === 0) updated.referenceImage = url; // Keep primary in sync if 0 changed
        setModel(updated);
        pushToHistory(updated);
    };

    const handleAnalyze = async () => {
        if (!model.referenceImages?.length) return addToast("Upload at least one reference image", "warning");
        setIsAnalyzing(true);
        try {
            const result = await AnalysisAgent.analyzeReferenceImages(model.referenceImages);
            const updated = { ...model, ...result };
            setModel(updated);
            pushToHistory(updated);
            
            // Force delay to ensure UI renders before expanding
            setTimeout(() => setShowDNA(true), 100); 
            
            const featureCount = result.syntheticDNA ? result.syntheticDNA.length : 0;
            addToast(`DNA Extracted (${featureCount} chars)`, "success");
        } catch (e) {
            console.error(e);
            addToast("Analysis Failed: Please check images", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSynthesize = async () => {
        if (!musePrompt.trim()) return;
        setIsSynthesizing(true);
        try {
            const result = await IdentityAgent.synthesizeProfile(musePrompt);
            const updated = { ...model, ...result };
            setModel(updated);
            pushToHistory(updated);
            addToast("Identity Synthesized", "success");
        } catch(e) {
            addToast("Synthesis Failed", "error");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleEnhance = async () => {
        if (!musePrompt.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await IdentityAgent.enhanceDescription(musePrompt);
            setMusePrompt(enhanced);
            addToast("Prompt Expanded", "success");
        } catch (e) {
            addToast("Enhancement Failed", "error");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleRandomize = () => {
        const persona = IdentityAgent.generateRandomPersona();
        setMusePrompt(persona);
    };

    const handleMutation = (traitPrompt: string) => {
        const newPrompt = IdentityAgent.injectTrait(musePrompt, traitPrompt);
        setMusePrompt(newPrompt);
    };

    const applyPreset = (presetName: string) => {
        const preset = presets[presetName];
        if (preset) {
            const newMorph = { ...morph, ...(preset.morphology || {}) };
            const { morphology: _, museDescription, ...topLevel } = preset;
            if (museDescription) setMusePrompt(museDescription);
            const updated = { ...model, ...topLevel, morphology: newMorph };
            setModel(updated);
            pushToHistory(updated);
            addToast(`Genotype Loaded: ${presetName}`, 'success');
        }
    };

    const scrollPresets = (dir: 'left' | 'right') => {
        if (presetContainerRef.current) {
            presetContainerRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
        }
    };

    const handleSimpleRealismChange = (val: number) => {
        setSimpleRealism(val);
        const newMorph = {
            ...morph,
            skinTexture: Math.round(val * 0.9),
            imperfections: Math.round(val * 0.4),
            pores: Math.round(val * 0.7),
            vascularity: Math.round(val * 0.15),
            redness: Math.round(val * 0.3),
            freckleDensity: Math.round(val * 0.2)
        };
        const updated = { ...model, morphology: newMorph };
        setModel(updated);
        pushToHistory(updated);
    };

    const mapOptions = (opts: string[], prefix: string) => opts.map(v => {
        const key = `${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`;
        const label = t(key);
        return { value: v, label: label === key ? v : label };
    });
    
    // Helper to get gender-specific labels
    const getLabel = (key: string): { label: string, left: string, right: string } => {
        // @ts-ignore
        const specific = genderConfig[key];
        const generic = SLIDER_LABELS[key];
        
        return {
            label: specific?.label || key.replace(/([A-Z])/g, ' $1').trim(),
            left: specific?.minLabel || generic?.[0] || 'Low',
            right: specific?.maxLabel || generic?.[1] || 'High'
        };
    };

    return (
        <div className="space-y-6 pb-40 animate-in fade-in relative min-h-screen">
            
            {/* --- HEADER: SUBJECT SELECTOR & UNDO --- */}
            <div className="bg-slate-950/80 border-b border-white/5 p-4 sticky top-0 z-30 backdrop-blur-xl shadow-lg">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Fingerprint className="text-pink-500" size={18} />
                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.2em]">Subject ID</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            {/* UNDO / REDO CONTROLS */}
                            <div className="flex bg-slate-800/50 rounded-lg p-0.5 mr-2 border border-white/10">
                                <button 
                                    onClick={handleUndo} 
                                    disabled={historyIndex <= 0}
                                    className="p-1.5 text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                                    title="Undo Change"
                                >
                                    <Undo2 size={12}/>
                                </button>
                                <button 
                                    onClick={handleRedo} 
                                    disabled={historyIndex >= history.length - 1}
                                    className="p-1.5 text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                                    title="Redo Change"
                                >
                                    <Redo2 size={12}/>
                                </button>
                            </div>

                            <button onClick={forkProfile} className="p-1.5 text-white/30 hover:text-white rounded bg-slate-800/50 border border-white/5 transition-colors" title="Duplicate Profile"><Copy size={12}/></button>
                            <button onClick={deleteProfile} className="p-1.5 text-white/30 hover:text-red-400 rounded bg-slate-800/50 border border-white/5 transition-colors" title="Delete Profile"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <select 
                            value={model.id} 
                            onChange={(e) => { const f = savedModels.find((m) => m.id === e.target.value); if(f) { setModel(f); setHistory([f]); setHistoryIndex(0); } }} 
                            className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-pink-500/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                            {savedModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.name} {m.id === model.id ? '●' : ''}</option>
                            ))}
                        </select>
                        <button onClick={createProfile} className="px-4 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg transition-colors"><Plus size={16}/></button>
                    </div>
                </div>
            </div>

            {/* --- NEURAL COMMAND CENTER (v5.0) --- */}
            <div className="mx-4 relative group animate-in slide-in-from-top-4">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl opacity-20 group-hover:opacity-50 transition duration-500 blur-sm"></div>
                <div className="relative bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-3 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Stars size={12} className="text-purple-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest">Muse Engine 5.0</span>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={handleRandomize}
                                className="text-[9px] flex items-center gap-1 text-white/40 hover:text-emerald-400 transition-colors"
                                title="Generate Random Persona"
                            >
                                <Dices size={10}/> Surprise Me
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <textarea 
                            value={musePrompt}
                            onChange={(e) => setMusePrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSynthesize()}
                            placeholder="Describe your vision (e.g. 'A futuristic hacker with neon hair')..."
                            className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/30 focus:bg-slate-900/80 resize-none h-24 py-3 px-4 transition-all font-light leading-relaxed shadow-inner"
                        />
                        <div className="flex flex-col gap-2">
                            <Button 
                                onClick={handleSynthesize} 
                                isLoading={isSynthesizing} 
                                disabled={!musePrompt.trim()}
                                className="flex-1 bg-gradient-to-br from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 w-14 rounded-lg border border-white/10 shadow-lg"
                                title="Synthesize Identity"
                            >
                                <Zap size={20} className="fill-current text-white" />
                            </Button>
                            <Button 
                                onClick={handleEnhance} 
                                isLoading={isEnhancing}
                                disabled={!musePrompt.trim()}
                                className="flex-1 bg-white/5 hover:bg-white/10 w-14 rounded-lg border border-white/5 text-purple-400"
                                title="Auto-Expand Prompt"
                            >
                                <Wand2 size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Smart Mutation Bar */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider flex items-center gap-1 mr-2">
                            <TestTube size={10}/> Mutations:
                        </span>
                        {MUTATION_TRAITS.map((trait, i) => (
                            <button 
                                key={i}
                                onClick={() => handleMutation(trait.prompt)}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 text-[9px] font-bold text-white/50 transition-all flex items-center gap-1"
                            >
                                + {trait.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- HOLOGRAPHIC GENOTYPE DECK (Scrollable) --- */}
            <div className="px-4 relative group/deck">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                        <Dna size={12} className="text-emerald-400"/> Genotype Library
                    </h4>
                    <div className="flex gap-1">
                        <button onClick={() => scrollPresets('left')} className="p-1 bg-white/5 hover:bg-white/10 rounded"><ChevronLeft size={14}/></button>
                        <button onClick={() => scrollPresets('right')} className="p-1 bg-white/5 hover:bg-white/10 rounded"><ChevronRight size={14}/></button>
                    </div>
                </div>
                
                <div className="relative">
                    <div 
                        ref={presetContainerRef}
                        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth snap-x snap-mandatory"
                    >
                        {Object.entries(presets).map(([name, data]) => (
                            <button 
                                key={name}
                                onClick={() => applyPreset(name)}
                                className="relative snap-start group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 p-4 rounded-xl text-left transition-all hover:-translate-y-1 overflow-hidden shrink-0 w-48 backdrop-blur-md"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-pink-500/5 group-hover:to-pink-500/20 transition-all duration-500"/>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                                        {name} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-400"/>
                                    </h4>
                                    <p className="text-[9px] text-white/40 line-clamp-2 leading-relaxed">
                                        {data.museDescription}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {/* Fade Masks */}
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#020617] to-transparent pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#020617] to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* --- LAB NAVIGATION --- */}
            <div className="sticky top-[88px] z-20 bg-slate-950/90 backdrop-blur-xl border-y border-white/10 mx-0 px-4 py-1 shadow-md">
                <div className="flex justify-between">
                    {[
                        { id: 'GENETICS', label: 'Reference', icon: ScanFace },
                        { id: 'ANATOMY', label: 'Biometrics', icon: Activity },
                        { id: 'STYLING', label: 'Styling', icon: Layers }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative rounded-lg ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-white/30 hover:text-white'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-pink-400' : ''}/>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- SECTIONS (Adaptive Grid) --- */}
            <div className={`px-4 space-y-8 min-h-[400px] grid gap-6 ${isPreviewCollapsed ? 'xl:grid-cols-2 2xl:grid-cols-3' : ''}`}>
                
                {/* GENETICS TAB */}
                {activeTab === 'GENETICS' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 col-span-full">
                        
                        {/* REFERENCE SYSTEM (WITH DROP & PASTE) */}
                        <div 
                            className={`bg-slate-900/40 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${isDraggingRef ? 'border-pink-500 bg-pink-500/10' : 'border-white/5'}`}
                            onDragOver={onRefDragOver}
                            onDragLeave={onRefDragLeave}
                            onDrop={onRefDrop}
                            data-no-global-drop="true"
                        >
                            {isDraggingRef && (
                                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                                    <Upload size={32} className="text-pink-500 mb-2 animate-bounce"/>
                                    <h4 className="text-lg font-bold text-white">Drop to Add</h4>
                                    <p className="text-xs text-white/50">Add to Face Bank</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <ScanFace size={16} className="text-blue-400" />
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Clone Engine</span>
                                </div>
                                <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="h-6 text-[10px] px-3 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30">
                                    <Zap size={10} className="mr-1"/> Extract DNA
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {[0,1,2,3,4].map(idx => (
                                    <div key={idx} className="aspect-square">
                                        <ImageUpload 
                                            label="" 
                                            value={model.referenceImages?.[idx] || null} 
                                            onChange={(v) => updateRefImage(idx, v)} 
                                            compact={true}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            {/* IDENTITY & SYNTHETIC DNA CONTROLS */}
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-3">
                                <BiometricSlider 
                                    label={`Identity Lock: ${model.strictness}%`} 
                                    value={model.strictness} 
                                    onChange={(v) => updateModel('strictness', v)} 
                                />
                                
                                {/* DNA VISUALIZER */}
                                <div className="pt-2 border-t border-white/5">
                                    <button 
                                        onClick={() => setShowDNA(!showDNA)} 
                                        className="flex items-center justify-between w-full text-[9px] font-bold text-white/40 hover:text-white uppercase tracking-wider"
                                    >
                                        <span className="flex items-center gap-1"><FileText size={10}/> Synthetic DNA (Forensic)</span>
                                        <ChevronDown size={10} className={`transition-transform ${showDNA ? 'rotate-180' : ''}`}/>
                                    </button>
                                    
                                    {showDNA && (
                                        <TextArea 
                                            label="" 
                                            value={model.syntheticDNA || ""} 
                                            onChange={(e) => updateModel('syntheticDNA', e.target.value)} 
                                            placeholder="Forensic description extracted from image..." 
                                            className="h-24 mt-2 text-[10px] font-mono leading-relaxed bg-black/30"
                                        />
                                    )}
                                </div>

                                <p className="text-[9px] text-white/40 mt-1 flex items-center gap-1">
                                    <Info size={10}/> 0% = Vibe Only. 100% = Forensic Cloning. Drop images or paste to add.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label={t('LBL_NAME')} value={model.name} onChange={(e) => updateModel('name', e.target.value)} />
                            <Input label={t('LBL_AGE')} type="number" value={model.age} onChange={(e) => updateModel('age', parseInt(e.target.value) || 24)} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect 
                                label={t('LBL_GENDER')} 
                                value={model.gender} 
                                options={[{value: 'FEMALE', label: 'Female'}, {value: 'MALE', label: 'Male'}]} 
                                onChange={(e: any) => updateModel('gender', e.target.value)} 
                            />
                            <VisualGridSelect label={t('LBL_ETHNICITY')} value={model.ethnicity} options={mapOptions(OPTIONS.ethnicity, 'OPT_ETH')} onChange={(e: any) => updateModel('ethnicity', e.target.value)} />
                        </div>
                        
                        {/* REALISM LAYER */}
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-4 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Realism v3.5 (Dermatology)</span>
                                </div>
                                <button onClick={() => setProRealism(!proRealism)} className="text-[10px] font-bold flex items-center gap-1 text-white/50 hover:text-white transition-colors uppercase tracking-wider">
                                    {proRealism ? 'Manual Control' : 'Auto-Tune'} {proRealism ? <ToggleRight className="text-purple-400"/> : <ToggleLeft/>}
                                </button>
                            </div>

                            {!proRealism && (
                                <div className="animate-in fade-in">
                                    <BiometricSlider 
                                        label="Texture Density" 
                                        value={simpleRealism} 
                                        onChange={handleSimpleRealismChange}
                                        leftLabel="Smooth"
                                        rightLabel="Raw"
                                    />
                                </div>
                            )}
                            
                            {proRealism && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <BiometricSlider label="Epidermal Texture" value={morph.skinTexture} onChange={(v) => updateMorph('skinTexture', v)} leftLabel={getLabel('skinTexture').left} rightLabel={getLabel('skinTexture').right} />
                                    <BiometricSlider label="Micro-Imperfections" value={morph.imperfections} onChange={(v) => updateMorph('imperfections', v)} leftLabel={getLabel('imperfections').left} rightLabel={getLabel('imperfections').right} />
                                    <BiometricSlider label="Pore Visibility" value={morph.pores || 50} onChange={(v) => updateMorph('pores', v)} leftLabel={getLabel('pores').left} rightLabel={getLabel('pores').right} />
                                    <BiometricSlider label="Subsurface Redness" value={morph.redness || 20} onChange={(v) => updateMorph('redness', v)} leftLabel={getLabel('redness').left} rightLabel={getLabel('redness').right} />
                                    <BiometricSlider label="Vascularity" value={morph.vascularity || 10} onChange={(v) => updateMorph('vascularity', v)} leftLabel={getLabel('vascularity').left} rightLabel={getLabel('vascularity').right} />
                                    <BiometricSlider label="Freckle Density" value={morph.freckleDensity || 0} onChange={(v) => updateMorph('freckleDensity', v)} leftLabel="Clear" rightLabel="Dusted" />
                                    <BiometricSlider label="Skin Sheen" value={morph.skinSheen || 50} onChange={(v) => updateMorph('skinSheen', v)} leftLabel="Matte" rightLabel="Dewy" />
                                    <BiometricSlider label="Aging Signs" value={morph.aging} onChange={(v) => updateMorph('aging', v)} leftLabel={getLabel('aging').left} rightLabel={getLabel('aging').right} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'ANATOMY' && (
                    <>
                        {/* 1. BODY FRAME & ARCHITECTURE */}
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* DNA Visualizer Mini */}
                            <div className="flex justify-between items-center px-2 py-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <ActivitySquare size={14}/> DNA Sequence
                                </span>
                                <span className="font-mono text-[10px] text-emerald-300 opacity-70">
                                    #{model.gender.charAt(0)}-{model.ethnicity.substring(0,3).toUpperCase()}-{morph.height}X{morph.bodyFat}-{morph.faceShape.substring(0,3)}
                                </span>
                            </div>

                            <SliderGroup title="Body Architecture" icon={Scale}>
                                <BiometricSlider 
                                    label="Height" 
                                    value={morph.height} 
                                    onChange={(v) => updateMorph('height', v)} 
                                    leftLabel={getLabel('height').left} 
                                    rightLabel={getLabel('height').right}
                                    formatValue={formatHeight}
                                />
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label={getLabel('bodyFat').label} value={morph.bodyFat} onChange={(v) => updateMorph('bodyFat', v)} leftLabel={getLabel('bodyFat').left} rightLabel={getLabel('bodyFat').right} />
                                    <BiometricSlider label={getLabel('muscleMass').label} value={morph.muscleMass} onChange={(v) => updateMorph('muscleMass', v)} leftLabel={getLabel('muscleMass').left} rightLabel={getLabel('muscleMass').right} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label="Bone Frame" value={morph.boneStructure} onChange={(v) => updateMorph('boneStructure', v)} leftLabel="Petite" rightLabel="Broad" />
                                    <BiometricSlider label="Shoulder Width" value={morph.shoulderWidth || 50} onChange={(v) => updateMorph('shoulderWidth', v)} leftLabel="Narrow" rightLabel="Broad" />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label={getLabel('bustChest').label} value={morph.bustChest} onChange={(v) => updateMorph('bustChest', v)} leftLabel={getLabel('bustChest').left} rightLabel={getLabel('bustChest').right} />
                                    <BiometricSlider label={getLabel('hipsWaistRatio').label} value={morph.hipsWaistRatio} onChange={(v) => updateMorph('hipsWaistRatio', v)} leftLabel={getLabel('hipsWaistRatio').left} rightLabel={getLabel('hipsWaistRatio').right} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label="Leg Length" value={morph.legLength || 50} onChange={(v) => updateMorph('legLength', v)} leftLabel="Short" rightLabel="Long" />
                                    <BiometricSlider label="Neck Thickness" value={morph.neckThickness || 50} onChange={(v) => updateMorph('neckThickness', v)} leftLabel="Thin" rightLabel="Thick" />
                                </div>
                            </SliderGroup>
                        </div>

                        {/* 2. CRANIAL & JAW */}
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 delay-75">
                            <SliderGroup title="Cranial Structure" icon={User}>
                                <VisualGridSelect label={t('LBL_FACE_SHAPE')} value={morph.faceShape} options={mapOptions(OPTIONS.faceShape, 'OPT_FACE')} onChange={(e: any) => updateMorph('faceShape', e.target.value)} />
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label="Forehead Height" value={morph.foreheadHeight || 50} onChange={(v) => updateMorph('foreheadHeight', v)} leftLabel="Low" rightLabel="High" />
                                    <BiometricSlider label={getLabel('cheekboneHeight').label} value={morph.cheekboneHeight} onChange={(v) => updateMorph('cheekboneHeight', v)} leftLabel={getLabel('cheekboneHeight').left} rightLabel={getLabel('cheekboneHeight').right} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label={getLabel('jawlineDefinition').label} value={morph.jawlineDefinition} onChange={(v) => updateMorph('jawlineDefinition', v)} leftLabel={getLabel('jawlineDefinition').left} rightLabel={getLabel('jawlineDefinition').right} />
                                    <BiometricSlider label="Chin Prominence" value={morph.chinProminence || 50} onChange={(v) => updateMorph('chinProminence', v)} leftLabel="Recessed" rightLabel="Jutting" />
                                </div>
                            </SliderGroup>
                        </div>

                        {/* 3. EYES & BROWS */}
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 delay-100">
                            <SliderGroup title="Ocular Region" icon={Eye}>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label="Eye Size" value={morph.eyeSize} onChange={(v) => updateMorph('eyeSize', v)} leftLabel="Narrow" rightLabel="Doe" />
                                    <BiometricSlider label="Eye Spacing" value={morph.eyeSpacing || 50} onChange={(v) => updateMorph('eyeSpacing', v)} leftLabel="Close" rightLabel="Wide" />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <BiometricSlider label="Canthal Tilt" value={morph.eyeTilt || 50} onChange={(v) => updateMorph('eyeTilt', v)} leftLabel="Downturned" rightLabel="Cat-Eye" />
                                    <BiometricSlider label="Eyebrow Arch" value={morph.eyebrowArch || 50} onChange={(v) => updateMorph('eyebrowArch', v)} leftLabel="Flat" rightLabel="High" />
                                </div>
                            </SliderGroup>
                        </div>

                        {/* 4. NOSE & MOUTH */}
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 delay-150">
                            <SliderGroup title="Nose & Mouth" icon={Smile}>
                                <BiometricSlider label={getLabel('noseStructure').label} value={morph.noseStructure} onChange={(v) => updateMorph('noseStructure', v)} leftLabel={getLabel('noseStructure').left} rightLabel={getLabel('noseStructure').right} />
                                <BiometricSlider label={getLabel('lipFullness').label} value={morph.lipFullness} onChange={(v) => updateMorph('lipFullness', v)} leftLabel={getLabel('lipFullness').left} rightLabel={getLabel('lipFullness').right} />
                            </SliderGroup>
                        </div>
                    </>
                )}

                {activeTab === 'STYLING' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 col-span-full">
                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label={t('LBL_HAIR_STYLE')} value={model.hairStyle} options={mapOptions(OPTIONS.hairStyle, 'OPT_HAIR')} onChange={(e: any) => updateModel('hairStyle', e.target.value)} />
                            <VisualGridSelect label={t('LBL_HAIR_COLOR')} value={model.hairColor} options={mapOptions(OPTIONS.hairColor, 'OPT_HCOLOR')} onChange={(e: any) => updateModel('hairColor', e.target.value)} />
                        </div>
                        
                        {/* NEW: Hair Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label="Hair Texture" value={model.hairTexture || "Straight (Type 1)"} options={OPTIONS.hairTexture.map(v => ({ value: v, label: v }))} onChange={(e: any) => updateModel('hairTexture', e.target.value)} />
                            <VisualGridSelect label="Eyebrow Style" value={model.eyebrowStyle || "Natural"} options={OPTIONS.eyebrowStyle.map(v => ({ value: v, label: v }))} onChange={(e: any) => updateModel('eyebrowStyle', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label={t('LBL_EYES')} value={model.eyeColor} options={['Brown', 'Hazel', 'Blue', 'Green', 'Grey', 'Amber', 'Violet']} onChange={(e: any) => updateModel('eyeColor', e.target.value)} />
                            <VisualGridSelect label={t('LBL_SKIN_TONE')} value={model.skinTone} options={mapOptions(OPTIONS.skinTone, 'OPT_SKIN')} onChange={(e: any) => updateModel('skinTone', e.target.value)} />
                        </div>
                        
                        {/* GRANULAR STYLING */}
                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label="Eyewear" value={model.glasses} options={OPTIONS.glasses.map(v => ({ value: v, label: v }))} onChange={(e: any) => updateModel('glasses', e.target.value)} />
                            <VisualGridSelect label="Facial Hair" value={model.facialHair} options={OPTIONS.facialHair.map(v => ({ value: v, label: v }))} onChange={(e: any) => updateModel('facialHair', e.target.value)} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label={t('LBL_VIBE')} value={model.visualVibe} options={OPTIONS.visualVibe.map(v => ({ value: v, label: v }))} onChange={(e: any) => updateModel('visualVibe', e.target.value)} />
                            <Input label="Fashion Aesthetic" value={model.clothingStyle} onChange={(e) => updateModel('clothingStyle', e.target.value)} placeholder="e.g. 90s Grunge, Minimalist Luxury" />
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Aging & Pigment</h4>
                            <BiometricSlider label="Gray Hair Ratio" value={morph.grayScale || 0} onChange={(v) => updateMorph('grayScale', v)} leftLabel="None" rightLabel="White" />
                        </div>

                        <TextArea label={t('LBL_DIST_FEATURES')} value={model.distinctiveFeatures} onChange={(e) => updateModel('distinctiveFeatures', e.target.value)} placeholder="e.g. Freckles across nose, scar on left eyebrow, septum piercing..." className="h-24" />
                    </div>
                )}
            </div>

            {/* --- COMMAND DOCK --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-950/90 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-2 z-50 flex items-center shadow-2xl shadow-pink-900/20">
                 <div className="flex-1 px-4 border-r border-white/10 flex flex-col justify-center">
                     <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Status</span>
                     <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                         <ActivitySquare size={12}/> {isGenerating ? "Synthesizing..." : "System Ready"}
                     </span>
                 </div>
                 
                 <div className="flex-1 px-4 border-r border-white/10 flex flex-col justify-center hidden sm:flex">
                     <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Engine</span>
                     <span className="text-xs font-bold text-white flex items-center gap-1">
                         <Cpu size={12} className="text-pink-400"/> Titan v5.0
                     </span>
                 </div>

                 <div className="pl-2">
                     <Button 
                        onClick={() => generate(GenerationTier.RENDER)} 
                        isLoading={isGenerating}
                        className="h-12 px-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-transform hover:scale-105"
                    >
                        {isGenerating ? "Processing..." : "Generate DNA"} <Zap size={16} className="fill-current"/>
                    </Button>
                 </div>
            </div>

        </div>
    );
});
