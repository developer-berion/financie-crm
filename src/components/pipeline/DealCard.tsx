import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, MessageCircle, FileText, Clock, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lead } from '../../types';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DealCardProps {
    lead: Lead;
    onAddNote?: (lead: Lead) => void;
}

export default function DealCard({ lead, onAddNote }: DealCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const value = lead.estimated_value || 0;
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

    // stagnation logic (10 days)
    const lastActivity = lead.updated_at ? new Date(lead.updated_at) : new Date();
    const isStagnant = (new Date().getTime() - lastActivity.getTime()) > (10 * 24 * 60 * 60 * 1000);

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `tel:${lead.phone}`;
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        const number = lead.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${number}`, '_blank');
    };

    const handleAddNote = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddNote?.(lead);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group relative p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md mb-2",
                isStagnant
                    ? "bg-red-50/50 border-red-300 ring-1 ring-red-300/20"
                    : "bg-white border-slate-200",
                isDragging ? "ring-2 ring-indigo-500 ring-offset-2 opacity-50 z-50" : ""
            )}
        >
            {/* Left Border Status Indicator */}
            <div className={cn(
                "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors",
                value > 5000 ? "bg-emerald-500" : isStagnant ? "bg-red-500" : "bg-transparent group-hover:bg-slate-300"
            )} />

            <div className="pl-2">
                {/* Header: Name + Value */}
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight truncate pr-2 max-w-[70%]">
                        {lead.full_name}
                    </h4>
                    <span className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded",
                        value > 0 ? "bg-emerald-50 text-emerald-700" : "text-slate-400 bg-slate-100"
                    )}>
                        {value > 0 ? formattedValue : '$ -'}
                    </span>
                </div>

                {/* Body: Context info */}
                <div className="text-xs text-slate-500 mb-2 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                        <span className="font-medium">Source:</span> {lead.source}
                    </div>
                </div>

                {/* Footer: Activity & Actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    {/* Signal */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(lastActivity, { addSuffix: true, locale: es })}</span>
                    </div>

                    {/* Actions (Revealed on Hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onAddNote && (
                            <button
                                onClick={handleAddNote}
                                onPointerDown={e => e.stopPropagation()}
                                className="p-1.5 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700"
                                title="Agregar Nota"
                            >
                                <StickyNote className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={handleCall}
                            onPointerDown={e => e.stopPropagation()}
                            className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            title="Llamar"
                        >
                            <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            onPointerDown={e => e.stopPropagation()}
                            className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                            title="WhatsApp"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <Link
                            to={`/leads/${lead.id}`}
                            onPointerDown={e => e.stopPropagation()}
                            className="p-1.5 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700"
                            title="Ver detalles"
                        >
                            <FileText className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
