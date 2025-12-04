import React from 'react';
import { Input, VisualGridSelect } from '../../components/UI';
import { CloneEngine } from './CloneEngine';
import { RealismPanel } from './RealismPanel';
import { GENDER_SPECIFIC } from '../../data/options';
import { useModelStore } from '../../stores/modelStore';
import { ShieldCheck } from 'lucide-react';

export const GeneticsPanel: React.FC = () => {
    const { model, setModel } = useModelStore();

    const update = (field: keyof typeof model, value: any) => {
        setModel({ ...model, [field]: value });
    };

    const genderOptions = model.gender === 'MALE' ? GENDER_SPECIFIC.MALE : GENDER_SPECIFIC.FEMALE;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <CloneEngine />
            
            {model.strictness >= 80 && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-center gap-3 animate-in fade-in">
                    <ShieldCheck className="text-blue-400" size={20} />
                    <div>
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Forensic Lock Active</p>
                        <p className="text-[9px] text-blue-200/50">Anatomy is cloned. Clothing, background, and obstructions are discarded.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* NAME INPUT REMOVED - Now handled in CreatorWorkspace Header */}
                <Input label="Age" type="number" value={model.age} onChange={(e) => update('age', parseInt(e.target.value) || 24)} />
                <VisualGridSelect 
                    label="Ethnicity" 
                    value={model.ethnicity} 
                    options={genderOptions.ethnicity.map(v => ({value:v, label:v}))} 
                    onChange={(e) => update('ethnicity', e.target.value)} 
                />
            </div>
            
            <RealismPanel />
        </div>
    );
};