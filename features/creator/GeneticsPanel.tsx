
import React from 'react';
import { Input, VisualGridSelect } from '../../components/UI';
import { CloneEngine } from './CloneEngine';
import { RealismPanel } from './RealismPanel';
import { OPTIONS } from '../../data/options';
import { useModelStore } from '../../stores/modelStore';

export const GeneticsPanel: React.FC = () => {
    const { model, setModel } = useModelStore();

    const update = (field: keyof typeof model, value: any) => {
        setModel({ ...model, [field]: value });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <CloneEngine />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={model.name} onChange={(e) => update('name', e.target.value)} />
                <Input label="Age" type="number" value={model.age} onChange={(e) => update('age', parseInt(e.target.value) || 24)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <VisualGridSelect 
                    label="Gender" 
                    value={model.gender} 
                    options={[{value: 'FEMALE', label: 'Female'}, {value: 'MALE', label: 'Male'}]} 
                    onChange={(e) => update('gender', e.target.value)} 
                />
                <VisualGridSelect label="Ethnicity" value={model.ethnicity} options={OPTIONS.ethnicity.map(v => ({value:v, label:v}))} onChange={(e) => update('ethnicity', e.target.value)} />
            </div>
            <RealismPanel />
        </div>
    );
};
