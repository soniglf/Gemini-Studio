import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { THEME } from '../../data/theme';

export const Label: React.FC<{ children: React.ReactNode }> = memo(({ children }) => (
    <label className={`${THEME.TYPOGRAPHY.LABEL} ml-1 mb-2 block`}>
        {children}
    </label>
));

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', isLoading?: boolean }> = 
    memo(({ className, variant = 'primary', isLoading, children, ...props }) => {
    
    const baseStyles = `relative rounded-lg font-bold tracking-widest flex items-center justify-center gap-2 ${THEME.EFFECTS.TRANSITION} disabled:opacity-50 disabled:cursor-not-allowed`;
    
    let variantStyles = "";
    switch(variant) {
        case 'primary': variantStyles = `${THEME.COLORS.BTN_PRIMARY} hover:${THEME.EFFECTS.GLOW_PINK} py-4`; break;
        case 'secondary': variantStyles = `${THEME.COLORS.BTN_SECONDARY} py-4`; break;
        case 'danger': variantStyles = `${THEME.COLORS.BTN_DANGER} py-2`; break;
        case 'ghost': variantStyles = `${THEME.COLORS.BTN_GHOST} py-2`; break;
    }

    return (
        <button className={`${baseStyles} ${variantStyles} ${className || ''}`} disabled={isLoading || props.disabled} {...props}>
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : children}
        </button>
    );
});

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = memo(({ children, className }) => (
    <div className={`${THEME.COLORS.GLASS_PANEL} rounded-xl overflow-hidden ${className || ''}`}>
        {children}
    </div>
));

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = memo(({ label, className, ...props }) => (
  <div className="flex flex-col mb-6 group w-full">
    <Label>{label}</Label>
    <input
      className={`w-full ${THEME.COLORS.INPUT_BG} ${THEME.COLORS.INPUT_BORDER} border rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none ${THEME.COLORS.INPUT_FOCUS} transition-all backdrop-blur-md font-light ${className || ''}`}
      {...props}
    />
  </div>
));

export const SimpleTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = memo(({ label, className, ...props }) => (
    <div className="flex flex-col mb-6 group w-full">
      <Label>{label}</Label>
      <textarea
        className={`w-full ${THEME.COLORS.INPUT_BG} ${THEME.COLORS.INPUT_BORDER} border rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none ${THEME.COLORS.INPUT_FOCUS} transition-all resize-none h-24 font-light ${className || ''}`}
        {...props}
      />
    </div>
));