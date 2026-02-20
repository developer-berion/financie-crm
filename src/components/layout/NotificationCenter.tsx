import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, AlertTriangle, ChevronRight, Inbox } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';
import { cn } from '../../lib/utils';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();

        // Realtime subscription for tasks
        const channel = supabase
            .channel('notification-tasks')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tasks'
            }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    async function fetchTasks() {
        const { data } = await supabase
            .from('tasks')
            .select('*, leads(id, full_name)')
            .eq('status', 'pending')
            .order('due_at', { ascending: true })
            .limit(20);

        if (data) {
            setTasks(data);
            // Count overdue or due today as "urgent" for the badge
            const urgentCount = data.filter(t => {
                if (!t.due_at) return false;
                const d = new Date(t.due_at);
                return d < new Date() || isToday(d);
            }).length;
            setUnreadCount(urgentCount);
        }
    }

    const handleTaskClick = (leadId: string | null) => {
        if (leadId) {
            navigate(`/leads/${leadId}`);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-400 hover:text-brand-primary hover:bg-gray-100 transition-all duration-200"
                aria-label="Notificaciones"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-in zoom-in duration-300">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-brand-primary" />
                            Tareas Pendientes
                        </h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                {unreadCount} Urgentes
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {tasks.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {tasks.map((task: Task) => {
                                    const due = task.due_at ? new Date(task.due_at) : null;
                                    const overdue = due ? due < new Date() : false;
                                    const today = due ? isToday(due) : false;

                                    return (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskClick(task.lead_id)}
                                            className="w-full p-4 text-left hover:bg-brand-bg/30 transition-colors group"
                                        >
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "mt-1 p-2 rounded-lg shrink-0",
                                                    overdue ? "bg-red-50 text-red-500" :
                                                        today ? "bg-yellow-50 text-yellow-600" : "bg-blue-50 text-blue-500"
                                                )}>
                                                    {overdue ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm font-semibold truncate",
                                                        overdue ? "text-red-900" : "text-gray-900"
                                                    )}>
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        Lead: {task.leads?.full_name || 'General'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                            overdue ? "bg-red-100 text-red-700" :
                                                                today ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                                                        )}>
                                                            {overdue ? 'Atrasada' : today ? 'Hoy' : 'Próxima'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {due ? format(due, "d 'de' MMM, HH:mm", { locale: es }) : 'Sin fecha'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all self-center" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="inline-flex p-4 rounded-full bg-green-50 mb-3 text-green-500">
                                    <Inbox className="h-8 w-8" />
                                </div>
                                <p className="text-sm font-medium text-gray-900 capitalize">¡Todo al día!</p>
                                <p className="text-xs text-gray-500 mt-1">No tienes tareas pendientes por ahora.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-50 bg-gray-50/30 text-center">
                        <button
                            onClick={() => { navigate('/tasks'); setIsOpen(false); }}
                            className="text-xs font-bold text-brand-primary hover:text-brand-dark transition-colors"
                        >
                            Ver todas las tareas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
