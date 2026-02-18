import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';
import { Search, Filter } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import LeadFilters from '../components/LeadFilters';
import LeadQuickAdd from '../components/LeadQuickAdd';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ stages: [] as string[] });

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                pipeline_stages (
                  name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            // @ts-ignore
            setLeads(data || []);
        }
    }

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm);

        const matchesStage = filters.stages.length === 0 ||
            (lead.pipeline_stages && filters.stages.includes(lead.pipeline_stages.name));

        return matchesSearch && matchesStage;
    });

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
            {/* Header Section: Breadcrumbs & Title */}
            <div>
                <div className="mb-6">
                    <Breadcrumbs />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Leads</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestión y seguimiento de oportunidades comerciales
                        </p>
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm ring-1 ring-gray-900/5">
                        {filteredLeads.length} leads encontrados
                    </div>
                </div>
            </div>

            {/* Quick Add Section */}
            <LeadQuickAdd onLeadAdded={fetchLeads} />

            {/* Content Card: Search, Filters, and Table */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden flex flex-col border border-gray-100/50">
                {/* Search & Filters Header */}
                <div className="p-6 border-b border-gray-50 bg-white flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full rounded-xl border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm leading-6 placeholder-gray-400 focus:bg-white focus:border-brand-primary/30 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all"
                            placeholder="Buscar por nombre, teléfono o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`h-[46px] inline-flex items-center rounded-xl border px-5 text-sm font-bold shadow-sm transition-all active:scale-95 ${isFilterOpen
                                    ? 'border-brand-primary text-brand-primary bg-blue-50/50 ring-4 ring-brand-primary/10'
                                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300'
                                }`}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                            {filters.stages.length > 0 && (
                                <span className="ml-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {filters.stages.length}
                                </span>
                            )}
                        </button>

                        <LeadFilters
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            currentFilters={filters}
                            onApplyFilters={setFilters}
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto">
                    <LeadTable leads={filteredLeads} title="" />
                </div>
            </div>
        </div>
    );
}
