import { format } from 'date-fns';
import {
    Phone,
    Calendar,
    MessageSquare,
    UserPlus,
    ArrowRight,
    ClipboardList,
    AlertCircle
} from 'lucide-react';

interface TimelineEvent {
    id: string;
    event_type: string;
    payload: any;
    created_at: string;
}

export default function Timeline({ events }: { events: TimelineEvent[] }) {

    const getIcon = (type: string) => {
        if (type.startsWith('call')) return <Phone className="h-4 w-4 text-white" />;
        if (type.startsWith('appointment')) return <Calendar className="h-4 w-4 text-white" />;
        if (type.startsWith('pipeline')) return <ArrowRight className="h-4 w-4 text-white" />;
        if (type.includes('note')) return <MessageSquare className="h-4 w-4 text-white" />;
        if (type.includes('lead')) return <UserPlus className="h-4 w-4 text-white" />;
        if (type.includes('task')) return <ClipboardList className="h-4 w-4 text-white" />;
        return <AlertCircle className="h-4 w-4 text-white" />;
    };

    const getColor = (type: string) => {
        if (type.startsWith('call')) return 'bg-orange-500';
        if (type.startsWith('appointment')) return 'bg-purple-500';
        if (type.startsWith('pipeline')) return 'bg-blue-500';
        if (type.startsWith('lead.received')) return 'bg-green-500';
        if (type.startsWith('lead.dnc')) return 'bg-red-500';
        return 'bg-gray-400';
    };

    const getTitle = (e: TimelineEvent) => {
        switch (e.event_type) {
            case 'lead.received.meta': return 'Lead recibido de Meta';
            case 'call.attempted': return 'Llamada automática intentada';
            case 'call.scheduled': return 'Llamada programada';
            case 'appointment.scheduled': return 'Cita agendada';
            case 'pipeline.stage_changed': return `Cambio de etapa: ${e.payload?.to}`;
            case 'note.added': return 'Nota agregada';
            case 'lead.dnc_set': return 'Marcado como No Llamar';
            default: return e.event_type;
        }
    };

    const getDetails = (e: TimelineEvent) => {
        if (e.event_type === 'call.attempted') {
            return `Intento #${e.payload?.attempt || '?'}`;
        }
        if (e.event_type === 'note.added') {
            return <span className="italic">"{e.payload?.text}"</span>;
        }
        if (e.event_type === 'appointment.scheduled') {
            return `Inicio: ${e.payload?.scheduled_event?.start_time ? format(new Date(e.payload.scheduled_event.start_time), 'dd/MM HH:mm') : ''}`;
        }
        return null;
    };

    if (!events.length) return <div className="text-gray-500 text-sm">No hay eventos registrados.</div>;

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {events.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== events.length - 1 ? (
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
