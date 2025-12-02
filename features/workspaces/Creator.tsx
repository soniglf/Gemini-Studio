import React, { memo, useState, useEffect } from 'react';
import { ModelAttributes, GenerationTier, ModelMorphology } from '../../types';
import { Button, Input, VisualGridSelect, ImageUpload, BiometricSlider } from '../../components/UI';
import { Plus, Trash2, Zap, Camera, Mars, Venus, Copy, Fingerprint, Activity, ScanFace, Dna, FileDigit, Microscope } from 'lucide-react';
import { OPTIONS, DEFAULT_MORPHOLOGY } from '../../data/constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useModelStore } from '../../stores/modelStore';
import { useGenerationStore } from '../../stores/generationStore';
import { analyzeReferences } from '../../services/geminiService';
import { useUIStore } from '../../stores/uiStore';

export const CreatorWorkspace = memo(() => {
    const { model, setModel, savedModels, createProfile, deleteProfile, forkProfile } = useModelStore();
    const { generate } = useGenerationStore();
    const { addToast, setBioFocus, setPreviewTab } = useUIStore();
    const { t } = useTranslation();
    
    // TAB STATE
    const [activeTab, setActiveTab] = useState<'BIO' | 'BODY' | 'FACE'>('BIO');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- CEREBRO CONECTADO: Sync UI Store para el visualizador ---
    useEffect(() => {
        // 1. Mapear la pestaña activa al "Foco del Visualizador"
        if (activeTab === 'BIO') setBioFocus('BIO');   // Activa la Vista Lateral (Perfil)
        if (activeTab === 'BODY') setBioFocus('BODY'); // Activa Vista Frontal (Cuerpo)
        if (activeTab === 'FACE') setBioFocus('FACE'); // Activa Vista Frontal (Cara)

        // 2. Forzar que el Panel de Previsualización muestre el Visualizador (BIO tab)
        // en lugar de la última imagen generada (ASSET tab)
        setPreviewTab('BIO');
    }, [activeTab, setBioFocus, setPreviewTab]);

    if(!model) return null;

    // Ensure morphology exists
    const morph = model.morphology || DEFAULT_MORPHOLOGY;

    const updateModel = (field: keyof ModelAttributes, value: any) => {
        setModel({ ...model, [field]: value });
    };

    const updateMorph = (field: keyof ModelMorphology, value: number) => {
        setModel({ ...model, morphology: { ...morph, [field]: value } });
    };

    const toggleReferenceImage = (url: string | null) => {
        if (!url) return;
        const current = model.referenceImages || [];
        if (current.includes(url)) {
            updateModel('referenceImages', current.filter(u => u !== url));
        } else {
            if (current.length >= 8) return addToast("Max 8 reference images", 'warning');
            updateModel('referenceImages', [...current, url]);
        }
    };
    
    const handleAutoAnalyze = async () => {
        const refs = model.referenceImages || [];
        if(refs.length === 0) return addToast("Upload reference images first", 'warning');
        
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeReferences(refs);
            setModel({
                ...model,
                ...analysis,
                morphology: { ...model.morphology, ...analysis.morphology } 
            });
            addToast("Identity Analysis Complete", 'success');
        } catch(e) {
            addToast("Analysis failed", 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const displayRefImages = model.referenceImages || [];
    const mapOptions = (opts: string[], prefix: string) => opts.map(v => ({
        value: v,
        label: t(`${prefix}_${v.toUpperCase().replace(/ /g, '_').replace(/[^A-Z_]/g, '')}`) || v
    }));

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            
            {/* HEADER: Subject Control */}
            <div className="bg-[#0B1121] border border-white/10 rounded-xl p-4 shadow-lg">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Fingerprint className="text-emerald-400" size={18} />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Active Specimen</span>
                        </div>
                        <p className="text-[10px] font-mono text-white/30">{model.id.slice(-8).toUpperCase()}</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <select 
                            value={model.id} 
                            onChange={(e) => { const f = savedModels.find((m) => m.id === e.target.value); if(f) setModel(f); }} 
                            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-pink-500/50 hover:border-white/20 transition-colors"
                        >
                            {savedModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.name} {m.id === model.id ? '●' : ''}</option>
                            ))}
                        </select>
                        <button onClick={createProfile} className="px-3 bg-slate-800 rounded-lg text-white/50 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="New Subject"><Plus size={16}/></button>
                    </div>

                    <div className="flex gap-1 justify-end border-t border-white/5 pt-2">
                        <button onClick={forkProfile} className="text-[10px] text-white/30 hover:text-white flex items-center gap-1 px-2 py-1"><Copy size={10}/> Duplicate</button>
                        <button onClick={deleteProfile} className="text-[10px] text-white/30 hover:text-red-400 flex items-center gap-1 px-2 py-1"><Trash2 size={10}/> Delete</button>
                    </div>
                </div>
            </div>

            {/* TAB NAV */}
            <div className="flex border-b border-white/5 sticky top-0 bg-[#030712]/90 backdrop-blur z-30">
                {[
                    { id: 'BIO', label: 'Bio-Data', icon: FileDigit },
                    { id: 'BODY', label: 'Morphology', icon: Activity },
                    { id: 'FACE', label: 'Structure', icon: ScanFace }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative overflow-hidden ${activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white'}`}
                    >
                        <tab.icon size={14} className={activeTab === tab.id ? 'text-pink-400' : ''}/>
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="space-y-8">
                
                {/* --- TAB: BIO-DATA --- */}
                {activeTab === 'BIO' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        
                        {/* DNA SOURCE BANK */}
                        <div className="bg-slate-900/30 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Dna size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">DNA Source Bank</span>
                                </div>
                                <Button onClick={handleAutoAnalyze} isLoading={isAnalyzing} disabled={displayRefImages.length === 0} className="h-6 text-[9px] px-3 bg-blue-600/80 hover:bg-blue-500 border border-blue-400/30">
                                    <Microscope size={10} className="mr-1"/> Analyze DNA
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 relative z-10">
                                {displayRefImages.map((img, i) => (
                                    <div key={i} className="relative aspect-square rounded overflow-hidden border border-white/10 group/img bg-black/50 hover:border-blue-400/50 transition-colors">
                                        <img src={img} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                                        <button 
                                            onClick={() => toggleReferenceImage(img)}
                                            className="absolute top-0.5 right-0.5 bg-black/80 p-0.5 rounded text-white/50 hover:text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                {displayRefImages.length < 8 && (
                                    <div className="relative aspect-square">
                                            <ImageUpload label="" value={null} onChange={(v) => toggleReferenceImage(v)} compact />
                                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-white/20">
                                            <Plus size={16} />
                                            </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label={t('LBL_NAME')} value={model.name} onChange={(e) => updateModel('name', e.target.value)} />
                            <Input label={t('LBL_AGE')} type="number" value={model.age} onChange={(e) => updateModel('age', parseInt(e.target.value) || 24)} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] ml-1">Biological Sex</label>
                            <div className="flex bg-slate-900 rounded-lg p-1 border border-white/10">
                                <button onClick={() => updateModel('gender', 'FEMALE')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-[10px] font-bold uppercase transition-all ${model.gender === 'FEMALE' ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                                    <Venus size={12}/> Female
                                </button>
                                <button onClick={() => updateModel('gender', 'MALE')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-[10px] font-bold uppercase transition-all ${model.gender === 'MALE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                                    <Mars size={12}/> Male
                                </button>
                            </div>
                        </div>

                        <VisualGridSelect label={t('LBL_ETHNICITY')} value={model.ethnicity} options={mapOptions(OPTIONS.ethnicity, 'OPT_ETH')} onChange={(e: any) => updateModel('ethnicity', e.target.value)} />
                        <VisualGridSelect label={t('LBL_STYLE')} value={model.clothingStyle} options={mapOptions(OPTIONS.clothingStyle, 'OPT_STYLE')} onChange={(e: any) => updateModel('clothingStyle', e.target.value)} />
                        <Input label={t('LBL_DIST_FEATURES')} value={model.distinctiveFeatures} onChange={(e) => updateModel('distinctiveFeatures', e.target.value)} placeholder="Scars, Tattoos..." />
                    </div>
                )}

                {/* --- TAB: MORPHOLOGY --- */}
                {activeTab === 'BODY' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono mb-4 text-center">
                            LIVE MESH PREVIEW ACTIVE
                        </div>
                        <section className="space-y-4">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-2">Core Metrics</h4>
                            <BiometricSlider 
                                label="Height" 
                                value={morph.height} 
                                onChange={(v) => updateMorph('height', v)} 
                                min={150} max={210} unit="cm"
                            />
                            <BiometricSlider 
                                label="Mass" 
                                value={morph.weight} 
                                onChange={(v) => updateMorph('weight', v)} 
                                min={45} max={120} unit="kg"
                            />
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">Composition</h4>
                            <BiometricSlider label="Muscle Definition" value={morph.muscle} onChange={(v) => updateMorph('muscle', v)} />
                            <BiometricSlider label={model.gender === 'FEMALE' ? "Curves" : "Waist Ratio"} value={morph.curves} onChange={(v) => updateMorph('curves', v)} />
                            <BiometricSlider label={model.gender === 'FEMALE' ? "Bust" : "Chest"} value={morph.chest} onChange={(v) => updateMorph('chest', v)} />
                        </section>

                        <VisualGridSelect label={t('LBL_PHYSIQUE')} value={model.bodyType} options={mapOptions(OPTIONS.physique, 'OPT_BODY')} onChange={(e: any) => updateModel('bodyType', e.target.value)} />
                    </div>
                )}

                {/* --- TAB: FACIAL --- */}
                {activeTab === 'FACE' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono mb-4 text-center">
                            CRANIAL MESH PREVIEW ACTIVE
                        </div>
                        <section className="space-y-4">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-white/5 pb-2">Bone Structure</h4>
                            <BiometricSlider label="Face Width" value={morph.faceWidth} onChange={(v) => updateMorph('faceWidth', v)} />
                            <BiometricSlider label="Jawline Sharpness" value={morph.jawLine} onChange={(v) => updateMorph('jawLine', v)} />
                            <BiometricSlider label="Cheekbones" value={morph.cheekbones} onChange={(v) => updateMorph('cheekbones', v)} />
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest border-b border-white/5 pb-2">Features</h4>
                            <BiometricSlider label="Eye Size" value={morph.eyeSize} onChange={(v) => updateMorph('eyeSize', v)} />
                            <BiometricSlider label="Nose Size" value={morph.noseSize} onChange={(v) => updateMorph('noseSize', v)} />
                            <BiometricSlider label="Lip Fullness" value={morph.lipFullness} onChange={(v) => updateMorph('lipFullness', v)} />
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            <VisualGridSelect label={t('LBL_HAIR_STYLE')} value={model.hairStyle} options={mapOptions(OPTIONS.hairStyle, 'OPT_HAIR')} onChange={(e: any) => updateModel('hairStyle', e.target.value)} />
                            <VisualGridSelect label={t('LBL_HAIR_COLOR')} value={model.hairColor} options={mapOptions(OPTIONS.hairColor, 'OPT_HCOLOR')} onChange={(e: any) => updateModel('hairColor', e.target.value)} />
                            <VisualGridSelect label={t('LBL_EYES')} value={model.eyeColor} options={mapOptions(OPTIONS.eyeShape, 'OPT_EYE')} onChange={(e: any) => updateModel('eyeColor', e.target.value)} />
                            <VisualGridSelect label={t('LBL_SKIN_TONE')} value={model.skinTone} options={mapOptions(OPTIONS.skinTone, 'OPT_SKIN')} onChange={(e: any) => updateModel('skinTone', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="pt-6 border-t border-white/10 mt-6 grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="h-10 text-[10px]" onClick={() => generate(GenerationTier.SKETCH)}>
                        <Zap size={14} className="text-yellow-400 mr-2"/> Quick Sketch
                    </Button>
                    <Button className="h-10 text-[10px] bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-500/20" onClick={() => generate(GenerationTier.RENDER)}>
                        <Camera size={14} className="mr-2"/> Full Render
                    </Button>
                </div>
            </div>
        </div>
    );
});