import { format } from 'date-fns';
import {
    Phone,
    Calendar,
    MessageSquare,
    UserPlus,
    ArrowRight,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { ENABLE_AI_FEATURES } from '../lib/utils';

interface PostCallAnalysis {
    call_outcome?: string;
    summary?: string;
    [key: string]: unknown;
}

interface CallPayload {
    to?: string;
    attempt?: number;
    success?: boolean;
    call_id?: string;
    text?: string;
    scheduled_event?: { start_time: string };
    analysis?: PostCallAnalysis;
    body?: string;
    error?: string;
    reason?: string;
    description?: string;
    [key: string]: unknown;
}

interface TimelineEvent {
    id: string;
    event_type: string;
    payload: Record<string, unknown> | null;
    created_at: string;
}

interface TimelineProps {
    events: TimelineEvent[];
    onEventClick?: (event: TimelineEvent) => void;
}

export default function Timeline({ events, onEventClick }: TimelineProps) {
    // Filter out SMS events
    // If AI is disabled, also hide automated calls and conversations
    const filteredEvents = events.filter(e => {
        if (!ENABLE_AI_FEATURES) {
            if (e.event_type.startsWith('sms.')) return false;
            if (e.event_type.startsWith('conversation.')) return false; // Hide AI conversations
            if (e.event_type === 'call.outbound_triggered') return false; // Hide AI calls
            if (e.event_type === 'call.attempted') return false; // Hide AI attempts
            if (e.event_type === 'call.scheduling_skipped') return false;
        }
        return !e.event_type.startsWith('sms.');
    });


    const getIcon = (type: string) => {
        if (type.startsWith('call')) return <Phone className="h-4 w-4 text-white" />;
        if (type.startsWith('sms')) return <MessageSquare className="h-4 w-4 text-white" />;
        if (type.startsWith('conversation')) return <Sparkles className="h-4 w-4 text-white" />;
        if (type.startsWith('appointment')) return <Calendar className="h-4 w-4 text-white" />;
        if (type.startsWith('pipeline')) return <ArrowRight className="h-4 w-4 text-white" />;
        if (type.includes('note')) return <MessageSquare className="h-4 w-4 text-white" />;
        if (type.includes('lead')) return <UserPlus className="h-4 w-4 text-white" />;
        return <AlertCircle className="h-4 w-4 text-white" />;
    };

    const getColor = (type: string) => {
        if (type.startsWith('call')) return 'bg-orange-500';
        if (type.startsWith('sms')) return 'bg-purple-500';
        if (type.startsWith('appointment')) return 'bg-blue-500';
        if (type.startsWith('pipeline')) return 'bg-gray-500';
        if (type.startsWith('lead.received')) return 'bg-green-500';
        if (type.startsWith('lead.dnc') || type.includes('dnc')) return 'bg-red-500';
        if (type.includes('failed') || type.includes('skipped')) return 'bg-red-600';
        if (type.startsWith('conversation')) return 'bg-brand-accent';
        return 'bg-gray-400';
    };

    const getTitle = (e: TimelineEvent) => {
        switch (e.event_type) {
            case 'lead.received.meta': return 'Lead recibido de Meta';
            case 'sms.immediate_sent': return 'SMS de Bienvenida Enviado';
            case 'sms.attempted': return 'SMS de Seguimiento Enviado';
            case 'sms.failed': return 'Error al enviar SMS';
            case 'call.outbound_triggered': return 'Agente AI ha realizado la llamada';
            case 'call.attempted': return 'Llamada automática intentada';
            case 'call.scheduled': return 'Agendamiento Creado';
            case 'call.scheduling_skipped': return 'Llamada automática omitida';
            case 'appointment.scheduled': return 'Cita agendada';
            case 'pipeline.stage_changed': return `Cambio de etapa: ${(e.payload as Record<string, unknown>)?.to || ''}`;
            case 'note.added': return 'Nota agregada';
            case 'lead.dnc_set': return 'Marcado como No Llamar';
            case 'conversation.completed': return 'Conversación AI Finalizada';
            case 'conversation.failed_initiation': return 'Fallo al Iniciar Conversación';
            case 'sms.received': return 'SMS Recibido (Respuesta)';
            // New Call Events
            case 'call.initiated': return 'Llamada Realizada';
            case 'call.answered': return 'Llamada Atendida';
            case 'call.failed': return 'Llamada no realizada por error';
            case 'call.missed': return 'Llamada Desviada / Sin Respuesta';
            case 'call.completed': return 'Llamada Finalizada';
            default: return e.event_type;
        }
    };

    const getDetails = (e: TimelineEvent) => {
        const payload = e.payload as CallPayload | null;
        if (!payload) return null;

        if (e.event_type === 'call.attempted') {
            return `Intento #${payload.attempt || '?'}`;
        }
        if (e.event_type === 'sms.immediate_sent') {
            return payload.success ? 'Envío exitoso' : 'Falló el envío';
        }
        if (e.event_type === 'call.outbound_triggered') {
            return `Call ID: ${payload.call_id || 'N/A'}`;
        }
        if (e.event_type === 'note.added') {
            return <span className="italic">"{payload.text}"</span>;
        }
        if (e.event_type === 'appointment.scheduled') {
            return `Inicio: ${payload.scheduled_event?.start_time ? format(new Date(payload.scheduled_event.start_time), 'dd/MM HH:mm') : ''}`;
        }
        if (e.event_type === 'conversation.completed') {
            const outcome = payload.analysis?.call_outcome || 'Analizada';
            return (
                <div
                    className="space-y-1 cursor-pointer group/item"
                    onClick={() => onEventClick?.(e)}
                >
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-indigo-700 group-hover/item:text-brand-accent transition-colors">{outcome}</p>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 font-bold">
                            <Sparkles className="w-2.5 h-2.5" /> IA
                        </span>
                    </div>
                    {payload.analysis?.summary && (
                        <p className="text-xs text-gray-500 line-clamp-2 italic group-hover/item:text-gray-700 transition-colors">
                            "{payload.analysis.summary}"
                        </p>
                    )}
                    <button className="text-[10px] font-bold text-brand-secondary uppercase tracking-tight opacity-0 group-hover/item:opacity-100 transition-all pt-1">
                        Ver transcripción completa →
                    </button>
                </div>
            );
        }
        if (e.event_type === 'sms.received') {
            return <p className="italic">"{payload.body}"</p>;
        }
        if (e.event_type === 'sms.failed') {
            return <p className="text-red-600">Error: {payload.error || 'Desconocido'}</p>;
        }
        if (e.event_type === 'call.scheduling_skipped') {
            return <p className="text-gray-500">Motivo: {payload.reason === 'sms_failure' ? 'Fallo en envío de SMS inicial' : payload.reason}</p>;
        }
        // Generic description handler for new call events
        if (e.event_type.startsWith('call.') && payload.description) {
            return <p className="text-gray-600">{payload.description}</p>;
        }
        return null;
    };

    if (!filteredEvents.length) return <div className="text-gray-500 text-sm">No hay eventos registrados.</div>;

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {filteredEvents.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== filteredEvents.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getColor(event.event_type)}`}>
                                        {getIcon(event.event_type)}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium text-gray-900">{getTitle(event)}</span>
                                        </p>
                                        <div className="mt-1 text-sm text-gray-600">
                                            {getDetails(event)}
                                        </div>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time dateTime={event.created_at}>{format(new Date(event.created_at), 'dd/MM HH:mm')}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
