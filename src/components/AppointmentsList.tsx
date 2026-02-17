
import { Calendar, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentsListProps {
    events: any[];
}

export default function AppointmentsList({ events }: AppointmentsListProps) {
    // Filter for appointments
    const appointments = events.filter(e =>
        e.event_type === 'appointment.scheduled' ||
        (e.event_type === 'call.scheduled' && e.payload?.provider === 'calendly')
    );

    // Filter for future events only (optional, based on requirement "Próximos Eventos")
    // If user wants history, we can remove this. But usually sidebars show upcoming.
    const futureAppointments = appointments
        .filter(e => {
            const start = e.payload?.start_time || e.payload?.scheduled_event?.start_time;
            return start && new Date(start) > new Date();
        })
        .sort((a, b) => {
            const dateA = new Date(a.payload?.start_time || a.payload?.scheduled_event?.start_time);
            const dateB = new Date(b.payload?.start_time || b.payload?.scheduled_event?.start_time);
            return dateA.getTime() - dateB.getTime();
        });

    if (futureAppointments.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-brand-border/50 pb-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                Próximos Eventos
            </h3>

            <div className="space-y-3">
                {futureAppointments.map((evt) => {
                    const payload = evt.payload || {};
                    const startTime = payload.start_time || payload.scheduled_event?.start_time;
                    const name = payload.name || 'Reunión Agendada';
                    const status = payload.status || 'active';

                    if (!startTime) return null;

                    const dateObj = new Date(startTime);

                    return (
                        <div key={evt.id} className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 hover:border-blue-200 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-100/50 px-2 py-0.5 rounded">
                                    {format(dateObj, 'MMM dd', { locale: es })}
                                </span>
                                {status === 'active' ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-3 h-3 text-red-500" />
                                )}
                            </div>

                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1" title={name}>
                                {name}
                            </h4>

                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                <Clock className="w-3 h-3" />
                                <span>{format(dateObj, 'h:mm a', { locale: es })}</span>
                            </div>

                            {payload.uri && (
                                <a
                                    href={payload.uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-brand-accent hover:text-brand-primary flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    Ver en Calendly <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
