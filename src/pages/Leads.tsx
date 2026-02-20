import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';
import { Search, Filter } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import LeadFilters from '../components/LeadFilters';
import LeadQuickAdd from '../components/LeadQuickAdd';
import Breadcrumbs from '../components/Breadcrumbs';
import LeadQuickFilters, { type QuickFilterType } from '../components/LeadQuickFilters';
import { getDashboardDateRange, type DashboardDateRange } from '../lib/date-utils';

export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ stages: [] as string[] });
    const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Handle drill-down filters from dashboard
        const status = searchParams.get('status');
        const createdAt = searchParams.get('created_at');

        if (status === 'new') {
            setQuickFilter('new');
        }

        fetchLeads(createdAt);
    }, [searchParams]);

    async function fetchLeads(dateRange?: string | null) {
        let query = supabase
            .from('leads')
            .select(`
                *,
                pipeline_stages (
                  name
                )
            `);

        if (dateRange && dateRange !== 'all') {
            try {
                const { start, end } = getDashboardDateRange(dateRange as DashboardDateRange);
                query = query
                    .gte('created_at', start)
                    .lte('created_at', end);
            } catch (e) {
                console.error('Invalid date range:', dateRange);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            // @ts-ignore
            setLeads(data || []);
        }
    }

    const filteredLeads = leads.filter(lead => {
        // 1. Search Filter
        const matchesSearch = lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm);

        // 2. Modal Filter (Stages)
        const matchesStage = filters.stages.length === 0 ||
            // @ts-ignore
            (lead.pipeline_stages && filters.stages.includes(lead.pipeline_stages.name));

        // 3. Quick Filters Logic
        let matchesQuickFilter = true;

        // Helper to get stage name safely
        const stageName = (Array.isArray(lead.pipeline_stages)
            ? lead.pipeline_stages[0]?.name
            : (lead.pipeline_stages as any)?.name)?.toLowerCase() || '';

        if (quickFilter === 'new') {
            matchesQuickFilter = stageName.includes('nuevo') ||
                stageName.includes('new') ||
                lead.status === 'new';
        } else if (quickFilter === 'unread') {
            // Proxy logic: New OR (Contact Attempts = 0 or undefined)
            const isNew = stageName.includes('nuevo') || lead.status === 'new';
            const hasNoContact = lead.contact_attempts === 0 || lead.contact_attempts === undefined;
            matchesQuickFilter = isNew || hasNoContact;
        } else if (quickFilter === 'high_value') {
            matchesQuickFilter = (lead.estimated_value || 0) > 5000;
        }

        return matchesSearch && matchesStage && matchesQuickFilter;
    });

    // Calculate counts for badges
    const getCount = (type: QuickFilterType) => {
        if (type === 'all') return leads.length;
        return leads.filter(lead => {
            const stageName = (Array.isArray(lead.pipeline_stages)
                ? lead.pipeline_stages[0]?.name
                : (lead.pipeline_stages as any)?.name)?.toLowerCase() || '';

            if (type === 'new') {
                return stageName.includes('nuevo') || stageName.includes('new') || lead.status === 'new';
            }
            if (type === 'unread') {
                const isNew = stageName.includes('nuevo') || lead.status === 'new';
                const hasNoContact = lead.contact_attempts === 0 || lead.contact_attempts === undefined;
                return isNew || hasNoContact;
            }
            if (type === 'high_value') {
                return (lead.estimated_value || 0) > 5000;
            }
            return false;
        }).length;
    };

    const counts = {
        all: getCount('all'),
        new: getCount('new'),
        unread: getCount('unread'),
        high_value: getCount('high_value')
    };

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

                {/* Quick Filters Bar */}
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                    <LeadQuickFilters
                        activeFilter={quickFilter}
                        onFilterChange={setQuickFilter}
                        counts={counts}
                    />
                </div>

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
