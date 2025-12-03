
import React, { memo } from 'react';
import { Card, Button } from '../../components/UI';
import { ClipboardCheck, XCircle, Plus } from 'lucide-react';
import { AuditReport } from '../../types';

interface AuditPanelProps {
    report: AuditReport | null;
    isAuditing: boolean;
    onRunAudit: () => void;
    onAddMissing: (shots: string[]) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = memo(({ report, isAuditing, onRunAudit, onAddMissing }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-2">
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/10 text-center">
                <ClipboardCheck size={48} className="mx-auto text-emerald-400 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Campaign Intelligence</h2>
                <p className="text-xs text-white/50 mb-6 max-w-xs mx-auto">
                    The Audit Agent analyzes your generated assets against your Brand Bible to find gaps and inconsistency.
                </p>
                <Button onClick={onRunAudit} isLoading={isAuditing} className="bg-emerald-600 hover:bg-emerald-500 mx-auto">
                    Run Full Audit
                </Button>
            </div>

            {report && (
                <div className="space-y-4 animate-in fade-in">
                    <Card className="p-4 bg-slate-900/50 border-emerald-500/20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Campaign Score</span>
                            <span className="text-3xl font-black text-white">{report.score}/100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                            <div className="bg-emerald-500 h-full" style={{ width: `${report.score}%` }} />
                        </div>
                        <p className="text-sm text-white/80 italic">"{report.analysis}"</p>
                    </Card>

                     <Card className="p-4 bg-slate-900/50">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Consistency Check</h3>
                        <p className="text-sm text-white">{report.consistencyCheck}</p>
                    </Card>

                    <Card className="p-4 bg-slate-900/50 border-red-500/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">Missing Shots</h3>
                        <ul className="space-y-2">
                            {report.missingShots.map((shot, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                                    <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                    {shot}
                                </li>
                            ))}
                        </ul>
                        <Button onClick={() => onAddMissing(report.missingShots)} className="w-full mt-4 text-xs h-8" variant="secondary">
                            <Plus size={14}/> Add Missing Shots to Plan
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
});
