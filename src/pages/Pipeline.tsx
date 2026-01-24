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
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';

// Types
interface Stage {
    id: string;
    name: string;
    sort_order: number;
}
interface LeadCard {
    id: string;
    full_name: string;
    phone: string;
    stage_id: string;
}

// Sortable Item Component (Card)
function KanbanCard({ lead }: { lead: LeadCard }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab hover:shadow-md mb-2"
        >
            <div className="font-medium text-gray-900">{lead.full_name}</div>
            <div className="text-xs text-gray-500 mt-1">{lead.phone}</div>
            <div className="mt-2 text-right">
                <Link to={`/leads/${lead.id}`} className="text-xs text-blue-600 hover:text-blue-800 pointer-events-auto z-10 relative">
                    Ver detalles
                </Link>
            </div>
        </div>
    );
}

// Column Component
function KanbanColumn({ stage, leads }: { stage: Stage; leads: LeadCard[] }) {
    const { setNodeRef } = useDroppable({ id: stage.id });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-2 mr-4 flex flex-col h-full max-h-full">
            <h3 className="font-semibold text-gray-700 mb-3 px-2 flex justify-between">
                <span>{stage.name}</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{leads.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto min-h-[100px]">
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map((lead) => (
                        <KanbanCard key={lead.id} lead={lead} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export default function Pipeline() {
    const [stages, setStages] = useState<Stage[]>([]);
    const [leads, setLeads] = useState<LeadCard[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const { data: stagesData } = await supabase.from('pipeline_stages').select('*').order('sort_order');
        const { data: leadsData } = await supabase.from('leads').select('id, full_name, phone, stage_id');

        if (stagesData) setStages(stagesData);
        if (leadsData) setLeads(leadsData);
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const leadId = active.id as string;
        // Dropped locally on a column (droppable) or another item (sortable)
        // dnd-kit logic: if over.id is a stage, we move there. If over.id is a card, we move to that card's stage.

        let targetStageId = over.id as string;

        // Check if over.id is a card
        const overLead = leads.find(l => l.id === over.id);
        if (overLead) {
            targetStageId = overLead.stage_id;
        }

        // Is it a stage?
        if (!stages.find(s => s.id === targetStageId) && !overLead) {
            // Unknown drop target
            return;
        }

        const currentLead = leads.find(l => l.id === leadId);
        if (!currentLead) return;

        if (currentLead.stage_id !== targetStageId) {
            // Optimistic Update
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: targetStageId } : l));

            // DB Update
            const { error } = await supabase.from('leads').update({
                stage_id: targetStageId,
                updated_at: new Date().toISOString()
            }).eq('id', leadId);

            // Log Event
            if (!error) {
                const stageName = stages.find(s => s.id === targetStageId)?.name || 'Unknown';
                await supabase.from('lead_events').insert({
                    lead_id: leadId,
                    event_type: 'pipeline.stage_changed',
                    payload: { to: stageName, manual: true }
                });
            } else {
                // Revert? For MVP, just reload or ignore.
                console.error("Failed to move", error);
            }
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex overflow-x-auto pb-4">
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
                    />
                ))}

                <DragOverlay>
                    {activeId ? (
                        <div className="bg-white p-3 rounded shadow-lg border border-blue-200 opacity-90 rotate-3 cursor-grabbing">
                            {(() => {
                                const l = leads.find(x => x.id === activeId);
                                return (
                                    <>
                                        <div className="font-medium text-gray-900">{l?.full_name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{l?.phone}</div>
                                    </>
                                )
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
