import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Phone, Mail, Calendar, ExternalLink, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import SyncCalendlyButton from '../components/SyncCalendlyButton';

export default function AgentDetail() {
    const { id } = useParams<{ id: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchAgentData();

        // Realtime updates
        const subscription = supabase
            .channel(`agent_${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes', filter: `id=eq.${id}` }, (payload) => {
                setAgent(payload.new);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [id]);

    async function fetchAgentData() {
        setLoading(true);
        if (!id) return;

        const { data } = await supabase.from('agentes').select('*').eq('id', id).single();
        if (data) setAgent(data);
        setLoading(false);
    }

    if (loading) return <div>Cargando...</div>;
    if (!agent) return <div>Agente no encontrado</div>;

    const events = agent.calendly_events || [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-brand-text">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-primary text-2xl font-bold shadow-inner">
                            {agent.full_name?.charAt(0) || <User />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-brand-primary tracking-tight">{agent.full_name}</h1>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {agent.email}</span>
                                <span className="flex items-center gap-1 ml-3"><Phone className="w-3 h-3" /> {agent.phone_number}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <SyncCalendlyButton />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {/* Calendly Events List */}
                <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Agenda Calendly ({events.length})
                        </h3>
                    </div>
                    <div>
                        {events.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {events.map((evt: any, idx: number) => (
                                    <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-brand-primary text-lg flex items-center gap-2">
                                                    {evt.name}
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide border",
                                                        evt.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                                                    )}>
                                                        {evt.status}
                                                    </span>
                                                </h4>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        <span className="font-medium">
                                                            {new Date(evt.start_time).toLocaleString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-300">|</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span>{new Date(evt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Fin)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <a
                                                href={evt.uri}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors text-sm font-medium flex items-center gap-2 justify-center md:justify-start"
                                            >
                                                Ver en Calendly <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        {/* Invitee Details if available */}
                                        {evt.invitee_details && (
                                            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100">
                                                <p className="font-medium mb-1 text-xs text-gray-400 uppercase">Detalles del Invitado</p>
                                                <p>{evt.invitee_details.name} ({evt.invitee_details.email})</p>
                                                {/* Questions and Answers */}
                                                {evt.invitee_details.questions_and_answers && evt.invitee_details.questions_and_answers.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {evt.invitee_details.questions_and_answers.map((qa: any, qIdx: number) => (
                                                            <div key={qIdx} className="text-xs">
                                                                <span className="font-semibold text-gray-500">{qa.question}:</span> <span className="text-gray-700">{qa.answer}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">Sin eventos sincronizados</h3>
                                <p className="text-xs text-gray-500 mt-1">Presiona el botón "Sync Calendly" para buscar eventos recientes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
