import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Lead } from '../types';

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Nuevo': return 'bg-blue-100 text-blue-700';
            case 'Cerrado ganado': return 'bg-green-100 text-green-700';
            case 'No interesado': case 'Cerrado perdido': return 'bg-red-100 text-red-700';
            case 'Cita agendada': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-[#ffffff] rounded-[2rem] shadow-xl border border-[#d9d9d9] overflow-hidden">
            <div className="px-8 py-6 border-b border-[#d9d9d9] flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-[#414042]">{title}</h2>
                <button className="text-sm font-semibold text-[#f6c71e] hover:text-[#e5b810] flex items-center gap-1 transition-colors">
                    Ver todo <ExternalLink className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-[#d9d9d9]">
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider w-16">#</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Lead</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Email</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Teléfono</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Origen</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Estado</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Fecha</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Estado/Región</th>
                            <th className="px-8 py-4 text-xs font-bold text-[#414042]/60 uppercase tracking-wider">Términos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9d9d9]">
                        {currentLeads.map((lead, index) => (
                            <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-8 py-5 text-sm font-medium text-[#414042]/40">
                                    {startIndex + index + 1}
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-sm font-bold text-[#414042] group-hover:text-black transition-colors">
                                        {lead.full_name}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-sm text-[#414042] font-medium">
                                    {lead.email || '-'}
                                </td>
                                <td className="px-8 py-5 text-sm text-[#414042] font-medium">
                                    {lead.phone}
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-[#414042]/70 border border-[#d9d9d9]">
                                        {lead.source}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={cn(
                                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm",
                                        getStatusColor(lead.status)
                                    )}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-sm text-[#414042]/70 font-medium">
                                    {new Date(lead.created_at).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="px-8 py-5 text-sm text-[#414042]/70 font-medium">
                                    {lead.state || '-'}
                                </td>
                                <td className="px-8 py-5 text-sm text-[#414042]/70 font-medium">
                                    {lead.terms_accepted ? '✅' : '❌'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-8 py-6 border-t border-[#d9d9d9] flex justify-between items-center bg-gray-50/50">
                <span className="text-sm text-[#414042]/60 font-medium">
                    Mostrando <span className="text-[#414042] font-bold">{startIndex + 1}</span> a <span className="text-[#414042] font-bold">{Math.min(startIndex + itemsPerPage, leads.length)}</span> de <span className="text-[#414042] font-bold">{leads.length}</span> entradas
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-[#d9d9d9] hover:bg-white transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft className="w-5 h-5 text-[#414042]" />
                    </button>

                    <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Simple pagination logic to show max 5 pages
                            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                                            currentPage === pageNum
                                                ? "bg-[#f6c71e] text-[#0f171a] shadow-lg shadow-[#f6c71e]/30"
                                                : "hover:bg-white text-[#414042]/60 hover:text-[#414042]"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }
                            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                return <span key={pageNum} className="flex items-end px-1 pb-2">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-[#d9d9d9] hover:bg-white transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5 text-[#414042]" />
                    </button>
                </div>
            </div>
        </div>
    );
}
