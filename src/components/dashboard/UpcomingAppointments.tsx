import { Link } from 'react-router-dom';
import { Calendar, Video } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface Appointment {
    id: string;
    lead_id: string | null;
    start_time: string;
    status: string | null;
    meeting_url: string | null;
    lead_name?: string;
}

interface UpcomingAppointmentsProps {
    appointments: Appointment[];
}

function getDateBadge(dateStr: string): { label: string; style: string } {
    const date = new Date(dateStr);
    if (isToday(date)) return { label: 'Hoy', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (isTomorrow(date)) return { label: 'Mañana', style: 'bg-blue-100 text-blue-700 border-blue-200' };
    return {
        label: format(date, 'EEE dd', { locale: es }),
        style: 'bg-gray-100 text-gray-600 border-gray-200'
    };
}

export default function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 h-full">
            <h2 className="text-lg font-bold text-brand-primary mb-1">Próximas Citas</h2>
            <p className="text-xs text-brand-text/50 mb-4">Agenda sincronizada con Calendly</p>

            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Calendar className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No hay citas agendadas</p>
                    <p className="text-xs text-gray-300 mt-1">Las citas se sincronizan automáticamente desde Calendly</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {appointments.map((appt) => {
                        const badge = getDateBadge(appt.start_time);
                        const time = format(new Date(appt.start_time), 'h:mm a', { locale: es });

                        return (
                            <div
                                key={appt.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-border hover:shadow-sm transition-all group"
                            >
                                {/* Time block */}
                                <div className="shrink-0 text-center w-14">
                                    <span className={cn(
                                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md border block',
                                        badge.style
                                    )}>
                                        {badge.label}
                                    </span>
                                    <span className="text-xs font-semibold text-brand-primary mt-1 block">
                                        {time}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    {appt.lead_id ? (
                                        <Link
                                            to={`/leads/${appt.lead_id}`}
                                            className="text-sm font-semibold text-brand-text hover:text-brand-primary transition-colors truncate block"
                                        >
                                            {appt.lead_name || 'Lead'}
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-semibold text-brand-text truncate">
                                            {appt.lead_name || 'Sin lead asociado'}
                                        </p>
                                    )}
                                </div>

                                {/* Meeting link */}
                                {appt.meeting_url && (
                                    <a
                                        href={appt.meeting_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
                                        title="Unirse a reunión"
                                    >
                                        <Video className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
