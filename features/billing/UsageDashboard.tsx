
import React, { memo } from 'react';
import { UsageStats } from '../../types';
import { TrendingUp, DollarSign, Zap, Film } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export const UsageDashboard: React.FC<{ stats: UsageStats }> = memo(({ stats }) => {
    const { t } = useTranslation();
    const agencyRateImage = 350; 
    const agencyRateVideo = 1200;
    
    const valueSaved = (stats.paidImages + stats.freeImages) * agencyRateImage + 
                       (stats.paidVideos + stats.freeVideos) * agencyRateVideo;
    
    const apiCost = stats.estimatedCost;
    const roi = apiCost > 0 ? ((valueSaved - apiCost) / apiCost) * 100 : 0;

    return (
        <div className="w-full space-y-4 mb-8">
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={100} />
                </div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                    <TrendingUp size={14}/> {t('BIL_DASHBOARD')}
                </p>
                <h3 className="text-4xl font-black text-white tracking-tight">
                    ${valueSaved.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    vs. ${apiCost.toFixed(2)} {t('BIL_COST')} ({roi > 0 ? `+${roi.toFixed(0)}%` : '∞'} {t('BIL_ROI')})
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-pink-500/10">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400"><Zap size={18} /></div>
                    <div>
                        <p className="text-[9px] text-pink-400/70 uppercase font-bold">{t('BIL_STUDIO_SHOTS')}</p>
                        <h4 className="text-xl font-bold">{stats.freeImages + stats.paidImages}</h4>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-purple-500/10">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Film size={18} /></div>
                    <div>
                        <p className="text-[9px] text-purple-400/70 uppercase font-bold">{t('BIL_MOTION_CLIPS')}</p>
                        <h4 className="text-xl font-bold">{stats.freeVideos + stats.paidVideos}</h4>
                    </div>
                </div>
            </div>
        </div>
    );
});
