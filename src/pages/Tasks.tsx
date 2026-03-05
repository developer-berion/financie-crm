import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import TaskModal from '../components/tasks/TaskModal';
import type { Task } from '../types';

export default function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('tasks')
            .select('*, leads(full_name)')
            .order('due_at', { ascending: true });
        if (data) setTasks(data as Task[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        const initialFetchTimer = window.setTimeout(() => {
            void fetchTasks();
        }, 0);
        return () => window.clearTimeout(initialFetchTimer);
    }, [fetchTasks]);

    async function toggleTask(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

        await supabase.from('tasks').update({
            status: newStatus,
            completed_at: completedAt
        }).eq('id', id);

        void fetchTasks();
    }

    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

    return (
        <div className="space-y-6">
            {/* Integrated Page Header */}
            <div className="border-b border-gray-200 pb-5">
                <div className="flex items-baseline justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestión de tareas y recordatorios
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-primary/20 hover:bg-brand-dark transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Tarea
                        </button>
                        <div className="text-sm font-medium text-gray-500">
                            {pendingTasks} pendientes
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                        <li key={task.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <button onClick={() => toggleTask(task.id, task.status)} className="mr-3 focus:outline-none">
                                        {task.status === 'completed' ? (
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-gray-400" />
                                        )}
                                    </button>
                                    <div>
                                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {task.leads?.full_name ? `Lead: ${task.leads.full_name}` : 'General'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {task.priority === 'high' && <AlertCircle className="h-4 w-4 text-red-500 mr-2" />}
                                    <p className="text-sm text-gray-500">
                                        {task.due_at ? format(new Date(task.due_at), 'dd/MM') : ''}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                    {tasks.length === 0 && !loading && (
                        <li className="px-4 py-8 text-center text-gray-500 text-sm">No hay tareas pendientes.</li>
                    )}
                </ul>
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onTaskCreated={fetchTasks}
            />
        </div>
    );
}
