import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';

interface Lead {
    id: string;
    full_name: string;
    phone: string;
    status: string;
    state: string;
    source: string;
    created_at: string;
    pipeline_stages: {
        name: string;
    } | { name: string }[] | null;
}

export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select(`
        id,
        full_name,
        phone,
        status,
        state,
        source,
        created_at,
        pipeline_stages (
          name
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }
        setLoading(false);
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
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etapa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-4 text-center">Cargando...</td></tr>
                        ) : filteredLeads.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No se encontraron leads.</td></tr>
                        ) : (
                            filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-blue-600 hover:text-blue-900">
                                            <Link to={`/leads/${lead.id}`}>{lead.full_name}</Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                            {lead.state || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {Array.isArray(lead.pipeline_stages)
                                            ? lead.pipeline_stages[0]?.name
                                            : lead.pipeline_stages?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{lead.source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:text-blue-900">Ver</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
