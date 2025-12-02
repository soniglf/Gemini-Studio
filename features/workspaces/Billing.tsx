
import React, { memo, useState, useEffect } from 'react';
import { UsageDashboard } from '../billing/UsageDashboard';
import { Button, Card, Input } from '../../components/UI';
import { ShieldCheck, CreditCard, Activity, HardDrive, Archive, Server, Lock, Key, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { KeyVault, KeyHealth } from '../../services/ai/keyVault';
import { useTranslation } from '../../contexts/LanguageContext';
import { useBillingStore } from '../../stores/billingStore';

export const BillingWorkspace = memo(() => {
    const { stats, optimizeStorage, checkStorage } = useBillingStore();
    const [health, setHealth] = useState<KeyHealth | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    
    // Key Management State
    const [newKey, setNewKey] = useState("");
    const [keyType, setKeyType] = useState<'FREE' | 'PAID'>('PAID');
    const [localKeys, setLocalKeys] = useState(KeyVault.getPool());
    
    const { t } = useTranslation();

    const refreshHealth = () => {
        setHealth(KeyVault.getHealth());
        setLocalKeys(KeyVault.getPool());
        checkStorage();
    };

    useEffect(() => {
        refreshHealth();
        const interval = setInterval(refreshHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddKey = () => {
        try {
            KeyVault.addKey(newKey, keyType);
            setNewKey("");
            refreshHealth();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleRemoveKey = (id: string) => {
        if(confirm("Remove this key?")) {
            KeyVault.removeKey(id);
            refreshHealth();
        }
    };

    const handleSmartArchive = async () => {
        if(!confirm("Smart Archive:\n- Compresses 'Sketch' images to JPEG\n- Preserves 'Render' images\n- Frees up browser storage\n\nProceed?")) return;
        setIsOptimizing(true);
        const freed = await optimizeStorage(false); // SAFE mode
        alert(`Archival Complete. Freed ${(freed / 1024 / 1024).toFixed(2)} MB.`);
        setIsOptimizing(false);
    };

    const usagePercent = stats.storageQuota > 0 ? (stats.storageUsage / stats.storageQuota) * 100 : 0;
    const isCritical = usagePercent > 80;
    const isSystemActive = health?.status === 'ACTIVE';

    return (
        <div className="p-4 space-y-8 pb-32">
            <UsageDashboard stats={stats} />
            
            {/* PLATFORM GATEWAY STATUS */}
            <div className="animate-in slide-in-from-bottom-1">
                <div className="flex items-center gap-2 text-emerald-400 mb-4">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('BIL_GATEWAY')}</span>
                </div>

                <div className={`p-6 rounded-xl border flex items-center justify-between ${isSystemActive ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSystemActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isSystemActive ? <Lock size={24} /> : <Server size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {health?.hasEnv ? "Platform Gateway Active" : "System Gateway Offline"}
                            </h3>
                            <p className="text-xs text-white/50">
                                {health?.hasEnv
                                    ? "Primary authentication provided by environment." 
                                    : "No environment key found. Falling back to personal key pool."}
                            </p>
                        </div>
                    </div>
                    
                    {!health?.hasEnv && (
                         <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                            <AlertTriangle size={12} className="text-red-400" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Missing Env Key</span>
                        </div>
                    )}
                    
                    {health?.hasEnv && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <Activity size={12} className="text-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Connected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MANUAL KEY POOL */}
            <div className="animate-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 text-pink-400 mb-4">
                    <Key size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('BIL_POOL')}</span>
                </div>
                
                <Card className="p-6 bg-slate-900/50">
                    <p className="text-xs text-white/50 mb-4">{t('BIL_POOL_DESC')}</p>
                    
                    <div className="flex gap-4 items-end mb-6">
                        <div className="flex-1">
                            <Input 
                                label="Google Gemini API Key" 
                                value={newKey} 
                                onChange={(e) => setNewKey(e.target.value)}
                                placeholder="AIzaSy..."
                                type="password"
                                className="mb-0"
                            />
                        </div>
                        <div className="w-32">
                             <label className="text-[10px] font-bold text-pink-300/70 uppercase tracking-[0.2em] ml-1 mb-2 block">Type</label>
                             <div className="flex bg-slate-800 rounded-lg p-1 border border-white/10">
                                 <button onClick={() => setKeyType('FREE')} className={`flex-1 py-2 text-[10px] font-bold rounded ${keyType === 'FREE' ? 'bg-blue-600 text-white' : 'text-white/40'}`}>FREE</button>
                                 <button onClick={() => setKeyType('PAID')} className={`flex-1 py-2 text-[10px] font-bold rounded ${keyType === 'PAID' ? 'bg-pink-600 text-white' : 'text-white/40'}`}>PAID</button>
                             </div>
                        </div>
                        <Button onClick={handleAddKey} disabled={newKey.length < 10} className="mb-0 h-[46px]">
                            <Plus size={16} /> Add
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {localKeys.length === 0 && <div className="text-center p-4 border border-dashed border-white/10 rounded-lg text-white/30 text-xs">{t('BIL_NO_KEYS')}</div>}
                        
                        {localKeys.map(k => (
                            <div key={k.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2 py-1 rounded text-[9px] font-bold ${k.type === 'FREE' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                        {k.type}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-white/80">{k.key.substr(0, 8)}...{k.key.substr(-4)}</span>
                                        <span className="text-[9px] text-white/30">Added: {new Date(k.addedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveKey(k.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* STORAGE HEALTH */}
            <div className="animate-in slide-in-from-bottom-3">
                 <div className="flex items-center gap-2 text-blue-400 mb-4">
                    <HardDrive size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Local Storage Health</span>
                </div>
                <Card className="p-4 bg-slate-900/50">
                     <div className="flex justify-between items-end mb-2">
                         <div>
                             <h3 className="text-xl font-bold text-white">{(stats.storageUsage / 1024 / 1024).toFixed(0)} MB</h3>
                             <p className="text-[10px] text-white/40">Used of {(stats.storageQuota / 1024 / 1024 / 1024).toFixed(1)} GB Quota</p>
                         </div>
                         <Button onClick={handleSmartArchive} disabled={isOptimizing} className="h-8 text-[10px]" variant={isCritical ? 'danger' : 'secondary'}>
                             {isOptimizing ? 'Archiving...' : <><Archive size={14}/> Smart Archive</>}
                         </Button>
                     </div>
                     <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${usagePercent}%` }}
                        />
                     </div>
                     {isCritical && <p className="text-[10px] text-red-400 mt-2 font-bold animate-pulse">Storage Critical! Run Smart Archive or Export older campaigns.</p>}
                     <p className="text-[9px] text-white/30 mt-2">Local browser storage is limited. Smart Archive compresses draft sketches to JPEG while keeping your high-res renders pristine.</p>
                </Card>
            </div>
        </div>
    );
});
