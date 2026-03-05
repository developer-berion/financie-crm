import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { X, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId?: string;
    onTaskCreated: () => void;
}

const TASK_TYPES = [
    { value: 'call', label: 'Llamada' },
    { value: 'email', label: 'Correo' },
    { value: 'meeting', label: 'Reunión' },
    { value: 'follow_up', label: 'Seguimiento' },
    { value: 'research', label: 'Investigación' },
    { value: 'other', label: 'Otro' }
];

const PRIORITIES = [
    { value: 'low', label: 'Baja', color: 'bg-blue-50 text-blue-700' },
    { value: 'med', label: 'Media', color: 'bg-yellow-50 text-yellow-700' },
    { value: 'high', label: 'Alta', color: 'bg-red-50 text-red-700' }
];

type PriorityValue = (typeof PRIORITIES)[number]['value'];

export default function TaskModal({ isOpen, onClose, leadId, onTaskCreated }: TaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('call');
    const [priority, setPriority] = useState<PriorityValue>('med');
    const [dueAt, setDueAt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('El título es obligatorio');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('tasks').insert({
                title: title.trim(),
                type,
                priority,
                due_at: dueAt ? new Date(dueAt).toISOString() : null,
                lead_id: leadId || null,
                status: 'pending',
                assigned_to: (await supabase.auth.getUser()).data.user?.id
            });

            if (error) throw error;

            toast.success('Tarea creada correctamente');
            onTaskCreated();
            onClose();
            // Reset form
            setTitle('');
            setType('call');
            setPriority('med');
            setDueAt('');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Error creating task:', error);
            toast.error('Error al crear la tarea: ' + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-brand-border overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Nueva Tarea</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Título de la Tarea</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Llamada de seguimiento trimestral"
                            className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none text-sm font-medium"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-primary transition-all outline-none text-sm font-medium"
                            >
                                {TASK_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Prioridad</label>
                            <div className="flex p-1 bg-gray-50/50 rounded-xl border border-gray-100 gap-1">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setPriority(p.value)}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                                            priority === p.value ? p.color + " shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Fecha de Vencimiento</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="datetime-local"
                                value={dueAt}
                                onChange={(e) => setDueAt(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-brand-primary transition-all outline-none text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-brand-primary text-white font-bold text-sm shadow-lg shadow-brand-primary/20 hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Crear Tarea"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
