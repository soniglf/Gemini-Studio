import React from 'react';
import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export const TaskRunner: React.FC = () => {
    const { tasks, removeTask, clearCompleted } = useTaskManagerStore();

    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-6 z-[100] w-72 space-y-2 animate-in slide-in-from-left-4">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    Active Tasks ({tasks.filter(t => t.status === 'running').length})
                </h3>
                <button 
                    onClick={clearCompleted}
                    className="text-[9px] text-white/30 hover:text-white flex items-center gap-1"
                    title="Clear Completed Tasks"
                >
                    <Trash2 size={10} /> Clear
                </button>
            </div>
            {tasks.map((task) => (
                <div key={task.id} className="glass-panel p-3 rounded-lg flex items-start gap-3 relative overflow-hidden">
                    <div className="mt-1">
                        {task.status === 'running' && <Loader2 size={16} className="text-pink-400 animate-spin" />}
                        {task.status === 'completed' && <CheckCircle size={16} className="text-emerald-400" />}
                        {task.status === 'failed' && <XCircle size={16} className="text-red-400" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-white truncate">{task.name}</p>
                        <p className="text-[10px] text-white/50">{task.message || task.status.toUpperCase()}</p>
                    </div>
                    {task.status === 'running' && typeof task.progress === 'number' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500/50">
                            <div 
                                className="h-full bg-pink-500 transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    )}
                    <button onClick={() => removeTask(task.id)} className="absolute top-1 right-1 p-0.5 text-white/20 hover:text-white">
                        <XCircle size={10} />
                    </button>
                </div>
            ))}
        </div>
    );
};
