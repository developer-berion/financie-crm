import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';
import { Search, Filter } from 'lucide-react';
import LeadTable from '../components/LeadTable';



export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        const { data, error } = await supabase
            .from('leads')
            .select(`
        id,
        full_name,
        phone,
        email,
        status,
        state,
        source,
        created_at,
        estimated_value,
        currency,
        stage_id,
        call_status,
        pipeline_stages (
          name
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            // @ts-ignore - Supabase types are tricky with joins
            setLeads(data || []);
        }
    }

    const filteredLeads = leads.filter(lead =>
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                <div className="mt-4 sm:mt-0 flex space-x-2">
                    {/* Placeholder for Add Lead or export */}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                    <Filter className="mr-2 h-4 w-4 text-gray-500" />
                    Filtros
                </button>
            </div>

            {/* Table */}
            <LeadTable leads={filteredLeads} title="Gestión de Leads" />
        </div>
    );
}
