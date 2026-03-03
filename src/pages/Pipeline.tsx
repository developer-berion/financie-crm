import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core';
import type {
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Lead, PipelineStage } from '../types';
import DealCard from '../components/pipeline/DealCard';
import KanbanHeader from '../components/pipeline/KanbanHeader';
import { toast } from 'sonner';
import NoteModal from '../components/NoteModal';
import { validateLeadStageGate } from '../lib/stage-gates';
import { StageGateModal } from '../components/pipeline/StageGateModal';

type SupabaseErrorLike = {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
};

function normalizeSupabaseError(error: unknown): SupabaseErrorLike {
    if (error && typeof error === 'object') {
        const maybe = error as SupabaseErrorLike;
        return {
            message: maybe.message,
            details: maybe.details,
            hint: maybe.hint,
            code: maybe.code,
        };
    }
    return { message: String(error) };
}

function extractMissingFields(error: SupabaseErrorLike): string[] {
    const source = [error.message, error.details, error.hint].filter(Boolean).join(' ');
    const marker = 'MISSING_FIELDS:';
    const index = source.indexOf(marker);
    if (index === -1) return [];
    return source
        .slice(index + marker.length)
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean);
}

function hasMissingApiKey(error: SupabaseErrorLike): boolean {
    const source = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
    return source.includes('no api key found');
}

