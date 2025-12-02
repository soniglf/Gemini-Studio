
import { useState, useEffect } from 'react';
import { UsageStats, GeneratedAsset } from '../types';
import { db } from '../services/db';

const INITIAL_STATS: UsageStats = {
    freeImages: 0, paidImages: 0, 
    freeVideos: 0, paidVideos: 0, 
    estimatedCost: 0, totalTokens: 0 
};

export const useBilling = () => {
    const [stats, setStats] = useState<UsageStats>(INITIAL_STATS);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const s = await db.stats.getStats();
                if (s) setStats(s);
            } catch (e) { console.error("Stats Load Error", e); }
        };
        loadStats();
    }, []);

    // Auto-save on change
    useEffect(() => { 
        if (stats.estimatedCost > 0) db.stats.saveStats(stats); 
    }, [stats]);

    const trackUsage = (asset: GeneratedAsset) => {
        setStats(prev => ({
            ...prev,
            estimatedCost: prev.estimatedCost + asset.cost,
            freeImages: prev.freeImages + (asset.keyType === 'FREE' && asset.type === 'IMAGE' ? 1 : 0),
            paidImages: prev.paidImages + (asset.keyType === 'PAID' && asset.type === 'IMAGE' ? 1 : 0),
            freeVideos: prev.freeVideos + (asset.keyType === 'FREE' && asset.type === 'VIDEO' ? 1 : 0),
            paidVideos: prev.paidVideos + (asset.keyType === 'PAID' && asset.type === 'VIDEO' ? 1 : 0),
        }));
    };

    return { stats, trackUsage };
};
