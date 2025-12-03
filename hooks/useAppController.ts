/**
 * @deprecated This hook is deprecated as of Project Sentinel.
 * Its responsibilities have been decentralized for better modularity and performance.
 * - Reactive data loading is now handled by store subscriptions (Project Synapse).
 * - Keyboard shortcuts are now context-aware and handled by individual workspaces.
 * - Global UI state (e.g., mobile detection) has been moved into the main App component.
 * This file can be safely removed in a future cleanup.
 */
import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

export const useAppController = () => {
    // This hook is now a pass-through to prevent breaking the app during refactoring.
    // All logic has been moved.
    const uiState = useUIStore();

    const handleAssetSelect = useCallback(() => {
        // This is now handled by the App component directly.
    }, []);

    return {
        ...uiState,
        handleAssetSelect
    };
};
