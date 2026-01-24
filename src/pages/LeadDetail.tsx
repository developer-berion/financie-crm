import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Timeline from '../components/Timeline';
import { Ban, Clock } from 'lucide-react';

export default function LeadDetail() {
    const { id } = useParams<{ id: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lead, setLead] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [calling, setCalling] = useState(false);

    useEffect(() => {
        if (id) fetchLeadData();
    }, [id]);

    async function fetchLeadData() {
        setLoading(true);
        if (!id) return;

        // Fetch Lead
        const { data: leadData } = await supabase.from('leads').select('*, pipeline_stages(name)').eq('id', id).single();
        if (leadData) setLead(leadData);

        // Fetch Events
        const { data: eventData } = await supabase
            .from('lead_events')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (eventData) setEvents(eventData);
        setLoading(false);
    }

    const handleAddNote = async () => {
        if (!note.trim()) return;

        await supabase.from('lead_events').insert({
            lead_id: id,
            event_type: 'note.added',
            payload: { text: note }
        });
        setNote('');
        fetchLeadData(); // Refresh
    };

    const handleDNC = async () => {
        if (!confirm('¿Marcar como NO LLAMAR? Esto detendrá la automatización.')) return;

        // Update lead
        await supabase.from('leads').update({ do_not_call: true }).eq('id', id);

        // Update schedules
        await supabase.from('call_schedules').update({ active: false }).eq('lead_id', id);

        // Log event
        await supabase.from('lead_events').insert({
            lead_id: id,
            event_type: 'lead.dnc_set',
            payload: { manual: true }
        });

        fetchLeadData();
    };

    const handleCall = async () => {
        if (!confirm(`¿Llamar a ${lead.full_name}?`)) return;

        setCalling(true);
        try {
            const { data, error } = await supabase.functions.invoke('make_outbound_call', {
                body: { lead_id: id }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            alert('Llamada iniciada con éxito');
            fetchLeadData();
        } catch (err: any) {
            alert('Error al iniciar llamada: ' + err.message);
        } finally {
            setCalling(false);
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (!lead) return <div>Lead no encontrado</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg px-4 py-5 sm:px-6 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{lead.full_name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{lead.phone} • {lead.email || 'Sin email'}</p>
                    <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lead.pipeline_stages?.name}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {lead.status}
                        </span>
                        {lead.do_not_call && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                NO LLAMAR
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2">
                    {!lead.do_not_call && (
                        <button onClick={handleDNC} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none">
                            <Ban className="mr-2 h-4 w-4" />
                            DNC
                        </button>
                    )}
                    <button
                        onClick={handleCall}
                        disabled={calling || lead.do_not_call}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${calling ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none disabled:opacity-50`}
                    >
                        {calling ? 'Llamando...' : 'Llamar IA'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Pipeline/Tasks/Notes */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions / Notes Form */}
                    <div className="bg-white shadow rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700">Agregar Nota</label>
                        <div className="mt-1 flex space-x-2">
                            <input
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="Escribe una nota..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                            />
                            <button onClick={handleAddNote} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                Guardar
                            </button>
                        </div>
                    </div>

                    {/* Stats / Info */}
                    <div className="bg-white shadow rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Información de Sistema</h3>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                            <div className="sm:col-span-1">
                                <dt className="text-gray-500">Source</dt>
                                <dd className="mt-1 text-gray-900 capitalize">{lead.source}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-gray-500">Creado</dt>
                                <dd className="mt-1 text-gray-900">{new Date(lead.created_at).toLocaleString()}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-gray-500">Updated</dt>
                                <dd className="mt-1 text-gray-900">{new Date(lead.updated_at).toLocaleString()}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-gray-500">Consentimiento Marketing</dt>
                                <dd className="mt-1">
                                    {lead.marketing_consent ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Aceptado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            No registrado
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Timeline Sidebar */}
                <div className="bg-white shadow rounded-lg p-4 h-fit">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2" /> Timeline
                    </h3>
                    <Timeline events={events} />
                </div>
            </div>
        </div >
    );
}
