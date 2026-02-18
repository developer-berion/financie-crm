import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Phone, MessageCircle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { Lead } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadTableProps {
    leads: Lead[];
    title?: string;
}

export default function LeadTable({ leads, title }: LeadTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<'name' | 'stage' | 'created_at' | null>('created_at');
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

    const handleSort = (column: 'name' | 'stage' | 'created_at') => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const getRowBorderColor = (stageName: string = '') => {
        const lower = stageName.toLowerCase();
        if (lower.includes('contacto 1')) return 'border-l-4 border-emerald-500';
        if (lower.includes('contacto 2')) return 'border-l-4 border-yellow-400';
        if (lower.includes('contacto 3')) return 'border-l-4 border-red-500';
        if (lower.includes('ganado')) return 'border-l-4 border-green-600';
        if (lower.includes('perdido')) return 'border-l-4 border-gray-300 opacity-70';
        return 'border-l-4 border-indigo-500';
    };

    const getStageBadgeStyle = (stageName: string = '') => {
        const lower = stageName.toLowerCase();
        if (lower.includes('contacto 1')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (lower.includes('contacto 2')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        if (lower.includes('contacto 3')) return 'bg-red-50 text-red-700 border-red-200';
        if (lower.includes('ganado')) return 'bg-green-50 text-green-700 border-green-200';
        if (lower.includes('perdido')) return 'bg-gray-50 text-gray-600 border-gray-200';
        return 'bg-blue-50 text-blue-700 border-blue-200';
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
                                    <span>Fecha de Creación</span>
                                    <SortIcon column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} />
                                </button>
                            </th>
                            <th className="px-6 py-4 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentLeads.map((lead) => {
                            const stageName = getStageName(lead) || 'Nuevo';

                            return (
                                <tr
                                    key={lead.id}
                                    className={cn(
                                        "h-[75px] group hover:bg-gray-50/50 transition-all relative",
                                        getRowBorderColor(stageName)
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
                                            getStageBadgeStyle(stageName)
                                        )}>
                                            {stageName}
                                        </span>
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
                                            <span className="text-[10px] font-medium text-gray-400 uppercase">
                                                {format(new Date(lead.created_at), 'HH:mm', { locale: es })}
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
    column: 'name' | 'stage' | 'created_at',
    sortColumn: 'name' | 'stage' | 'created_at' | null,
    sortDirection: 'asc' | 'desc'
}) {
    if (sortColumn !== column) {
        return <ChevronsUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc'
        ? <ChevronUp className="w-3 h-3" />
        : <ChevronDown className="w-3 h-3" />;
}
