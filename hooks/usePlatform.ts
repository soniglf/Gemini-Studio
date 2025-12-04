import { useState, useEffect } from 'react';

export const usePlatform = () => {
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        // Simple heuristic for Mac detection
        const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
        setIsMac(platform.toUpperCase().indexOf('MAC') >= 0);
    }, []);

    return { 
        isMac, 
        modifierKey: isMac ? '⌘' : 'Ctrl',
        modifierName: isMac ? 'Command' : 'Ctrl'
    };
};