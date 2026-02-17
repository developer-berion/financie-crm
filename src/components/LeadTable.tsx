import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { Lead } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadTableProps {
    leads: Lead[];
    title?: string;
}

export default function LeadTable({ leads, title = 'Reporte de Leads' }: LeadTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const totalPages = Math.ceil(leads.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLeads = leads.slice(startIndex, startIndex + itemsPerPage);

    const getRowBorderColor = (stageName: string = '') => {
        const lower = stageName.toLowerCase();
        if (lower.includes('contacto 1')) return 'border-l-4 border-emerald-500 bg-emerald-50/10';
        if (lower.includes('contacto 2')) return 'border-l-4 border-yellow-400 bg-yellow-50/10';
        if (lower.includes('contacto 3')) return 'border-l-4 border-red-500 bg-red-50/10';
        if (lower.includes('ganado')) return 'border-l-4 border-green-600';
        if (lower.includes('perdido')) return 'border-l-4 border-gray-300 opacity-70';
        return 'border-l-4 border-indigo-500'; // Default
    };

    const getStageBadgeStyle = (stageName: string = '') => {
        const lower = stageName.toLowerCase();
        if (lower.includes('contacto 1')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (lower.includes('contacto 2')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (lower.includes('contacto 3')) return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-brand-border overflow-visible">
            <div className="px-8 py-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/50 rounded-t-[2rem]">
                <div>
                    <h2 className="text-xl font-bold text-brand-primary">{title}</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, leads.length)} de {leads.length} leads
                    </p>
                </div>
                <button className="text-sm font-semibold text-brand-accent hover:text-yellow-600 flex items-center gap-1 transition-colors">
                    Ver todo <ExternalLink className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-visible min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lead / Fuente</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Etapa / Estatus</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contacto Directo</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actividad</th>
                            <th className="px-6 py-4 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentLeads.map((lead) => {
                            const stageName = Array.isArray(lead.pipeline_stages)
                                ? lead.pipeline_stages[0]?.name
                                : lead.pipeline_stages?.name || 'Nuevo';

                            return (
                                <tr
                                    key={lead.id}
                                    className={cn(
                                        "group hover:bg-white transition-all hover:shadow-lg hover:z-10 relative duration-200",
                                        getRowBorderColor(stageName)
                                    )}
                                >
                                    {/* Lead Info */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200 shadow-sm shrink-0">
                                                {lead.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <Link
                                                    to={`/leads/${lead.id}`}
                                                    className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors block leading-tight"
                                                >
                                                    {lead.full_name}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-500 capitalize">
                                                        {lead.source}
                                                    </span>
                                                    {/* Optional ID or tiny info */}
                                                    {/* <span className="text-[10px] text-gray-300">#{lead.id.slice(0,4)}</span> */}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Stage / Status */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1.5">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-sm truncate max-w-[140px]",
                                                getStageBadgeStyle(stageName)
                                            )}>
                                                {stageName}
                                            </span>
                                            {/* We could calculate days in stage if we had that data, using created_at for now as proxy */}
                                            {/* <span className="text-[10px] font-medium text-gray-400 pl-1">
                                                En etapa hace 2d
                                            </span> */}
                                        </div>
                                    </td>

                                    {/* Value */}
                                    <td className="px-6 py-4">
                                        {lead.estimated_value ? (
                                            <div className="font-mono font-bold text-gray-700 bg-gray-50 inline-block px-2 py-1 rounded border border-gray-200">
                                                ${lead.estimated_value.toLocaleString()}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-xs">-</span>
                                        )}
                                    </td>

                                    {/* Contact */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <a
                                                href={`tel:${lead.phone}`}
                                                className="text-sm font-semibold text-gray-700 hover:text-brand-primary flex items-center gap-1.5 transition-colors"
                                            >
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                {lead.phone}
                                            </a>
                                            {lead.email && (
                                                <span className="text-xs text-gray-400 truncate max-w-[150px]" title={lead.email}>
                                                    {lead.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Activity */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-600">
                                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
                                            </span>
                                            <span className="text-[10px] text-gray-400">Creado</span>
                                        </div>
                                    </td>

                                    {/* Hover Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <a
                                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 bg-[#25D366] text-white rounded-lg shadow-sm hover:scale-110 transition-transform"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </a>
                                            <Link
                                                to={`/leads/${lead.id}`}
                                                className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg shadow-sm hover:text-brand-primary hover:border-brand-primary transition-colors"
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

            {/* Pagination */}
            <div className="px-8 py-4 border-t border-brand-border flex justify-end items-center gap-2 bg-gray-50/50 rounded-b-[2rem]">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-30"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex gap-1 text-sm font-medium text-gray-600">
                    <span className="bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm">{currentPage}</span>
                    <span className="flex items-center text-gray-400">/</span>
                    <span className="px-2 py-1">{totalPages}</span>
                </div>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all disabled:opacity-30"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        </div>
    );
}
