import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Tasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    async function fetchTasks() {
        setLoading(true);
        const { data } = await supabase
            .from('tasks')
            .select('*, leads(full_name)')
            .order('due_at', { ascending: true });
        if (data) setTasks(data);
        setLoading(false);
    }

    async function toggleTask(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

        await supabase.from('tasks').update({
            status: newStatus,
            completed_at: completedAt
        }).eq('id', id);

        fetchTasks();
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tareas</h1>

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
        </div>
    );
}
