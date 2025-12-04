
import React, { useState, useRef, useEffect, memo } from 'react';
import { ChevronDown, Check, Upload, ZoomIn, Mic, MicOff, Loader2, Cloud, Sliders, ChevronRight, AlertCircle, X, Copy } from 'lucide-react';
import { Label } from './atoms';
import { RichOption } from './types';
import { useSpeech } from '../../hooks/useSpeech';
import { ImageOptimizer } from '../../services/utils/imageOptimizer';
import { useUIStore } from '../../stores/uiStore';
import { GoogleDriveService } from '../../services/integrations/googleDrive';

// ... [DebouncedInput, TextArea, VisualGridSelect remain unchanged] ...
export const DebouncedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, delay?: number }> = memo(({ label, value, onChange, delay = 800, className, ...props }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const { isListening, transcript, startListening, stopListening, error: speechError } = useSpeech();
    const { addToast } = useUIStore();
    
    useEffect(() => { setLocalValue(value); }, [value]);

    useEffect(() => {
        if (speechError) addToast(speechError, 'error');
    }, [speechError, addToast]);

    useEffect(() => {
        if (transcript && onChange) {
            const newValue = (localValue ? localValue + " " : "") + transcript;
            setLocalValue(newValue);
            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
        }
    }, [transcript]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value && onChange) {
                const event = { target: { value: localValue } } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
            }
        }, delay);
        return () => clearTimeout(handler);
    }, [localValue, delay, onChange, value]);

    const handleClear = () => {
        setLocalValue("");
        if (onChange) onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
        <div className="flex flex-col mb-6 group w-full">
            <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] ml-1 mb-2 block transition-colors duration-300 ${isFocused ? 'text-pink-400' : 'text-pink-300/80'}`}>
                    {label}
                </label>
                <button 
                    onClick={isListening ? stopListening : startListening}
                    className={`text-[10px] flex items-center gap-1 transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-white/30 hover:text-white'}`}
                    title="Voice Input"
                >
                    {isListening ? <MicOff size={10} /> : <Mic size={10} />}
                </button>
            </div>
            <div className="relative group/field">
                <input
                    className={`w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 pr-10 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/50 focus:bg-slate-800/80 focus:shadow-[0_0_20px_rgba(236,72,153,0.1)] transition-all ${className || ''}`}
                    {...props}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                
                {localValue && (
                    <button 
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                    >
                        <X size={12} />
                    </button>
                )}
                
                <div className="absolute inset-0 rounded-lg ring-1 ring-white/0 pointer-events-none group-focus-within/field:ring-white/10 transition-all"></div>
            </div>
        </div>
    );
});

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = memo(({ label, className, value, onChange, maxLength, ...props }) => {
    const { isListening, transcript, startListening, stopListening, error: speechError } = useSpeech();
    const { addToast } = useUIStore();
    const [isFocused, setIsFocused] = useState(false);

    const currentLength = String(value || "").length;
    const isNearLimit = maxLength && currentLength > maxLength * 0.9;
    const limitColor = isNearLimit ? 'text-red-400' : 'text-white/20';

    useEffect(() => {
        if (speechError) addToast(speechError, 'error');
    }, [speechError, addToast]);
    
    useEffect(() => {
        if (transcript && onChange) {
            const newValue = (value ? value + " " : "") + transcript;
            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
        }
    }, [transcript]);

    const handleClear = () => {
        if (onChange) onChange({ target: { value: "" } } as React.ChangeEvent<HTMLTextAreaElement>);
    };

    return (
        <div className="flex flex-col mb-6 group w-full">
            <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] ml-1 mb-2 block transition-colors duration-300 ${isFocused ? 'text-pink-400' : 'text-pink-300/80'}`}>
                    {label}
                </label>
                <div className="flex items-center gap-3">
                    {maxLength && (
                        <span className={`text-[9px] font-mono transition-colors ${limitColor}`}>
                            {currentLength} / {maxLength}
                        </span>
                    )}
                    <button 
                        onClick={isListening ? stopListening : startListening}
                        className={`text-[10px] flex items-center gap-1 transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-white/30 hover:text-white'}`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={10} /> : <Mic size={10} />} {isListening ? 'Listening...' : ''}
                    </button>
                </div>
            </div>
            <div className="relative">
                <textarea
                    className={`w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 pr-8 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/50 focus:bg-slate-800/80 focus:shadow-[0_0_20px_rgba(236,72,153,0.1)] transition-all resize-none h-24 font-light ${className || ''}`}
                    value={value}
                    onChange={onChange}
                    maxLength={maxLength}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {value && (
                    <button 
                        onClick={handleClear}
                        className="absolute right-3 top-3 text-white/20 hover:text-white transition-colors p-1"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
    );
});

export const VisualGridSelect: React.FC<{ label: string, options: (string | RichOption)[], value: string, onChange: (e: { target: { value: string } }) => void, placeholder?: string, editable?: boolean }> = memo(({ label, options, value, onChange, placeholder = "Select...", editable = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const safeOptions = options || [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if(isOpen && listRef.current) {
            const selected = listRef.current.querySelector('[aria-selected="true"]');
            if(selected) selected.scrollIntoView({ block: 'nearest' });
        }
    }, [isOpen]);

    const handleSelect = (opt: string | RichOption) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        onChange({ target: { value: val } });
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        // Optional: Open dropdown on type
        // if (!isOpen) setIsOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !editable) {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'ArrowDown') {
             if(!editable) e.preventDefault();
             if(!isOpen) setIsOpen(true);
        }
    };

    const currentOpt = safeOptions.find(o => (typeof o === 'string' ? o : o.value) === value);
    const displayLabel = typeof currentOpt === 'string' ? currentOpt : currentOpt?.label || value;

    return (
        <div className="flex flex-col mb-6 relative group w-full" ref={containerRef}>
            <label className={`text-[10px] font-bold uppercase tracking-[0.2em] ml-1 mb-2 block transition-colors duration-300 ${isOpen ? 'text-pink-400' : 'text-pink-300/80'}`}>
                {label}
            </label>
            
            <div className="relative">
                {editable ? (
                    <div className="relative flex items-center">
                        <input
                            className={`w-full bg-slate-800/50 border border-white/10 rounded-lg pl-4 pr-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/50 focus:bg-slate-800/80 transition-all font-light ${isOpen ? 'border-pink-500/30' : ''}`}
                            value={value}
                            onChange={handleInputChange}
                            onFocus={() => setIsOpen(true)}
                            placeholder={placeholder}
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute right-0 top-0 bottom-0 px-3 text-white/30 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                ) : (
                    <button 
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        aria-label={label}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-left text-white flex justify-between items-center hover:bg-slate-800/80 hover:border-pink-500/30 transition-all focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 shadow-sm"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {typeof currentOpt !== 'string' && currentOpt?.visual && (
                                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: currentOpt.visual }}></div>
                            )}
                            <span className="truncate font-light">{displayLabel || placeholder}</span>
                        </div>
                        <ChevronDown size={14} className={`text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
                
                {isOpen && (
                    <div 
                        ref={listRef}
                        role="listbox" 
                        className="absolute top-[110%] left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 z-[9999] animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {safeOptions.map((opt, idx) => {
                                const isRich = typeof opt !== 'string';
                                const val = isRich ? (opt as RichOption).value : (opt as string);
                                const label = isRich ? (opt as RichOption).label : (opt as string);
                                const visual = isRich ? (opt as RichOption).visual : null;
                                const isSelected = value === val;
                                return (
                                    <div 
                                        key={idx} 
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt)}
                                        className={`relative p-3 rounded-lg cursor-pointer border transition-all flex flex-col gap-1.5 ${isSelected ? 'bg-pink-500/10 border-pink-500/50' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                 {visual && <div className="w-3 h-3 rounded-full border border-white/10" style={{ background: visual }}></div>}
                                                 <span className={`text-xs font-bold ${isSelected ? 'text-pink-400' : 'text-slate-200'}`}>{label}</span>
                                            </div>
                                            {isSelected && <Check size={12} className="text-pink-500" />}
                                        </div>
                                        {isRich && (opt as RichOption).desc && <p className="text-[9px] text-white/40 leading-tight">{(opt as RichOption).desc}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export const ImageUpload: React.FC<{ label: string, value: string | null, onChange: (val: string | null) => void, compact?: boolean, className?: string }> = memo(({ label, value, onChange, compact, className }) => {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { addToast } = useUIStore();

    const processFile = async (file: File) => {
        setIsOptimizing(true);
        try {
            const optimizedDataUrl = await ImageOptimizer.optimize(file);
            onChange(optimizedDataUrl);
        } catch (err) {
            console.error("Image processing failed", err);
            addToast("Failed to process image", 'error');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrivePick = async () => {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const apiKey = process.env.API_KEY; 
        
        if (!clientId || !apiKey) {
            addToast("Integration Error: Client ID or API Key missing.", 'error');
            return;
        }

        try {
            const file = await GoogleDriveService.pickFile(clientId, apiKey);
            if (file) {
                await processFile(file);
            }
        } catch (e: any) {
            console.error("Drive Error", e);
            addToast(e.message || "Failed to load from Drive", 'error');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await processFile(file);
        } else {
            addToast("Please drop an image file", 'warning');
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if(file) await processFile(file);
                return;
            }
        }
    };

    return (
        <div className={`flex flex-col w-full ${className !== undefined ? className : 'mb-6'}`}>
             <div className="flex items-center justify-between mb-2">
                {label && <Label>{label}</Label>}
                {process.env.GOOGLE_CLIENT_ID && (
                    <button 
                        onClick={handleDrivePick}
                        className="text-[10px] flex items-center gap-1 text-white/30 hover:text-emerald-400 transition-colors"
                        title="Import from Google Drive"
                    >
                        <Cloud size={12} /> Drive
                    </button>
                )}
             </div>
             
             {value ? (
                 <div className={`relative ${compact ? 'w-full h-24' : 'w-24 h-24'} rounded-lg overflow-hidden border border-white/20 group shadow-lg`}>
                     <img src={value} alt="Ref" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => onChange(null)} className="text-xs text-white bg-red-500 px-2 py-1 rounded">Remove</button>
                     </div>
                 </div>
             ) : (
                <div className="flex gap-2">
                    <label 
                        className={`
                            flex-1 flex flex-col items-center justify-center ${compact ? 'h-24' : 'w-24 h-24'} 
                            border-2 border-dashed rounded-lg cursor-pointer transition-all group relative overflow-hidden outline-none
                            ${isDragging ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-slate-800/30 hover:border-pink-500/50 hover:bg-slate-800/50'}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onPaste={handlePaste}
                        tabIndex={0}
                    >
                        {isOptimizing ? (
                            <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                        ) : (
                            <>
                                <Upload className={`w-5 h-5 transition-colors ${isDragging ? 'text-pink-400' : 'text-white/20 group-hover:text-pink-400'}`} />
                                <span className={`text-[9px] mt-2 uppercase tracking-widest transition-colors ${isDragging ? 'text-pink-300' : 'text-white/20'}`}>
                                    {isDragging ? 'Drop' : 'Drop or Paste'}
                                </span>
                            </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={isOptimizing} />
                    </label>
                </div>
             )}
        </div>
    );
});

// ... [VisualAspectSelect, ZoomableImage, BiometricSlider, SliderGroup remain unchanged] ...
export const VisualAspectSelect: React.FC<{ value: string; onChange: (val: string) => void; label: string }> = memo(({ value, onChange, label }) => {
    const aspects = [{ id: "1:1", w: 8, h: 8 }, { id: "3:4", w: 9, h: 12 }, { id: "16:9", w: 16, h: 9 }, { id: "9:16", w: 9, h: 16 }];
    return (
        <div className="flex flex-col mb-6 w-full">
            <Label>{label}</Label>
            <div className="flex gap-2 bg-slate-800/50 p-2 rounded-lg border border-white/10">
                {aspects.map(asp => (
                    <button key={asp.id} onClick={() => onChange(asp.id)} className={`flex flex-col items-center p-2 rounded transition-all flex-1 ${value === asp.id ? 'bg-white/10 text-white' : 'text-white/30 hover:bg-white/5'}`}>
                        <div className="border border-current rounded-sm mb-1" style={{ width: `${asp.w}px`, height: `${asp.h}px` }}></div>
                        <span className="text-[9px] font-bold">{asp.id}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

export const ZoomableImage = ({ src, className, onZoomChange }: { src: string, className?: string, onZoomChange?: (zoomed: boolean) => void }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!imgRef.current) return;
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setPosition({ x, y });
    };

    const handleToggle = () => {
        const newState = !isZoomed;
        setIsZoomed(newState);
        if (onZoomChange) onZoomChange(newState);
    };

    return (
        <div 
            className={`relative overflow-hidden cursor-zoom-in group ${className}`}
            onMouseMove={handleMouseMove}
            onClick={handleToggle}
        >
            <img 
                ref={imgRef}
                src={src} 
                className={`w-full h-full object-contain transition-opacity duration-200 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
                alt="Generated content"
            />
            {isZoomed && (
                <div 
                    className="absolute inset-0 w-full h-full pointer-events-none bg-no-repeat"
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundPosition: `${position.x}% ${position.y}%`,
                        backgroundSize: '250%' // 2.5x Zoom
                    }}
                />
            )}
            {!isZoomed && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/50 p-2 rounded-full backdrop-blur"><ZoomIn className="text-white"/></div>}
        </div>
    );
});

export const BiometricSlider: React.FC<{ label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, unit?: string, leftLabel?: string, rightLabel?: string, formatValue?: (v:number) => string }> = memo(({ label, value, onChange, min = 0, max = 100, unit = '%', leftLabel, rightLabel, formatValue }) => {
    // Smart Display
    const displayValue = formatValue ? formatValue(value) : value;
    const isFormatted = !!formatValue;
    
    // Dynamic Gradient: Cool Blue (Low) -> Balanced Purple (Mid) -> Intense Pink (High)
    const getGradient = () => {
        const pct = (value - min) / (max - min);
        if (pct < 0.5) return 'from-blue-600 to-purple-600';
        return 'from-purple-600 to-pink-500';
    };

    return (
        <div className="mb-4 group select-none relative">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] transition-colors group-hover:text-pink-300">{label}</span>
                <div className="flex items-center gap-1">
                     {isFormatted ? (
                         <span className="text-[10px] font-mono text-emerald-400 bg-slate-800 border border-white/10 rounded px-2 py-0.5 shadow-sm">{displayValue}</span>
                     ) : (
                         <>
                             <input 
                                type="number"
                                min={min} max={max}
                                value={value}
                                onChange={(e) => { const v = parseInt(e.target.value); if(!isNaN(v)) onChange(Math.max(min, Math.min(max, v))); }}
                                className="bg-slate-800 border border-white/10 rounded text-right text-[10px] font-mono text-emerald-400 w-10 py-0.5 focus:outline-none focus:border-emerald-500 transition-all"
                             />
                             <span className="text-[9px] text-white/30 font-mono">{unit}</span>
                         </>
                     )}
                </div>
            </div>
            
            <div 
                className="relative h-6 flex items-center group/track cursor-pointer"
                onDoubleClick={() => onChange(50)} // Smart Reset
                title="Double click to reset to 50%"
            >
                {/* Track */}
                <div className="absolute w-full h-1 bg-black/40 border border-white/5 rounded-full overflow-hidden group-hover/track:h-1.5 transition-all duration-300 shadow-inner">
                    <div 
                        className={`h-full bg-gradient-to-r ${getGradient()} transition-all duration-75 ease-out`} 
                        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                    />
                </div>
                
                {/* Precise Ticks */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5 opacity-0 group-hover/track:opacity-40 transition-opacity duration-300">
                    <div className="w-px h-2 bg-white/50 mt-2"></div>
                    <div className="w-px h-3 bg-white/80 mt-1.5"></div> {/* Midpoint */}
                    <div className="w-px h-2 bg-white/50 mt-2"></div>
                </div>

                {/* Input */}
                <input 
                    type="range" 
                    min={min} max={max} 
                    value={value} 
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {/* Haptic Thumb Visual - Fast Physics */}
                <div 
                    className="absolute h-3 w-3 bg-[#0B1121] border border-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none transition-all duration-75 ease-out group-hover/track:scale-125 group-active/track:scale-150 group-active/track:border-pink-400 group-active/track:shadow-[0_0_15px_rgba(236,72,153,0.8)]"
                    style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
                />
            </div>
            
            {/* Anchors */}
            {(leftLabel || rightLabel) && (
                <div className="flex justify-between mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[8px] text-white/30 uppercase font-bold">{leftLabel}</span>
                    <span className="text-[8px] text-white/30 uppercase font-bold">{rightLabel}</span>
                </div>
            )}
        </div>
    );
});

export const SliderGroup: React.FC<{ title: string, children: React.ReactNode, icon?: React.ElementType }> = memo(({ title, children, icon: Icon }) => (
    <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-slate-900/60 group">
        <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-3">
            {Icon && <div className="p-1.5 rounded bg-pink-500/10 text-pink-400 group-hover:text-white group-hover:bg-pink-500 transition-colors duration-300"><Icon size={14}/></div>}
            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">{title}</h4>
        </div>
        <div className="p-4 grid gap-4">
            {children}
        </div>
    </div>
));
