import { format } from 'date-fns';
import {
    Phone,
    Calendar,
    MessageSquare,
    UserPlus,
    ArrowRight,
    AlertCircle
} from 'lucide-react';

interface TimelineEvent {
    id: string;
    event_type: string;
    payload: any;
    created_at: string;
}

export default function Timeline({ events }: { events: TimelineEvent[] }) {
    // Filter out SMS events
    const filteredEvents = events.filter(e => !e.event_type.startsWith('sms.'));


    const getIcon = (type: string) => {
        if (type.startsWith('call')) return <Phone className="h-4 w-4 text-white" />;
        if (type.startsWith('sms')) return <MessageSquare className="h-4 w-4 text-white" />;
        if (type.startsWith('conversation')) return <MessageSquare className="h-4 w-4 text-white" />;
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
        if (type.startsWith('conversation')) return 'bg-indigo-500';
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
            case 'pipeline.stage_changed': return `Cambio de etapa: ${e.payload?.to}`;
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
        if (e.event_type === 'call.attempted') {
            return `Intento #${e.payload?.attempt || '?'}`;
        }
        if (e.event_type === 'sms.immediate_sent') {
            return e.payload.success ? 'Envío exitoso' : 'Falló el envío';
        }
        if (e.event_type === 'call.outbound_triggered') {
            return `Call ID: ${e.payload?.call_id || 'N/A'}`;
        }
        if (e.event_type === 'note.added') {
            return <span className="italic">"{e.payload?.text}"</span>;
        }
        if (e.event_type === 'appointment.scheduled') {
            return `Inicio: ${e.payload?.scheduled_event?.start_time ? format(new Date(e.payload.scheduled_event.start_time), 'dd/MM HH:mm') : ''}`;
        }
        if (e.event_type === 'conversation.completed') {
            const outcome = e.payload?.analysis?.call_outcome || 'Analizada';
            return (
                <div className="space-y-1">
                    <p className="font-medium text-indigo-700">{outcome}</p>
                    {e.payload?.analysis?.summary && (
                        <p className="text-xs line-clamp-2">{e.payload.analysis.summary}</p>
                    )}
                </div>
            );
        }
        if (e.event_type === 'sms.received') {
            return <p className="italic">"{e.payload?.body}"</p>;
        }
        if (e.event_type === 'sms.failed') {
            return <p className="text-red-600">Error: {e.payload?.error || 'Desconocido'}</p>;
        }
        if (e.event_type === 'call.scheduling_skipped') {
            return <p className="text-gray-500">Motivo: {e.payload?.reason === 'sms_failure' ? 'Fallo en envío de SMS inicial' : e.payload?.reason}</p>;
        }
        // Generic description handler for new call events
        if (e.event_type.startsWith('call.') && e.payload?.description) {
            return <p className="text-gray-600">{e.payload.description}</p>;
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
