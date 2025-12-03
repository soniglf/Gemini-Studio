import { create } from 'zustand';

export interface Task {
    id: string;
    name: string;
    status: 'running' | 'completed' | 'failed';
    progress?: number; // 0-100
    message?: string;
    createdAt: number;
}

interface TaskManagerState {
    tasks: Task[];
    addTask: (task: Omit<Task, 'createdAt'>) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    removeTask: (id: string) => void;
    clearCompleted: () => void;
}

export const useTaskManagerStore = create<TaskManagerState>((set) => ({
    tasks: [],

    addTask: (task) =>
        set((state) => ({
            tasks: [...state.tasks, { ...task, createdAt: Date.now() }],
        })),

    updateTask: (id, updates) =>
        set((state) => ({
            tasks: state.tasks.map((task) =>
                task.id === id ? { ...task, ...updates } : task
            ),
        })),

    removeTask: (id) =>
        set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
        })),

    clearCompleted: () =>
        set((state) => ({
            tasks: state.tasks.filter((task) => task.status === 'running'),
        })),
}));
