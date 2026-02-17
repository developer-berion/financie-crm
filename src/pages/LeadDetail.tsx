import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import NoteModal from '../components/NoteModal';
import MetricBar from '../components/MetricBar';
import QualificationPanel from '../components/QualificationPanel';

import { Phone, Clock, MessageCircle, Plus, FileText, Edit3, Layout, Info, ExternalLink, Calendar } from 'lucide-react';
import { cn, formatLeadTime } from '../lib/utils';
import { toast } from 'sonner';
import { PopupModal, useCalendlyEventListener } from "react-calendly";
import AppointmentsList from '../components/AppointmentsList';
// import type { Database } from '../types/supabase'; // Type definition not found, using explicit types or any where needed

// Simple interface for PipelineStage to avoid dependency on missing types file
interface PipelineStage {
    id: string;
    name: string;
    description?: string | null;
    sort_order: number; // Changed from position
    created_at: string;
}

export default function LeadDetail() {
    const { id } = useParams<{ id: string }>();
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lead, setLead] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]);
    // const [callEvents, setCallEvents] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);

    useEffect(() => {
        if (id) {
            fetchLeadData();
            fetchStages();
        }
    }, [id]);

    async function fetchStages() {
        const { data } = await supabase
            .from('pipeline_stages')
            .select('*')
            .order('sort_order'); // Changed from 'position' to 'sort_order' to match schema
        if (data) setStages(data);
    }

    async function fetchLeadData() {
        setLoading(true);
        if (!id) return;

        // Fetch Lead
        const { data: leadData } = await supabase.from('leads').select('*, bot_verification, pipeline_stages(id, name)').eq('id', id).single();
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
        /*
        const { data: callData } = await supabase
            .from('call_events')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (callData) setCallEvents(callData);
        */

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

    const rootElement = document.getElementById("root");

    useCalendlyEventListener({
        onEventScheduled: async (_e) => {
            setIsCalendlyOpen(false);
            toast.success('Reunión agendada con éxito');
            toast.loading('Sincronizando con Calendly...', { id: 'sync-calendly' });

            try {
                // Trigger Sync
                await supabase.functions.invoke('sync_calendly_events');

                // Refresh data
                await fetchLeadData();
                toast.success('Sincronización completada', { id: 'sync-calendly' });
            } catch (error) {
                console.error('Sync failed', error);
                toast.error('Error al sincronizar, intenta manualmente', { id: 'sync-calendly' });
            }
        },
    });

    const [initialNoteTitle, setInitialNoteTitle] = useState('');


    const handleUpdateLead = async (field: string, value: any) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ [field]: value })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setLead((prev: any) => ({ ...prev, [field]: value }));

            // If updating stage, also update the nested object for display
            if (field === 'stage_id') {
                const newStage = stages.find(s => s.id === value);
                if (newStage) {
                    setLead((prev: any) => ({
                        ...prev,
                        pipeline_stages: { id: newStage.id, name: newStage.name }
                    }));
                }
            }

        } catch (error) {
            console.error('Error updating lead:', error);
            toast.error('Error al actualizar el campo');
        }
    };



    const handleNewNote = () => {
        setSelectedNote(null);
        setInitialNoteTitle('');
        setIsNoteModalOpen(true);
    };

    const handleEditNote = (note: any) => {
        setSelectedNote(note);
        setInitialNoteTitle(note.title || '');
        // setPendingOutcome(null); // Removed as state was deleted
        setIsNoteModalOpen(true);
    };



    const handleNoteSaved = async () => {
        await fetchLeadData();
    };




    const getBadgeStyle = (status: string) => {
        const lowerStatus = status?.toLowerCase() || '';
        if (lowerStatus.includes('nuevo')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (lowerStatus.includes('ganado')) return 'bg-green-50 text-green-600 border-green-100';
        if (lowerStatus.includes('perdido')) return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    };

    const getStageColorStyle = (stageName: string = '') => {
        const lowerName = stageName.toLowerCase();
        if (lowerName.includes('contacto 1')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (lowerName.includes('contacto 2')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (lowerName.includes('contacto 3')) return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-600 border-gray-200'; // Default
    };


    if (loading) return <div>Cargando...</div>;
    if (!lead) return <div>Lead no encontrado</div>;

    // Use stage_id directly as source of truth
    const currentStageId = lead.stage_id;
    // Handle both array and object formats due to join quirks
    // const currentPipelineStageId = lead.stage_id; // Redundant
    // const isContactStage = currentPipelineStageId === '6f9d1920-6ed2-4c0c-8cb4-4979e1460ce4'; // Removed

    // Find current stage name for color logic
    const currentStageName = stages.find(s => s.id === currentStageId)?.name || '';


    return (
        <div className="max-w-7xl mx-auto pb-20 font-sans text-brand-text bg-gray-50 min-h-screen">
            {/* Header Sticky */}
            <div className="bg-white border-b border-brand-border sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        {/* Lead Name and Status */}
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-primary text-2xl font-bold shadow-inner border border-brand-border/50">
                                {lead.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-brand-primary tracking-tight leading-time">{lead.full_name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={cn(
                                        "px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm",
                                        getBadgeStyle(lead.status)
                                    )}>
                                        {lead.status}
                                    </span>

                                    {/* Stage Selector */}
                                    <div className="relative group">
                                        <select
                                            value={currentStageId || ''}
                                            onChange={(e) => handleUpdateLead('stage_id', e.target.value)}
                                            className={cn(
                                                "appearance-none text-xs font-bold rounded-full px-3 py-1 pr-7 cursor-pointer transition-all focus:ring-0 focus:border-brand-accent/50 border",
                                                getStageColorStyle(currentStageName)
                                            )}
                                        >
                                            <option value="" disabled>Sin etapa</option>
                                            {stages.map(stage => (
                                                <option key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 font-bold opacity-50">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Value */}
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            {/* Value Display/Edit */}
                            <div className="group flex flex-col items-end">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 group-hover:text-green-600 transition-colors">Valor Estimado</label>
                                <div className="flex items-baseline gap-1 bg-green-50/50 px-3 py-1 rounded-lg border border-transparent hover:border-green-200 transition-all">
                                    <span className="text-green-600 font-bold text-lg">$</span>
                                    <input
                                        type="number"
                                        value={lead.estimated_value || ''}
                                        onChange={(e) => handleUpdateLead('estimated_value', Number(e.target.value))}
                                        className="bg-transparent text-2xl font-black text-green-700 w-24 text-right focus:outline-none focus:border-b-2 border-green-500 placeholder-green-700/20"
                                        placeholder="0"
                                    />
                                    <span className="text-xs font-bold text-green-600 ml-1">USD</span>
                                </div>
                            </div>

                            <div className="h-10 w-px bg-gray-200 hidden md:block" />

                            <div className="flex items-center gap-3">
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 hover:scale-105 transition-all active:scale-95"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span className="hidden sm:inline">Llamar</span>
                                </a>
                                <a
                                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-xl font-bold shadow-lg shadow-[#25D366]/20 hover:bg-[#25D366]/90 hover:scale-105 transition-all active:scale-95"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                </a>
                                <button
                                    onClick={() => setIsCalendlyOpen(true)}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold shadow-sm hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all active:scale-95"
                                >
                                    <Calendar className="w-5 h-5" />
                                    <span className="hidden sm:inline">Agendar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Bar */}
                <MetricBar
                    phone={lead.phone}
                    email={lead.email}
                    location={lead.state}
                    source={lead.source}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN - WORK ZONE (70%) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Contact Strategy Should be here */}


                        {/* Qualification Panel */}
                        <QualificationPanel
                            objective={lead.main_objective}
                            income={lead.stable_income}
                            health={lead.health_condition}
                            botVerification={lead.bot_verification}
                            onUpdate={handleUpdateLead}
                        />

                        {/* Notes Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                            <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Notas de Gestión</h2>
                                        <p className="text-xs text-gray-500">Historial de interacciones y apuntes clave</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleNewNote}
                                    className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-primary/90 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva Nota
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {notes.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm mb-4">
                                            <FileText className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <h3 className="text-gray-900 font-medium mb-1">No hay notas registradas</h3>
                                        <p className="text-xs text-gray-400">Registra la primera interacción clave con este lead.</p>
                                        <button onClick={handleNewNote} className="mt-4 text-brand-accent text-sm font-bold hover:underline">Crear nota ahora</button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {notes.map((note) => (
                                            <div
                                                key={note.id}
                                                onClick={() => handleEditNote(note)}
                                                className="group relativebg-white p-5 rounded-xl border border-gray-100 hover:border-brand-accent/30 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50/50"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-bold text-brand-primary text-base group-hover:text-brand-accent transition-colors">{note.title}</h4>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-100 uppercase tracking-wider">
                                                        {formatLeadTime(note.created_at).date}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-3 group-hover:text-gray-800 transition-colors">{note.content}</p>

                                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-400">
                                                        {note.archived ? 'Archivada' : 'Activa'}
                                                    </span>
                                                    <span className="text-xs font-medium text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        Editar <ExternalLink className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN - HISTORY ZONE (30%) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Appointments List (Auto-Hides if empty) */}
                        <AppointmentsList events={events} />

                        {/* Timeline */}
                        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 h-[500px] flex flex-col">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Línea de Tiempo
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <Timeline events={events} />
                            </div>
                        </div>

                        {/* Technical Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-brand-border/50 pb-2">
                                <Layout className="w-4 h-4" />
                                Detalles Técnicos
                            </h3>
                            <div className="space-y-3 text-xs text-gray-500">
                                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                    <span className="font-medium">ID del Lead:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 select-all">{lead.id.split('-')[0]}...</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                    <span className="font-medium">Creado el:</span>
                                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                    <span className="font-medium">Verificación Bot:</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[10px]",
                                        lead.bot_verification === 'human' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                    )}>{lead.bot_verification || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="font-medium">Consentimiento:</span>
                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> ACEPTADO
                                    </span>
                                </div>
                            </div>

                            {/* Tip Card embedded */}
                            <div className="mt-6 bg-brand-bg rounded-xl p-4 border border-brand-border/50">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-brand-accent">
                                        <Info className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mb-1">Tip de Gestión</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                            Mantén el <strong>Valor Estimado</strong> actualizado. Esto ayuda a priorizar los leads más valiosos en el Pipeline.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <NoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                leadId={id || ''}
                note={selectedNote}
                onNoteSaved={handleNoteSaved}
                initialTitle={initialNoteTitle}
            />

            {/* View/Edit Conversation Transcript Modal */}
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

            {/* Calendly Modal */}
            <PopupModal
                url="https://calendly.com/biancafinanzas"
                onModalClose={() => setIsCalendlyOpen(false)}
                open={isCalendlyOpen}
                rootElement={rootElement!}
                prefill={{
                    email: lead.email || '',
                    name: lead.full_name || '',
                }}
            />
        </div>
    );
}
