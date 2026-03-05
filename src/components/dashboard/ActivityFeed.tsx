import { Link } from 'react-router-dom';
import {
    UserPlus,
    Phone,
    PhoneOff,
    StickyNote,
    CalendarCheck,
    ArrowRightLeft,
    CircleDot,
    Sparkles,
} from 'lucide-react';
import { cn, ENABLE_AI_FEATURES } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadEvent {
    id: string;
    lead_id: string | null;
    event_type: string;
    payload: Record<string, unknown> | null;
    created_at: string;
    lead_name?: string;
}

interface ActivityFeedProps {
    events: LeadEvent[];
}

const eventConfig: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
    'lead.received.meta': { icon: UserPlus, color: 'text-blue-500 bg-blue-50', label: 'Nuevo lead de Meta' },
    'lead.created': { icon: UserPlus, color: 'text-blue-500 bg-blue-50', label: 'Lead creado' },
    'call.completed': { icon: Phone, color: 'text-emerald-500 bg-emerald-50', label: 'Llamada completada' },
    'call.answered': { icon: Phone, color: 'text-emerald-500 bg-emerald-50', label: 'Llamada contestada' },
    'call.failed': { icon: PhoneOff, color: 'text-red-500 bg-red-50', label: 'Llamada fallida' },
    'call.no_answer': { icon: PhoneOff, color: 'text-amber-500 bg-amber-50', label: 'Sin respuesta' },
    'note.added': { icon: StickyNote, color: 'text-violet-500 bg-violet-50', label: 'Nota agregada' },
    'appointment.scheduled': { icon: CalendarCheck, color: 'text-cyan-600 bg-cyan-50', label: 'Cita agendada' },
    'appointment.synced': { icon: CalendarCheck, color: 'text-cyan-600 bg-cyan-50', label: 'Cita sincronizada' },
    'pipeline.stage_changed': { icon: ArrowRightLeft, color: 'text-indigo-500 bg-indigo-50', label: 'Pipeline movido' },
    'conversation.completed': { icon: Sparkles, color: 'text-brand-accent bg-brand-accent/10', label: 'IA: Análisis completado' },
};

const defaultConfig = { icon: CircleDot, color: 'text-gray-400 bg-gray-50', label: 'Evento' };

function getEventDescription(event: LeadEvent): string {
    const config = eventConfig[event.event_type] || defaultConfig;
    const leadName = event.lead_name || 'Lead';
    const payload = event.payload as { to?: string; analysis?: { summary?: string } } | null;

    if (event.event_type === 'pipeline.stage_changed' && payload?.to) {
        return `${leadName} → ${payload.to}`;
    }
    if (event.event_type === 'call.completed' && event.payload?.status) {
        return `${config.label} — ${leadName}`;
    }
    if (event.event_type === 'conversation.completed' && payload?.analysis?.summary) {
        const summary = payload.analysis.summary;
        return `IA: ${summary.length > 60 ? summary.substring(0, 60) + '...' : summary}`;
    }

    return `${config.label} — ${leadName}`;
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
    const filteredEvents = events.filter(e => {
        if (!ENABLE_AI_FEATURES && (e.event_type.startsWith('call.') || e.event_type.startsWith('sms.'))) {
            return false;
        }
        return true;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 h-full">
            <h2 className="text-lg font-bold text-brand-primary mb-1">Actividad Reciente</h2>
            <p className="text-xs text-brand-text/50 mb-4">Últimos eventos del sistema</p>

            {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CircleDot className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Sin actividad reciente</p>
                    <Link to="/pipeline" className="text-xs text-brand-secondary hover:text-brand-primary mt-2 font-medium">
                        Ir al Pipeline →
                    </Link>
                </div>
            ) : (
                <div className="space-y-1">
                    {filteredEvents.map((event, index) => {
                        const config = eventConfig[event.event_type] || defaultConfig;
                        const Icon = config.icon;
                        const description = getEventDescription(event);
                        const timeAgo = formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es });

                        return (
                            <div
                                key={event.id}
                                className={cn(
                                    'flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50/80 transition-colors',
                                    index < filteredEvents.length - 1 && 'border-b border-gray-50'
                                )}
                            >
                                <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', config.color)}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {event.lead_id ? (
                                        <Link
                                            to={`/leads/${event.lead_id}`}
                                            className="text-sm text-brand-text hover:text-brand-primary transition-colors leading-tight block truncate"
                                        >
                                            {description}
                                        </Link>
                                    ) : (
                                        <p className="text-sm text-brand-text leading-tight truncate">{description}</p>
                                    )}
                                    <p className="text-[10px] text-brand-text/40 mt-0.5">{timeAgo}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
