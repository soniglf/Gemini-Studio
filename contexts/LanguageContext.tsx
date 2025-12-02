
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, TranslationKey } from '../data/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('EN');

    const t = useCallback((key: TranslationKey | string): string => {
        // Cast to any to allow string fallbacks, but type safety is encouraged via TranslationKey
        return (TRANSLATIONS[language] as any)[key] || key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
    return context;
};
