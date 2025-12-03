
import { AppMode } from "../types";

export const THEME = {
    COLORS: {
        // Semantic Backgrounds - Lighter for readability
        BG_MAIN: "bg-[#020617]",
        GLASS_PANEL: "bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl",
        GLASS_DROPDOWN: "bg-[#0B1121] border border-white/10 shadow-xl",
        
        // Interactive Elements
        BTN_PRIMARY: "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg",
        BTN_SECONDARY: "bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700",
        BTN_DANGER: "bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20",
        BTN_GHOST: "hover:bg-white/5 text-white/50 hover:text-white",

        // Accents
        ACCENT_PINK: "text-pink-400",
        ACCENT_EMERALD: "text-emerald-400",
        
        // Inputs - High Contrast
        INPUT_BG: "bg-slate-800/50",
        INPUT_BORDER: "border-white/10",
        INPUT_FOCUS: "focus:border-pink-500/50 focus:bg-slate-800/80 focus:shadow-[0_0_20px_rgba(236,72,153,0.1)]"
    },
    TYPOGRAPHY: {
        LABEL: "text-[10px] font-bold text-pink-300/80 uppercase tracking-[0.2em]",
        H1: "font-bold text-lg tracking-widest brand-font",
        H2: "text-xl font-bold cyber-font tracking-wider",
        MONO: "font-mono text-xs",
    },
    EFFECTS: {
        GLOW_PINK: "shadow-[0_0_20px_rgba(236,72,153,0.4)]",
        TRANSITION: "transition-all duration-200",
    }
};

// Reactive Theme Definitions for App Modes
export const MODE_COLORS = {
    [AppMode.CREATOR]: { primary: '#ec4899', secondary: '#8b5cf6' }, // Pink/Purple
    [AppMode.STUDIO]: { primary: '#06b6d4', secondary: '#3b82f6' }, // Cyan/Blue
    [AppMode.INFLUENCER]: { primary: '#f59e0b', secondary: '#f43f5e' }, // Amber/Rose (Golden Hour)
    [AppMode.MOTION]: { primary: '#8b5cf6', secondary: '#6366f1' }, // Violet/Indigo
    [AppMode.DIRECTOR]: { primary: '#10b981', secondary: '#0ea5e9' }, // Emerald/Sky
    [AppMode.GALLERY]: { primary: '#64748b', secondary: '#94a3b8' }, // Slate
    [AppMode.BILLING]: { primary: '#22c55e', secondary: '#eab308' }, // Green/Yellow
};
