import { useProjectStore } from '../stores/projectStore';
import { useModelStore } from '../stores/modelStore';
import { useBillingStore } from '../stores/billingStore';
import { useDirectorStore } from '../stores/directorStore';
import { usePresetStore } from '../stores/presetStore';
import { useStudioSettingsStore } from '../stores/studioSettingsStore';
import { useInfluencerSettingsStore } from '../stores/influencerSettingsStore';
import { useMotionSettingsStore } from '../stores/motionSettingsStore';

/**
 * Project Phoenix: Resilient State Hydration
 * This service is responsible for initializing the application's state from
 * various sources (IndexedDB, localStorage) in a safe and controlled manner.
 * It prevents crashes by handling data corruption and version mismatches.
 */
export class StateHydrator {
    /**
     * Boots the application by loading all necessary data.
     * Zustand's persist middleware with onRehydrateStorage handles the
     * version checking and potential resetting of localStorage stores.
     * This function's primary role is to trigger the initial load of
     * data from IndexedDB.
     */
    static async bootApp(): Promise<void> {
        console.log("[Phoenix] Booting application state...");
        try {
            // Trigger loading from IndexedDB.
            // These stores do not use `persist` middleware, so they load manually.
            await useProjectStore.getState().loadProjects();
            await useModelStore.getState().loadModels();
            await useBillingStore.getState().loadStats();

            // The persisted stores (Director, Presets, Settings) will auto-hydrate
            // and self-correct based on their internal version checks. We don't
            // need to call them explicitly here.

            console.log("[Phoenix] Boot sequence complete.");
        } catch (error) {
            console.error("[Phoenix] Critical boot failure:", error);
            // In a real production app, we might want to display a fallback error UI
            // or trigger a hard reset here. The ErrorBoundary will catch this for now.
            throw new Error("Failed to initialize application state.");
        }
    }
}
