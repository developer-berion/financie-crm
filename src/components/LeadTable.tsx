import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Phone, MessageCircle, ChevronUp, ChevronDown, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { Lead } from '../types';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusConfig } from '../lib/constants';

interface LeadTableProps {
    leads: Lead[];
    title?: string;
}

export default function LeadTable({ leads }: LeadTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<'name' | 'stage' | 'created_at' | 'last_interaction'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const itemsPerPage = 7;

    const getStageName = (lead: Lead) => {
        return Array.isArray(lead.pipeline_stages)
            ? lead.pipeline_stages[0]?.name || ''
            : lead.pipeline_stages?.name || '';
    };

    const sortedLeads = useMemo(() => {
        if (!sortColumn) return leads;

        return [...leads].sort((a, b) => {
            const getVal = (lead: Lead, col: string) => {
                if (col === 'name') return lead.full_name.toLowerCase();
                if (col === 'stage') return getStageName(lead).toLowerCase();
                if (col === 'created_at') return new Date(lead.created_at).getTime();
                if (col === 'last_interaction') return new Date(lead.last_interaction_at || lead.created_at).getTime();
                return 0;
            };

            const aVal = getVal(a, sortColumn);
            const bVal = getVal(b, sortColumn);

            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });
    }, [leads, sortColumn, sortDirection]);

    const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLeads = sortedLeads.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (column: 'name' | 'stage' | 'created_at' | 'last_interaction') => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <button
                                    onClick={() => handleSort('name')}
                                    className={cn(
                                        "flex items-center gap-2 transition-colors group",
                                        sortColumn === 'name' ? 'text-brand-primary' : 'hover:text-gray-600'
                                    )}
                                >
                                    <span>Lead / Fuente</span>
                                    <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                                </button>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <button
                                    onClick={() => handleSort('stage')}
                                    className={cn(
                                        "flex items-center gap-2 transition-colors group",
                                        sortColumn === 'stage' ? 'text-brand-primary' : 'hover:text-gray-600'
                                    )}
                                >
                                    <span>Etapa / Estatus</span>
                                    <SortIcon column="stage" sortColumn={sortColumn} sortDirection={sortDirection} />
                                </button>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-[140px]">
                                <button
                                    onClick={() => handleSort('last_interaction')}
                                    className={cn(
                                        "flex items-center gap-2 transition-colors group",
                                        sortColumn === 'last_interaction' ? 'text-brand-primary' : 'hover:text-gray-600'
                                    )}
                                >
                                    <span>Últ. Interacción</span>
                                    <SortIcon column="last_interaction" sortColumn={sortColumn} sortDirection={sortDirection} />
                                </button>
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contacto Directo</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <button
                                    onClick={() => handleSort('created_at')}
                                    className={cn(
                                        "flex items-center gap-2 transition-colors group",
                                        sortColumn === 'created_at' ? 'text-brand-primary' : 'hover:text-gray-600'
                                    )}
                                >
                                    <span>Creado</span>
                                    <SortIcon column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} />
                                </button>
                            </th>
                            <th className="px-6 py-4 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentLeads.map((lead) => {
                            const stageName = getStageName(lead) || 'Nuevo';
                            const statusConfig = getStatusConfig(stageName);
                            // Use the specific text color for the strong left border (e.g. text-blue-700 -> border-blue-700)
                            const strongBorderColor = statusConfig.color.replace('text-', 'border-');

                            // Last Interaction Logic
                            const lastInteractionDate = lead.last_interaction_at ? new Date(lead.last_interaction_at) : null;
                            const hoursSince = lastInteractionDate ? differenceInHours(new Date(), lastInteractionDate) : 0;
                            const isNeglected = (hoursSince > 48 && stageName.toLowerCase() !== 'ganado' && stageName.toLowerCase() !== 'perdido');

                            return (
                                <tr
                                    key={lead.id}
                                    className={cn(
                                        "h-[75px] group hover:bg-gray-50/50 transition-all relative border-l-4",
                                        strongBorderColor
                                    )}
                                >
                                    <td className="px-6 py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary font-bold border border-brand-primary/10 shrink-0">
                                                {lead.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <Link
                                                    to={`/leads/${lead.id}`}
                                                    className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors block leading-tight"
                                                >
                                                    {lead.full_name}
                                                </Link>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1 inline-block">
                                                    {lead.source}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2">
                                        <span className={cn(
                                            "inline-flex px-3 py-1 rounded-lg text-[11px] font-bold border truncate max-w-[150px]",
                                            statusConfig.bg,
                                            statusConfig.color,
                                            statusConfig.border
                                        )}>
                                            {stageName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-2">
                                        {lastInteractionDate ? (
                                            <div className="flex items-center gap-2" title={`Hace ${hoursSince} horas`}>
                                                <div className={cn(
                                                    "flex items-center gap-1.5 text-xs font-medium",
                                                    isNeglected ? "text-red-600" : "text-gray-600"
                                                )}>
                                                    {isNeglected && <AlertCircle className="w-3.5 h-3.5" />}
                                                    <span>{formatDistanceToNow(lastInteractionDate, { locale: es, addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Sin actividad</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-2">
                                        <div className="flex flex-col">
                                            <a
                                                href={`tel:${lead.phone}`}
                                                className="text-sm font-bold text-gray-700 hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                            >
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                {lead.phone}
                                            </a>
                                            <span className="text-[11px] text-gray-400 truncate max-w-[150px]">
                                                {lead.email || ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">
                                                {format(new Date(lead.created_at), 'dd MMM, yyyy', { locale: es })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <a
                                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-all transform hover:scale-105"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </a>
                                            <Link
                                                to={`/leads/${lead.id}`}
                                                className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-brand-primary hover:text-white transition-all transform hover:scale-105"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Container (Internal to Table layout) */}
            <div className="px-8 py-5 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Página {currentPage} de {totalPages || 1}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 ml-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SortIcon({ column, sortColumn, sortDirection }: {
    column: 'name' | 'stage' | 'created_at' | 'last_interaction',
    sortColumn: 'name' | 'stage' | 'created_at' | 'last_interaction' | null,
    sortDirection: 'asc' | 'desc'
}) {
    if (sortColumn !== column) {
        return <ChevronsUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc'
        ? <ChevronUp className="w-3 h-3" />
        : <ChevronDown className="w-3 h-3" />;
}
