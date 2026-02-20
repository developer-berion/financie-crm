import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import NoteModal from '../components/NoteModal';
import MetricBar from '../components/MetricBar';
import Breadcrumb from '../components/Breadcrumb';
import StageTracker from '../components/leads/StageTracker';
import EarlyStageView from '../components/leads/views/EarlyStageView';
import MidStageView from '../components/leads/views/MidStageView';
import LateStageView from '../components/leads/views/LateStageView';
import { validateLeadStageGate } from '../lib/stage-gates';
import { StageGateModal } from '../components/pipeline/StageGateModal';
import TaskList from '../components/leads/TaskList';
import TaskModal from '../components/tasks/TaskModal';
import type { Task } from '../types';

import { Phone, Clock, MessageCircle, Layout, Info, Calendar } from 'lucide-react';
import { cn, ENABLE_AI_FEATURES } from '../lib/utils';
import { toast } from 'sonner';
import { PopupModal, useCalendlyEventListener } from "react-calendly";
import AppointmentsList from '../components/AppointmentsList';
import { getStatusConfig } from '../lib/constants';
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [gateModalState, setGateModalState] = useState<{
        isOpen: boolean;
        targetStageId: string;
        targetStageName: string;
        missingFields: string[];
    }>({
        isOpen: false,
        targetStageId: '',
        targetStageName: '',
        missingFields: []
    });
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

        // Fetch Pending Tasks
        const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('lead_id', id)
            .eq('status', 'pending')
            .order('due_at', { ascending: true });

        if (taskData) setTasks(taskData);

        setLoading(false);
    }

    const rootElement = document.getElementById("root");

    useCalendlyEventListener({
        onEventScheduled: async () => {
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


    const handleUpdateLead = async (field: string, value: unknown) => {
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

    const handleBulkUpdateLead = async (updates: Record<string, any>) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setLead((prev: any) => {
                const newLead = { ...prev, ...updates };
                if (updates.stage_id) {
                    const newStage = stages.find(s => s.id === updates.stage_id);
                    if (newStage) {
                        newLead.pipeline_stages = { id: newStage.id, name: newStage.name };
                    }
                }
                return newLead;
            });
            toast.success('Lead actualizado');
        } catch (error) {
            console.error('Error updating lead via bulk:', error);
            toast.error('Error al guardar datos. Revisa que cumples las validaciones.');
            throw error;
        }
    };

    const handleStageChange = (stageId: string) => {
        const targetStageName = stages.find(s => s.id === stageId)?.name || '';
        const missingFields = validateLeadStageGate(lead, targetStageName);

        if (missingFields.length > 0) {
            setGateModalState({
                isOpen: true,
                targetStageId: stageId,
                targetStageName,
                missingFields
            });
            return;
        }

        handleUpdateLead('stage_id', stageId);

        supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'pipeline.stage_changed',
            payload: { to: targetStageName, manual: true, requirements_met: true }
        }).then();
    };

    const handleGateModalSubmit = async (updates: Partial<any>) => {
        const { targetStageId, targetStageName } = gateModalState;

        await handleBulkUpdateLead({
            ...updates,
            stage_id: targetStageId
        });

        supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'pipeline.stage_changed',
            payload: { to: targetStageName, manual: true, requirements_met: true }
        }).then();
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




    if (loading) return <div>Cargando...</div>;
    if (!lead) return <div>Lead no encontrado</div>;

    // Use stage_id directly as source of truth
    const currentStageId = lead.stage_id;
    // Find current stage name for color logic
    const currentStageName = stages.find(s => s.id === currentStageId)?.name || '';
    const statusConfig = getStatusConfig(lead.status);


    const sourceLabel = lead.source === 'facebook' ? 'Facebook' : lead.source === 'web' ? 'Web' : lead.source || 'Desconocido';

    return (
        <div className="max-w-7xl mx-auto pb-20 font-sans text-brand-text bg-gray-50 min-h-screen">
            <div className="bg-white border-b border-brand-border sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Breadcrumb items={[
                        { label: 'Inicio', href: '/' },
                        { label: 'Leads', href: '/leads' },
                        { label: lead.full_name }
                    ]} />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-gray-600 text-2xl font-bold shadow-inner border border-brand-border/50">
                                {lead.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">{lead.full_name}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    {currentStageName} • {sourceLabel}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={cn(
                                        "px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm",
                                        statusConfig.bg,
                                        statusConfig.color,
                                        statusConfig.border
                                    )}>
                                        {lead.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Pinned Fields */}
                        <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">

                            {/* Priority */}
                            <div className="group flex flex-col items-end">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Prioridad</label>
                                <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 font-bold text-xs text-brand-primary">
                                    {lead.priority === 'High' ? '🔴 Alta' : lead.priority === 'Medium' ? '🟡 Media' : lead.priority === 'Low' ? '🟢 Baja' : '🟡 Media'}
                                </div>
                            </div>

                            {/* Close Date */}
                            <div className="group flex flex-col items-end">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cierre Estimado</label>
                                <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 font-bold text-xs text-gray-700">
                                    {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : 'No definido'}
                                </div>
                            </div>

                            {/* Value Display/Edit */}
                            <div className="group flex flex-col items-end ml-2">
                                <label className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest mb-0.5 group-hover:text-green-600 transition-colors">Valor Estimado</label>
                                <div className="flex items-baseline gap-1 bg-green-50/50 px-3 py-1 rounded-lg border border-transparent hover:border-green-200 transition-all">
                                    <span className="text-green-600 font-bold text-lg">$</span>
                                    <input
                                        type="number"
                                        value={lead.estimated_value || ''}
                                        onChange={(e) => handleUpdateLead('estimated_value', Number(e.target.value))}
                                        className="bg-transparent text-xl font-black text-green-700 w-20 text-right focus:outline-none focus:border-b-2 border-green-500 placeholder-green-700/20"
                                        placeholder="0"
                                    />
                                    <span className="text-[10px] font-bold text-green-600 ml-1">USD</span>
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

                {/* Horizontal Stage Tracker */}
                <div className="mb-8">
                    <StageTracker
                        stages={stages}
                        currentStageId={currentStageId}
                        onStageChange={handleStageChange}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN - WORK ZONE (70%) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Task List - Dynamic Actions */}
                        <TaskList
                            tasks={tasks}
                            onTaskCompleted={fetchLeadData}
                            onAddTask={() => setIsTaskModalOpen(true)}
                        />

                        {(() => {
                            const currentStageOrder = stages.find(s => s.id === currentStageId)?.sort_order || 0;
                            // Example logic: Early <= 2, Mid = 3, Late >= 4
                            if (currentStageOrder <= 2) {
                                return (
                                    <EarlyStageView
                                        lead={lead}
                                        notes={notes}
                                        onUpdateLead={handleUpdateLead}
                                        onNewNote={handleNewNote}
                                        onEditNote={handleEditNote}
                                    />
                                );
                            } else if (currentStageOrder === 3) {
                                return (
                                    <MidStageView
                                        lead={lead}
                                        notes={notes}
                                        onNewNote={handleNewNote}
                                        onEditNote={handleEditNote}
                                    />
                                );
                            } else {
                                return (
                                    <LateStageView
                                        lead={lead}
                                        notes={notes}
                                        onUpdateLead={handleUpdateLead}
                                        onNewNote={handleNewNote}
                                        onEditNote={handleEditNote}
                                    />
                                );
                            }
                        })()}
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
                                <Timeline
                                    events={events}
                                    onEventClick={(e) => {
                                        if (e.event_type === 'conversation.completed') {
                                            const p = e.payload as Record<string, unknown>;
                                            const analysis = p?.analysis as Record<string, unknown>;
                                            setConversation({
                                                summary: analysis?.summary as string,
                                                transcript: (p?.transcript || p?.transcription) as string
                                            });
                                            setIsTranscriptModalOpen(true);
                                        }
                                    }}
                                />
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

            {/* View/Edit Conversation Transcript Modal (AI FEATURE) */}
            {
                ENABLE_AI_FEATURES && (
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
                )
            }

            {lead && (
                <StageGateModal
                    isOpen={gateModalState.isOpen}
                    onClose={() => setGateModalState(prev => ({ ...prev, isOpen: false }))}
                    lead={lead}
                    targetStageName={gateModalState.targetStageName}
                    missingFields={gateModalState.missingFields}
                    onSubmit={handleGateModalSubmit}
                />
            )}

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                leadId={id}
                onTaskCreated={fetchLeadData}
            />

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
        </div >
    );
}
