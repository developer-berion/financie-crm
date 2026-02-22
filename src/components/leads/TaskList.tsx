import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';
import { cn } from '../../lib/utils';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { toast } from 'sonner';

interface TaskListProps {
    tasks: Task[];
    onTaskCompleted: () => void;
    onAddTask?: () => void;
}

export default function TaskList({ tasks, onTaskCompleted, onAddTask }: TaskListProps) {
    const completeTask = async (taskId: string) => {
        // Optimistic UI could be handled by parent, but here we do simple feedback
        const { error } = await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', taskId);

        if (error) {
            toast.error('Error al completar la tarea');
            return;
        }

        toast.success('Tarea completada');
        onTaskCompleted();
    };

    if (tasks.length === 0 && !onAddTask) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden animate-in fade-in duration-500">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Próximas Tareas</h3>
                </div>
                {onAddTask && (
                    <button
                        onClick={onAddTask}
                        className="px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary text-[11px] font-bold hover:bg-brand-primary/20 transition-all flex items-center gap-1.5"
                    >
                        <span>+ Nueva Tarea</span>
                    </button>
                )}
            </div>

            <div className="divide-y divide-gray-50">
                {tasks.map((task) => {
                    const due = task.due_at ? new Date(task.due_at) : null;
                    const overdue = due ? due < new Date() : false;
                    const today = due ? isToday(due) : false;

                    return (
                        <div
                            key={task.id}
                            className="p-4 flex items-center justify-between group hover:bg-brand-bg/20 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => completeTask(task.id)}
                                    className="mt-1 w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center group/btn hover:border-brand-primary hover:bg-brand-primary/10 transition-all"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white group-hover/btn:text-brand-primary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                </button>
                                <div>
                                    <p className={cn(
                                        "text-sm font-semibold mb-0.5",
                                        overdue ? "text-red-700" : "text-gray-900"
                                    )}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 capitalized">
                                            {overdue ? (
                                                <span className="flex items-center gap-1 text-red-500">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Atrasada
                                                </span>
                                            ) : today ? (
                                                <span className="flex items-center gap-1 text-yellow-600">
                                                    <Clock className="w-3 h-3" />
                                                    Hoy
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 opacity-60" />
                                                    Planeado
                                                </span>
                                            )}
                                            <span>•</span>
                                            <span>{due ? format(due, "d 'de' MMM, HH:mm", { locale: es }) : 'Por definir'}</span>
                                        </div>
                                        {task.priority === 'high' && (
                                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                                                Alta
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => completeTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-dark transition-all shadow-md active:scale-95"
                            >
                                Completar
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
