import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Timeline from '../components/Timeline';
import { Ban, Clock, MessageSquare, Phone, Mail, User, MapPin, Tag, Calendar, ExternalLink, Hash, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeadDetail() {
    const { id } = useParams<{ id: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lead, setLead] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]);
    const [callEvents, setCallEvents] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any>(null);
    const [conversation, setConversation] = useState<any>(null);
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

        // Fetch Lead Events (Timeline)
        const { data: eventData } = await supabase
            .from('lead_events')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (eventData) setEvents(eventData);



        // Fetch Call Events
        const { data: callData } = await supabase
            .from('call_events')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (callData) setCallEvents(callData);

        // Fetch Active Call Schedule
        const { data: scheduleData } = await supabase
            .from('call_schedules')
            .select('*')
            .eq('lead_id', id)
            .eq('active', true)
            .maybeSingle();

        if (scheduleData) setSchedule(scheduleData);

        // Fetch AI Conversation Results
        const { data: convData } = await supabase
            .from('conversation_results')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (convData) setConversation(convData);

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

    const handleUpdateLead = async (field: string, value: any) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ [field]: value })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update or refresh
            setLead({ ...lead, [field]: value });
        } catch (error) {
            console.error('Error updating lead:', error);
            alert('Error al actualizar el campo');
        }
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

    const getBadgeStyle = (status: string) => {
        const lowerStatus = status?.toLowerCase();
        if (lowerStatus?.includes('nuevo')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (lowerStatus?.includes('ganado')) return 'bg-green-50 text-green-600 border-green-100';
        if (lowerStatus?.includes('perdido')) return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    };

    // Helper to normalize values from DB (Make/Meta often sends snake_case or lowercase)
    const normalizeObjective = (val: string) => {
        if (!val) return '';
        const lower = val.toLowerCase().trim();
        if (lower.includes('protección') || lower.includes('proteccion') || lower.includes('familiar')) return 'Protección Familiar';
        if (lower.includes('retiro')) return 'Ahorro para retiro';
        if (lower.includes('hijos') || lower.includes('educación') || lower.includes('educacion')) return 'Educación para tus hijos';
        return val; // Fallback
    };

    const normalizeYesNo = (val: string) => {
        if (!val) return '';
        const lower = val.toLowerCase().trim();
        if (lower === 'si' || lower === 'sí' || lower === 'yes') return 'Si';
        if (lower === 'no') return 'No';
        return val;
    };

    if (loading) return <div>Cargando...</div>;
    if (!lead) return <div>Lead no encontrado</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header Section */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f6c71e] to-[#e5b810] flex items-center justify-center text-[#414042] text-2xl font-bold shadow-lg shadow-[#f6c71e]/20">
                            {lead.full_name?.charAt(0) || <User />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#414042] tracking-tight">{lead.full_name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                    getBadgeStyle(lead.status)
                                )}>
                                    {lead.status}
                                </span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-gray-50 border-gray-100 text-gray-500">
                                    {lead.pipeline_stages?.name}
                                </span>
                                {lead.do_not_call && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-red-50 border-red-100 text-red-600 flex items-center gap-1">
                                        <Ban className="w-3 h-3" /> No Llamar
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {!lead.do_not_call && (
                            <button
                                onClick={handleDNC}
                                className="flex-1 md:flex-none px-6 py-3 rounded-xl border-2 border-red-100 text-red-600 text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Ban className="w-4 h-4" /> DNC
                            </button>
                        )}
                        <button
                            onClick={handleCall}
                            disabled={calling || lead.do_not_call}
                            className={cn(
                                "flex-1 md:flex-none px-8 py-3 rounded-xl text-[#0f171a] text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg",
                                calling
                                    ? "bg-gray-100 cursor-not-allowed text-gray-400 shadow-none border-[#d9d9d9]"
                                    : "bg-[#f6c71e] hover:bg-[#e5b810] shadow-[#f6c71e]/30 scale-100 hover:scale-105 active:scale-95"
                            )}
                        >
                            <Phone className="w-4 h-4" />
                            {calling ? 'Conectando...' : 'Llamar con AI'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (Main Info & Interaction) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Contact & Bio Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] p-8">
                            <h3 className="text-xs font-black text-[#414042]/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <User className="w-4 h-4" /> Datos de Contacto
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#f6c71e]/10 group-hover:text-[#f6c71e] transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Email</p>
                                        <p className="text-sm font-bold text-[#414042]">{lead.email || 'No proporcionado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#f6c71e]/10 group-hover:text-[#f6c71e] transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Teléfono</p>
                                        <p className="text-sm font-bold text-[#414042]">{lead.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#f6c71e]/10 group-hover:text-[#f6c71e] transition-colors">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Ubicación</p>
                                        <p className="text-sm font-bold text-[#414042]">{lead.state || 'Nacional / Desconocido'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] p-8">
                            <h3 className="text-xs font-black text-[#414042]/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Metadata del Lead
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Origen</span>
                                    <span className="text-xs font-black text-[#414042] capitalize bg-gray-100 px-2 py-0.5 rounded">{lead.source}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Creado el</span>
                                    <span className="text-xs font-bold text-[#414042]">{new Date(lead.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Marketing</span>
                                    {lead.marketing_consent ? (
                                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-100 uppercase tracking-tighter">Aceptado</span>
                                    ) : (
                                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">No Registrado</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Lead Qualification (Editable) */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] p-8">
                        <h3 className="text-xs font-black text-[#414042]/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Tag className="w-4 h-4" /> Calificación del Lead
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Objetivo Principal</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-[#414042] focus:outline-none focus:ring-2 focus:ring-[#f6c71e]/50"
                                    value={normalizeObjective(lead.main_objective)}
                                    onChange={(e) => handleUpdateLead('main_objective', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Protección Familiar">Protección Familiar</option>
                                    <option value="Ahorro para retiro">Ahorro para retiro</option>
                                    <option value="Educación para tus hijos">Educación para tus hijos</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Ingresos Estables</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-[#414042] focus:outline-none focus:ring-2 focus:ring-[#f6c71e]/50"
                                    value={normalizeYesNo(lead.stable_income)}
                                    onChange={(e) => handleUpdateLead('stable_income', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Si">Si</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Condición de Salud</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-[#414042] focus:outline-none focus:ring-2 focus:ring-[#f6c71e]/50"
                                    value={normalizeYesNo(lead.health_condition)}
                                    onChange={(e) => handleUpdateLead('health_condition', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Si">Si</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights Card */}
                    {conversation ? (
                        <div className="bg-[#414042] rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <MessageSquare className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xs font-black text-[#f6c71e] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#f6c71e] animate-pulse" />
                                        Análisis de Conversación AI
                                    </h3>
                                    <span className="text-[10px] font-bold opacity-60">ID: {conversation.conversation_id?.substring(0, 8)}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-8 space-y-4">
                                        <p className="text-lg font-bold leading-tight group-hover:text-[#f6c71e]/90 transition-colors">
                                            {conversation.summary || 'El agente AI conversó con el lead para calificar sus necesidades financieros.'}
                                        </p>
                                        <div className="h-px bg-white/10 w-full" />
                                        <div>
                                            <p className="text-[10px] font-bold text-white/40 uppercase mb-3">Transcripción de la llamada</p>
                                            <div className="bg-black/20 rounded-2xl p-4 text-xs font-mono text-white/80 max-h-40 overflow-y-auto custom-scrollbar italic leading-relaxed">
                                                "{conversation.transcript}"
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-4 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#f6c71e] uppercase tracking-widest mb-1">Outcome</p>
                                            <p className="text-xl font-black capitalize tracking-tight italic">
                                                {conversation.outcome?.call_outcome || 'Calificado'}
                                            </p>
                                        </div>

                                        <div className="mt-8 border-t border-white/10 pt-4">
                                            {conversation.scheduled_datetime ? (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-green-400 uppercase flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Cita Agendada
                                                    </p>
                                                    <p className="text-sm font-bold">{new Date(conversation.scheduled_datetime).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className="text-[10px] opacity-60">Canal: {conversation.scheduled_channel}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] font-bold text-white/40 uppercase">No se agendó cita en esta llamada</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h4 className="text-[#414042] font-bold">Sin conversaciones AI</h4>
                            <p className="text-xs text-gray-400 max-w-[240px] mx-auto mt-1">Inicia una llamada para generar transcripciones y resúmenes automáticos.</p>
                        </div>
                    )}

                    {/* Notes Section */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] overflow-hidden">
                        <div className="p-8 border-b border-[#d9d9d9] flex justify-between items-center">
                            <h3 className="text-xs font-black text-[#414042]/40 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Bitácora de Notas
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="flex gap-4">
                                <input
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6c71e]/50 focus:bg-white transition-all"
                                    placeholder="Registrar un comentario o actualización..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                />
                                <button
                                    onClick={handleAddNote}
                                    className="px-8 py-3 bg-[#414042] text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    Publicar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Details Tabs (SMS / Calls) */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] overflow-hidden">
                        <div className="grid grid-cols-1 text-center border-b border-[#d9d9d9]">
                            <div className="py-4 text-[10px] font-black text-[#414042] uppercase tracking-widest bg-gray-50/50">Llamadas ({callEvents.length})</div>
                        </div>
                        <div className="p-0">
                            {callEvents.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/30">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-8 py-3 text-[10px] font-bold text-gray-400 uppercase">Estado</th>
                                            <th className="px-8 py-3 text-[10px] font-bold text-gray-400 uppercase">Duración</th>
                                            <th className="px-8 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {callEvents.map(call => (
                                            <tr key={call.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-4">
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                                        call.status_crm === 'EXITOSA' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    )}>
                                                        {call.status_crm}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-xs font-bold text-[#414042]">{call.duration_seconds}s</td>
                                                <td className="px-8 py-4 text-[10px] font-bold text-gray-400 text-right">
                                                    {new Date(call.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-xs text-gray-400 italic">No hay registros de llamadas.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Timeline & Health) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Next Action / Schedule Status */}
                    {schedule && new Date(schedule.next_attempt_at) > new Date() && (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-blue-100 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Clock className="w-24 h-24 text-blue-600" />
                            </div>
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Seguimiento Automático
                            </h3>

                            <p className="text-sm font-bold text-[#414042] mb-1">
                                {schedule.attempts_today > 0
                                    ? "Llamada no atendida."
                                    : "Llamada Inicial Pendiente."}
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Se agenda para el siguiente bloque: <br />
                                <strong className="text-blue-600 text-sm">
                                    {new Date(schedule.next_attempt_at).toLocaleString('es-ES', {
                                        weekday: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </strong>
                            </p>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-[#d9d9d9] p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black text-[#414042]/40 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Timeline de Actividad
                            </h3>
                            <button onClick={fetchLeadData} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <Hash className="w-4 h-4 text-gray-300" />
                            </button>
                        </div>
                        <div className="relative pr-4">
                            <Timeline events={events.filter(e => e.event_type.startsWith('call.')).slice(0, 5)} />
                        </div>
                    </div>

                    {/* Side Info / CTA? */}
                    <div className="bg-gradient-to-br from-[#f6c71e] to-[#e5b810] rounded-[2rem] p-8 text-[#414042] shadow-xl shadow-[#f6c71e]/10">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-2 italic">Tip de CRM</h4>
                        <p className="text-xs font-medium leading-relaxed opacity-80">
                            Mantén el estado actualizado para que el sistema de orquestación pueda priorizar el seguimiento automático.
                        </p>
                        <div className="mt-8">
                            <button className="w-full bg-[#414042] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                                <ExternalLink className="w-4 h-4" /> Perfil Externo
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
