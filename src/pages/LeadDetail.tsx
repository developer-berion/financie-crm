import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import NoteModal from '../components/NoteModal';
import ElevenLabsCallCard from '../components/ElevenLabsCallCard';
import { Ban, Clock, MessageSquare, Phone, Mail, User, MapPin, Tag, Calendar, Hash, Info, Plus, FileText, Edit3 } from 'lucide-react';
import { cn, formatLeadTime } from '../lib/utils';

export default function LeadDetail() {
    const { id } = useParams<{ id: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lead, setLead] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]);
    const [callEvents, setCallEvents] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any>(null);
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [calling, setCalling] = useState(false);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<any>(null);

    useEffect(() => {
        if (id) fetchLeadData();
    }, [id]);

    async function fetchLeadData() {
        setLoading(true);
        if (!id) return;

        // Fetch Lead
        const { data: leadData } = await supabase.from('leads').select('*, bot_verification, pipeline_stages(name)').eq('id', id).single();
        if (leadData) setLead(leadData);

        // Fetch Lead Events (Timeline)
        const { data: eventData } = await supabase
            .from('lead_events')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (eventData) setEvents(eventData);

        // Fetch Notes
        const { data: notesData } = await supabase
            .from('notes')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (notesData) setNotes(notesData);



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



    const handleNewNote = () => {
        setSelectedNote(null);
        setIsNoteModalOpen(true);
    };

    const handleEditNote = (note: any) => {
        setSelectedNote(note);
        setIsNoteModalOpen(true);
    };

    const handleNoteSaved = () => {
        fetchLeadData();
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
        if (!confirm(`¿Lanzar llamada INMEDIATA a ${lead.full_name}?`)) return;

        setCalling(true);
        try {
            // Direct call to Make Outbound Call Function
            const { data, error } = await supabase.functions.invoke('make_outbound_call', {
                body: { lead_id: lead.id }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            alert('Llamada iniciada con éxito. Debería sonar en breve.');
            fetchLeadData();
        } catch (err: any) {
            console.error('Error invoking make_outbound_call:', err);
            alert('Error al lanzar llamada: ' + (err.message || JSON.stringify(err)));
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

    const getTimeZoneLabel = (state?: string) => {
        if (!state) return '';
        const s = state.toLowerCase().trim();
        if (['florida', 'fl', 'new york', 'ny', 'georgia', 'ga', 'north carolina', 'nc', 'ohio', 'oh', 'pennsylvania', 'pa'].includes(s)) return 'Hora del Este';
        if (['texas', 'tx', 'illinois', 'il', 'minnesota', 'mn', 'missouri', 'mo'].includes(s)) return 'Hora Central';
        if (['california', 'ca', 'washington', 'wa', 'nevada', 'nv', 'oregon', 'or'].includes(s)) return 'Hora del Pacífico';
        if (['colorado', 'co', 'arizona', 'az'].includes(s)) return 'Hora de Montaña';
        return '';
    };

    const extractAgendaFromTranscript = (text: string) => {
        if (!text) return null;
        // Search for date patterns: "26 de enero", "lunes 27", etc.
        const datePattern = /(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)?\s*\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
        // Search for time patterns: "11:00 AM", "a las 3", etc.
        const timePattern = /(?:\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)|(?:a\s+las\s+\d{1,2}(?::\d{2})?)/i;

        const dateMatch = text.match(datePattern);
        const timeMatch = text.match(timePattern);

        if (dateMatch || timeMatch) {
            return {
                date: dateMatch ? dateMatch[0] : null,
                time: timeMatch ? timeMatch[0] : null
            };
        }
        return null;
    };

    const detectedAgenda = conversation?.transcript ? extractAgendaFromTranscript(conversation.transcript) : null;

    if (loading) return <div>Cargando...</div>;
    if (!lead) return <div>Lead no encontrado</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-brand-text">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-primary text-2xl font-bold shadow-inner">
                            {lead.full_name?.charAt(0) || <User />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-brand-primary tracking-tight">{lead.full_name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-semibold border",
                                    getBadgeStyle(lead.status)
                                )}>
                                    {lead.status}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 border-gray-200 text-gray-600">
                                    {lead.pipeline_stages?.name}
                                </span>
                                {lead.do_not_call && (
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-50 border-red-100 text-red-600 flex items-center gap-1">
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
                                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-red-100 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Ban className="w-4 h-4" /> DNC
                            </button>
                        )}
                        <button
                            onClick={handleCall}
                            disabled={calling || lead.do_not_call}
                            className={cn(
                                "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md",
                                calling
                                    ? "bg-gray-100 cursor-not-allowed text-gray-400 border border-brand-border"
                                    : "bg-brand-secondary hover:bg-brand-primary active:scale-95"
                            )}
                        >
                            <Phone className="w-4 h-4" />
                            {calling ? 'Conectando...' : 'Llamar con AI'}
                        </button>
                    </div>
                </div>

                {/* Agenda Detection Alert */}
                {(conversation?.scheduled_datetime || detectedAgenda) && (
                    <div className="mt-8 bg-green-50/50 border border-green-100 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                                    Cita Confirmada
                                    <span className="text-[10px] font-medium lowercase text-green-500/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                        (Detectada por AI)
                                    </span>
                                </p>
                                <h4 className="text-base font-semibold text-brand-primary">
                                    {conversation?.scheduled_datetime
                                        ? new Date(conversation.scheduled_datetime).toLocaleString('es-ES', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: 'long',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        }) + ` ${getTimeZoneLabel(lead.state)}`
                                        : `${detectedAgenda?.date || ''} ${detectedAgenda?.time || ''}`}
                                    {conversation?.scheduled_channel && (
                                        <span className="ml-2 text-xs font-normal text-gray-400">
                                            vía <span className="font-semibold text-brand-secondary capitalize">{conversation.scheduled_channel}</span>
                                        </span>
                                    )}
                                </h4>
                                <p className="text-[10px] text-green-700/60 font-medium mt-0.5">
                                    ✓ Debes crear la agenda en tu calendario corporativo.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-green-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-green-700">
                                Cita confirmada
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (Main Info & Interaction) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Contact & Bio Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 flex flex-col h-full">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <User className="w-4 h-4" /> Datos de Contacto
                            </h3>
                            <div className="space-y-5 flex-1">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-gray-400 group-hover:text-brand-accent transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</p>
                                        <p className="text-sm font-medium text-brand-text">{lead.email || 'No proporcionado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-gray-400 group-hover:text-brand-accent transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Teléfono</p>
                                        <p className="text-sm font-medium text-brand-text">{lead.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-gray-400 group-hover:text-brand-accent transition-colors">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ubicación</p>
                                        <p className="text-sm font-medium text-brand-text">{lead.state || 'Nacional / Desconocido'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 flex flex-col h-full">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Información del Lead
                            </h3>
                            <div className="space-y-3 flex-1">
                                <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
                                    <span className="text-xs text-gray-500">Origen</span>
                                    <span className="text-xs font-semibold text-brand-primary bg-brand-bg px-2 py-1 rounded-md capitalize">{lead.source}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
                                    <span className="text-xs text-gray-500">Fecha de Creación</span>
                                    <span className="text-xs font-medium text-brand-text">{new Date(lead.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-gray-500">Consentimiento</span>
                                    {lead.marketing_consent ? (
                                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full ring-1 ring-green-100 uppercase">Aceptado</span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase">No Registrado</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Lead Qualification (Editable) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 md:p-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Tag className="w-4 h-4" /> Calificación
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Objetivo Principal</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all appearance-none"
                                        value={normalizeObjective(lead.main_objective)}
                                        onChange={(e) => handleUpdateLead('main_objective', e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Protección Familiar">Protección Familiar</option>
                                        <option value="Ahorro para retiro">Ahorro para retiro</option>
                                        <option value="Educación para tus hijos">Educación para tus hijos</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ingresos Estables</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all appearance-none"
                                        value={normalizeYesNo(lead.stable_income)}
                                        onChange={(e) => handleUpdateLead('stable_income', e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Si">Si</option>
                                        <option value="No">No</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Condición de Salud</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all appearance-none"
                                        value={normalizeYesNo(lead.health_condition)}
                                        onChange={(e) => handleUpdateLead('health_condition', e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Si">Si</option>
                                        <option value="No">No</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Verificación Anti-Bot</label>
                                <div className="relative">
                                    <div className={cn(
                                        "w-full border rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2",
                                        lead.bot_verification
                                            ? "bg-white border-brand-border text-brand-text"
                                            : "bg-gray-50 border-gray-100 text-gray-400 italic"
                                    )}>
                                        {lead.bot_verification ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                {lead.bot_verification}
                                            </>
                                        ) : "No aplica / No data"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights Card (Replaced with new Component) */}
                    {conversation ? (
                        <ElevenLabsCallCard conversation={conversation} leadState={lead.state} />
                    ) : (
                        <div className="bg-brand-bg rounded-2xl border border-brand-border p-10 text-center">
                            <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-brand-border flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h4 className="text-brand-text font-semibold text-sm">Sin conversaciones AI</h4>
                            <p className="text-xs text-gray-400 mt-1">Inicia una llamada para generar datos.</p>
                        </div>
                    )}

                    {/* Notes Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Notas ({notes.length})
                            </h3>
                            <button
                                onClick={handleNewNote}
                                className="px-3 py-1.5 bg-white border border-brand-border text-brand-primary text-xs font-bold rounded-lg hover:border-brand-primary transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <Plus className="w-3 h-3" />
                                Nueva Nota
                            </button>
                        </div>
                        <div className="p-6">
                            {notes.length > 0 ? (
                                <div className="grid gap-4">
                                    {notes.map(note => (
                                        <div
                                            key={note.id}
                                            onClick={() => handleEditNote(note)}
                                            className="group relative bg-white border border-brand-border hover:border-brand-accent/50 rounded-xl p-4 transition-all hover:shadow-md cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm text-brand-primary group-hover:text-brand-accent transition-colors">
                                                    {note.title}
                                                </h4>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                                    {new Date(note.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                {note.content}
                                            </p>
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="p-1.5 bg-brand-bg rounded-lg text-brand-accent">
                                                    <Edit3 className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">No hay notas registradas</p>
                                    <button
                                        onClick={handleNewNote}
                                        className="mt-2 text-xs font-bold text-brand-secondary hover:underline"
                                    >
                                        Crear la primera nota
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Tabs (Calls) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Historial de Llamadas ({callEvents.length})</span>
                        </div>
                        <div>
                            {callEvents.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">Duración</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {callEvents.map(call => (
                                            <tr key={call.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                                                        call.status_crm === 'EXITOSA' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                                    )}>
                                                        {call.status_crm}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-xs font-medium text-brand-text">{call.duration_seconds}s</td>
                                                <td className="px-6 py-3 text-[10px] font-medium text-gray-400 text-right">
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
                    {schedule && schedule.active && (
                        <div className={cn(
                            "rounded-2xl shadow-sm border p-6 relative overflow-hidden group transition-all",
                            new Date(schedule.next_attempt_at) > new Date()
                                ? "bg-white border-blue-100"
                                : "bg-orange-50 border-orange-100"
                        )}>
                            <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Clock className={cn("w-32 h-32", new Date(schedule.next_attempt_at) > new Date() ? "text-blue-600" : "text-orange-600")} />
                            </div>
                            <h3 className={cn(
                                "text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4",
                                new Date(schedule.next_attempt_at) > new Date() ? "text-blue-600" : "text-orange-600"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", new Date(schedule.next_attempt_at) > new Date() ? "bg-blue-500" : "bg-orange-500")} />
                                {new Date(schedule.next_attempt_at) > new Date() ? "Próxima Llamada" : "Llamada Pendiente"}
                            </h3>

                            <p className="text-sm font-semibold text-brand-text mb-1">
                                {schedule.attempts_today > 0
                                    ? "Reintento programado"
                                    : "Llamada inicial pendiente"}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <div className={cn(
                                    "inline-block px-3 py-1.5 rounded-lg border",
                                    new Date(schedule.next_attempt_at) > new Date()
                                        ? "bg-blue-50 border-blue-100 text-blue-700"
                                        : "bg-orange-100 border-orange-200 text-orange-800"
                                )}>
                                    <p className="text-xs font-medium flex items-center gap-1.5">
                                        {new Date(schedule.next_attempt_at) < new Date() && <Clock className="w-3 h-3" />}
                                        {(() => {
                                            const { day, time, friendlyZone } = formatLeadTime(schedule.next_attempt_at, lead?.state);
                                            return `${day}, ${time} (${lead?.state || 'US'} - ${friendlyZone})`;
                                        })()}
                                        {new Date(schedule.next_attempt_at) < new Date() && <span className="text-[10px] uppercase font-bold opacity-75 ml-1">(En Cola)</span>}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!confirm('¿Cancelar la próxima llamada programada?')) return;

                                        // 1. Cancel active schedule
                                        await supabase.from('call_schedules').update({ active: false }).eq('lead_id', id);

                                        // 2. Cancel pending jobs
                                        await supabase.from('jobs')
                                            .update({ status: 'CANCELLED' })
                                            .eq('lead_id', id)
                                            .eq('status', 'PENDING');

                                        // 3. Log event
                                        await supabase.from('lead_events').insert({
                                            lead_id: id,
                                            event_type: 'call.cancelled_manual',
                                            payload: { by: 'user_action' }
                                        });

                                        fetchLeadData();
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 text-xs font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Timeline
                            </h3>
                            <button onClick={fetchLeadData} className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-brand-primary">
                                <Hash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="relative">
                            <Timeline events={events.filter(e => e.event_type.startsWith('call.')).slice(0, 5)} />
                        </div>
                    </div>

                    {/* Tip Card */}
                    <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent">
                                <Info className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-1">Tip de Gestión</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Mantén el estado actualizado para que el sistema priorice el seguimiento.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Transcription Modal */}
            <Modal
                isOpen={isTranscriptModalOpen}
                onClose={() => setIsTranscriptModalOpen(false)}
                title="Transcripción de Llamada"
            >
                <div className="space-y-6">
                    <div className="bg-brand-primary text-white p-6 rounded-xl shadow-inner">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Resumen</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            {conversation?.summary}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                            Diálogo Completo
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-6 text-sm font-mono text-brand-text leading-relaxed whitespace-pre-wrap border border-gray-100 max-h-[60vh] overflow-y-auto">
                            {conversation?.transcript}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Note Modal */}
            <NoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                note={selectedNote}
                leadId={id || ''}
                onNoteSaved={handleNoteSaved}
            />
        </div >
    );
}
