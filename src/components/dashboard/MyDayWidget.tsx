import { useState } from 'react';
import { CheckCircle2, Circle, Video, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface Task {
    id: string;
    lead_id: string | null;
    title: string;
    due_at: string;
    status: string;
    type?: 'call' | 'email' | 'meeting' | 'task';
    lead_name?: string;
}

interface Appointment {
    id: string;
    lead_id: string | null;
    start_time: string;
    meeting_url?: string | null;
    lead_name?: string;
}

interface MyDayWidgetProps {
    tasks: Task[];
    appointments: Appointment[];
    onTaskUpdate?: () => void;
}

export default function MyDayWidget({ tasks, appointments, onTaskUpdate }: MyDayWidgetProps) {
    const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

    const handleToggleTask = async (taskId: string) => {
        setCompletingIds((prev) => new Set(prev).add(taskId));

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', taskId);

            if (error) throw error;

            toast.success('Tarea completada');
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Error al completar la tarea');
        } finally {
            setCompletingIds((prev) => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const isEmpty = tasks.length === 0 && appointments.length === 0;

    if (isEmpty) {
        return (
            <div className="bg-white rounded-2xl border border-brand-border p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-brand-primary">¡Todo al día! 🎉</h3>
                <p className="text-sm text-brand-text/60 mt-2 max-w-[240px]">
                    No tienes tareas ni citas pendientes para hoy. Viaja seguro.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-brand-border h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-brand-primary">Mi Agenda de Hoy</h2>
                    <p className="text-xs text-brand-text/50 capitalize">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                </div>
                <div className="flex gap-1">
                    {appointments.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {appointments.length} Cita{appointments.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    {tasks.length > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {tasks.length} Tarea{tasks.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                {/* Appointments Section */}
                {appointments.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-brand-text/40 uppercase tracking-wider px-2">Citas</h3>
                        {appointments.map((appt) => (
                            <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 group transition-all hover:border-blue-200">
                                <div className="shrink-0 w-12 text-center">
                                    <span className="text-xs font-bold text-blue-700 block">
                                        {format(new Date(appt.start_time), 'HH:mm')}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/leads/${appt.lead_id}`} className="text-sm font-semibold text-brand-text hover:text-brand-primary transition-colors truncate block">
                                        {appt.lead_name || 'Lead'}
                                    </Link>
                                    <p className="text-[10px] text-blue-600 flex items-center gap-1">
                                        <Video className="h-3 w-3" /> Videollamada
                                    </p>
                                </div>
                                {appt.meeting_url && (
                                    <a href={appt.meeting_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                                        <Video className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Tasks Section */}
                {tasks.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-brand-text/40 uppercase tracking-wider px-2">Tareas Pendientes</h3>
                        {tasks.map((task) => {
                            const isOverdue = isPast(new Date(task.due_at)) && !isToday(new Date(task.due_at));
                            const isCompleting = completingIds.has(task.id);

                            return (
                                <div key={task.id} className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all group",
                                    isOverdue ? "border-red-100 bg-red-50/20" : "border-gray-100 hover:border-brand-border"
                                )}>
                                    <button
                                        onClick={() => handleToggleTask(task.id)}
                                        disabled={isCompleting}
                                        className="shrink-0 text-brand-text/20 hover:text-brand-primary transition-colors disabled:opacity-50"
                                    >
                                        {isCompleting ? (
                                            <div className="h-5 w-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                                        ) : (
                                            <Circle className="h-5 w-5" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link to={`/leads/${task.lead_id}`} className="text-sm font-semibold text-brand-text hover:text-brand-primary transition-colors truncate">
                                                {task.lead_name || 'Lead'}
                                            </Link>
                                            {isOverdue && (
                                                <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase">Atrasado</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-brand-text/60 truncate">{task.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-[10px] font-medium",
                                            isOverdue ? "text-red-600" : "text-brand-text/40"
                                        )}>
                                            {isToday(new Date(task.due_at)) ? 'Hoy' : format(new Date(task.due_at), 'd MMM', { locale: es })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-brand-border">
                <Link to="/tasks" className="text-xs font-semibold text-brand-primary flex items-center justify-center gap-1 hover:underline">
                    Ver todas las tareas <ChevronRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
