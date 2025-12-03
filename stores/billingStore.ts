import { create } from 'zustand';
import { UsageStats, GeneratedAsset } from '../types';
import { db } from '../services/db';
import { StorageService } from '../services/storageService';
import { useTaskManagerStore } from './taskManagerStore'; // Project Apollo

interface BillingState {
    stats: UsageStats;
    loadStats: () => Promise<void>;
    trackUsage: (asset: GeneratedAsset) => void;
    checkStorage: () => Promise<void>;
    optimizeStorage: (aggressive: boolean) => Promise<number>;
}

const INITIAL_STATS: UsageStats = {
    freeImages: 0, paidImages: 0, 
    freeVideos: 0, paidVideos: 0, 
    estimatedCost: 0, totalTokens: 0,
    storageUsage: 0, storageQuota: 0
};

export const useBillingStore = create<BillingState>((set, get) => ({
    stats: INITIAL_STATS,

    loadStats: async () => {
        try {
            const s = await db.stats.getStats();
            const storage = await StorageService.estimate();
            if (s) set({ stats: { ...s, storageUsage: storage.usage, storageQuota: storage.quota } });
            else set({ stats: { ...INITIAL_STATS, storageUsage: storage.usage, storageQuota: storage.quota } });
        } catch (e) { console.error("Stats Load Error", e); }
    },

    checkStorage: async () => {
        const storage = await StorageService.estimate();
        set(state => ({ stats: { ...state.stats, storageUsage: storage.usage, storageQuota: storage.quota } }));
    },

    optimizeStorage: async (aggressive) => {
        const { addTask, updateTask, removeTask } = useTaskManagerStore.getState();
        const taskId = `optimize-${Date.now()}`;
        addTask({ id: taskId, name: 'Optimizing Storage...', status: 'running', progress: 0 });

        try {
            const onProgress = (p: number) => updateTask(taskId, { progress: p });
            const freed = await StorageService.optimizeStorage(aggressive, onProgress);
            await get().checkStorage();
            updateTask(taskId, { status: 'completed', message: `Freed ${(freed / 1024 / 1024).toFixed(2)} MB.` });
            setTimeout(() => removeTask(taskId), 5000);
            return freed;
        } catch (e) {
            updateTask(taskId, { status: 'failed', message: 'Optimization failed.' });
            setTimeout(() => removeTask(taskId), 5000);
            return 0;
        }
    },

    trackUsage: (asset) => {
        set(state => {
            const newStats = {
                ...state.stats,
                estimatedCost: state.stats.estimatedCost + asset.cost,
                freeImages: state.stats.freeImages + (asset.keyType === 'FREE' && asset.type === 'IMAGE' ? 1 : 0),
                paidImages: state.stats.paidImages + (asset.keyType === 'PAID' && asset.type === 'IMAGE' ? 1 : 0),
                freeVideos: state.stats.freeVideos + (asset.keyType === 'FREE' && asset.type === 'VIDEO' ? 1 : 0),
                paidVideos: state.stats.paidVideos + (asset.keyType === 'PAID' && asset.type === 'VIDEO' ? 1 : 0),
            };
            // Side effect: save to DB
            db.stats.saveStats(newStats);
            return { stats: newStats };
        });
        // Check storage after adding new asset
        get().checkStorage();
    }
}));