// Column Component
function KanbanColumn({ stage, leads, onAddNote }: { stage: PipelineStage; leads: Lead[]; onAddNote: (lead: Lead) => void }) {
    const { setNodeRef } = useDroppable({ id: stage.id });

    return (
        <div className="flex-shrink-0 w-80 bg-slate-50/50 rounded-xl p-2 mr-4 flex flex-col h-full max-h-full border border-slate-200/60">
            <KanbanHeader stageName={stage.name} leads={leads} />

            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px] px-1 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map((lead) => (
                        <DealCard key={lead.id} lead={lead} onAddNote={onAddNote} />
                    ))}
                </SortableContext>
                {leads.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-4">
                        Arrastra un deal aquí
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Pipeline() {
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedLeadForNote, setSelectedLeadForNote] = useState<Lead | null>(null);
    const [gateModalState, setGateModalState] = useState<{
        isOpen: boolean;
        lead: Lead | null;
        targetStageId: string;
        targetStageName: string;
        missingFields: string[];
    }>({
        isOpen: false,
        lead: null,
        targetStageId: '',
        targetStageName: '',
        missingFields: []
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();

        // Subscription for real-time updates
        const subscription = supabase
            .channel('pipeline_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                    // Simple refresh for now to keep it safe
                    fetchData();
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    async function fetchData() {
        const { data: stagesData } = await supabase.from('pipeline_stages').select('*').order('sort_order');
        // Fetch new fields for value context
        const { data: leadsData } = await supabase
            .from('leads')
            .select('id, full_name, phone, stage_id, estimated_value, currency, source, updated_at, created_at')
            .order('updated_at', { ascending: false });

        if (stagesData) setStages(stagesData);
        if (leadsData) setLeads(leadsData as Lead[]);
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const leadId = active.id as string;
        let targetStageId = over.id as string;

        // Check if over.id is a card (dropped on top of another card)
        const overLead = leads.find(l => l.id === over.id);
        if (overLead) {
            targetStageId = overLead.stage_id || '';
        }

        // Validate target is a valid stage
        if (!stages.find(s => s.id === targetStageId) && !overLead) {
            return;
        }

        // Find current lead to check if it actually moved
        const currentLead = leads.find(l => l.id === leadId);
        if (!currentLead || currentLead.stage_id === targetStageId) return;

        // --- NEW Validation Rule Check ---
        const targetStageName = stages.find(s => s.id === targetStageId)?.name || '';
        const missingFields = validateLeadStageGate(currentLead, targetStageName);

        if (missingFields.length > 0) {
            // Trigger Ghost Drop bounce (don't update lead array here)
            // Open modal to resolve missing fields
            setGateModalState({
                isOpen: true,
                lead: currentLead,
                targetStageId,
                targetStageName,
                missingFields
            });
            return;
        }

        // --- Optimistic Update ---
        const originalLeads = [...leads];
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: targetStageId, updated_at: new Date().toISOString() } : l));

        // --- DB Update ---
        try {
            const { error } = await supabase.from('leads').update({
                stage_id: targetStageId,
                updated_at: new Date().toISOString()
            }).eq('id', leadId);

            if (error) throw error;

            toast.success('Deal movido correctamente');

            // Log Event (Audit)
            const stageName = stages.find(s => s.id === targetStageId)?.name || 'Unknown';
            await supabase.from('lead_events').insert({
                lead_id: leadId,
                event_type: 'pipeline.stage_changed',
                payload: { to: stageName, manual: true }
            });

        } catch (error) {
            const normalizedError = normalizeSupabaseError(error);
            console.error("Failed to move deal", {
                leadId,
                targetStageId,
                ...normalizedError,
            });

            const backendMissingFields = extractMissingFields(normalizedError);
            if (backendMissingFields.length > 0) {
                setGateModalState({
                    isOpen: true,
                    lead: currentLead,
                    targetStageId,
                    targetStageName,
                    missingFields: backendMissingFields
                });
                toast.warning('Faltan campos requeridos para mover el deal');
                setLeads(originalLeads); // Rollback before modal flow
                return;
            }

            if (hasMissingApiKey(normalizedError)) {
                toast.error('Configuracion invalida en staging: falta API key de Supabase en el deploy');
            } else {
                toast.error('Error al mover el deal');
            }
            setLeads(originalLeads); // Rollback
        }
    }

    const handleGateModalSubmit = async (updates: Partial<Lead>) => {
        const { lead, targetStageId } = gateModalState;
        if (!lead || !targetStageId) return;

        // Perform optimistic update merging new fields
        const originalLeads = [...leads];
        setLeads(prev => prev.map(l => l.id === lead.id ? {
            ...l,
            ...updates,
            stage_id: targetStageId,
            updated_at: new Date().toISOString()
        } : l));

        try {
            const { error } = await supabase.from('leads').update({
                ...updates,
                stage_id: targetStageId,
                updated_at: new Date().toISOString()
            }).eq('id', lead.id);

            if (error) throw error;
            toast.success('Deal validado y movido');

            // Log Event
            const stageName = stages.find(s => s.id === targetStageId)?.name || 'Unknown';
            await supabase.from('lead_events').insert({
                lead_id: lead.id,
                event_type: 'pipeline.stage_changed',
                payload: { to: stageName, manual: true, requirements_met: true }
            });

        } catch (error) {
            const normalizedError = normalizeSupabaseError(error);
            console.error("Failed to move deal after gates", {
                leadId: lead.id,
                targetStageId,
                ...normalizedError,
            });

            if (hasMissingApiKey(normalizedError)) {
                toast.error('Configuracion invalida en staging: falta API key de Supabase en el deploy');
            } else {
                toast.error('Error al mover el deal tras rellenar campos');
            }
            setLeads(originalLeads); // Rollback
        }
    };

    const handleAddNote = (lead: Lead) => {
        setSelectedLeadForNote(lead);
        setIsNoteModalOpen(true);
    };

    const handleNoteSaved = () => {
        // Optionally refresh or log, but not strictly needed for pipeline view unless we show note count
        // Just toast is fine
        toast.success('Nota guardada');
    };

    const getNoteContext = () => {
        if (!selectedLeadForNote) return undefined;
        const stage = stages.find(s => s.id === selectedLeadForNote.stage_id);
        if (stage && stage.name.toLowerCase().startsWith('contacto')) {
            return stage.name;
        }
        return undefined;
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Integrated Page Header */}
            <div className="flex-none px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-baseline justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Visualiza y gestiona el flujo de oportunidades
                        </p>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        {leads.length} deals activos
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-6 bg-slate-50">
                <div className="flex h-full min-w-max">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {stages.map((stage) => (
                            <KanbanColumn
                                key={stage.id}
                                stage={stage}
                                leads={leads.filter(l => l.stage_id === stage.id)}
                                onAddNote={handleAddNote}
                            />
                        ))}

                        <DragOverlay>
                            {activeId ? (
                                <div className="opacity-90 rotate-2 cursor-grabbing scale-105">
                                    {(() => {
                                        const l = leads.find(x => x.id === activeId);
                                        return l ? <DealCard lead={l} /> : null;
                                    })()}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            <NoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                leadId={selectedLeadForNote?.id || ''}
                onNoteSaved={handleNoteSaved}
                context={getNoteContext()}
            />

            {gateModalState.lead && (
                <StageGateModal
                    isOpen={gateModalState.isOpen}
                    onClose={() => setGateModalState(prev => ({ ...prev, isOpen: false }))}
                    lead={gateModalState.lead}
                    targetStageName={gateModalState.targetStageName}
                    missingFields={gateModalState.missingFields}
                    onSubmit={handleGateModalSubmit}
                />
            )}
        </div>
    );
}
