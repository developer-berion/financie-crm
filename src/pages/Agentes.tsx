import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Mail, Phone, Calendar, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react';
import SyncCalendlyButton from '../components/SyncCalendlyButton';
import { cn } from '../lib/utils';

interface Agent {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    created_at: string;
    calendly_events?: unknown[];
}

export default function Agentes() {
    const [agentes, setAgentes] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<'name' | 'events' | 'created_at' | null>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const fetchAgentes = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('agentes')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setAgentes(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchAgentes();

        const subscription = supabase
            .channel('agentes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => {
                fetchAgentes();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const filteredAgentes = agentes.filter(agent =>
        agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone_number?.includes(searchTerm)
    );

    // Sort function
    const sortedAgentes = useMemo(() => {
        if (!sortColumn) return filteredAgentes;

        return [...filteredAgentes].sort((a, b) => {
            const getVal = (agent: Agent, col: string) => {
                if (col === 'name') return agent.full_name?.toLowerCase() || '';
                if (col === 'events') return agent.calendly_events?.length || 0;
                if (col === 'created_at') return new Date(agent.created_at).getTime();
                return 0;
            };

            const aVal = getVal(a, sortColumn!);
            const bVal = getVal(b, sortColumn!);

            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });
    }, [filteredAgentes, sortColumn, sortDirection]);

    // Handle column sort click
    const handleSort = (column: 'name' | 'events' | 'created_at') => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get badge style for Calendly events
    const getEventsBadgeStyle = (count: number) => {
        if (count === 0) return 'text-gray-300 text-xs';
        if (count === 1) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (count === 2) return 'bg-green-100 text-green-700 border-green-200';
        return 'bg-emerald-500 text-white border-emerald-600'; // 3+
    };

    return (
        <div className="space-y-6">
            {/* Integrated Page Header */}
            <div className="border-b border-gray-200 pb-5">
                <div className="flex items-baseline justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Agentes Postulantes</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestión de entrevistas y agenda
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-500">
                            {agentes.length} agentes registrados
                        </div>
                        <SyncCalendlyButton />
                    </div>
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
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-brand-border overflow-hidden">
                <div className="overflow-visible min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                {/* Sortable: Name */}
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className={cn(
                                            "flex items-center gap-2 transition-colors group",
                                            sortColumn === 'name' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
                                        )}
                                    >
                                        <span>Nombre</span>
                                        <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                                    </button>
                                </th>

                                {/* Non-sortable: Contact */}
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contacto</th>

                                {/* Sortable: Calendly Events */}
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('events')}
                                        className={cn(
                                            "flex items-center gap-2 transition-colors group",
                                            sortColumn === 'events' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
                                        )}
                                    >
                                        <span>Eventos Calendly</span>
                                        <SortIcon column="events" sortColumn={sortColumn} sortDirection={sortDirection} />
                                    </button>
                                </th>

                                {/* Sortable: Registration Date */}
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('created_at')}
                                        className={cn(
                                            "flex items-center gap-2 transition-colors group",
                                            sortColumn === 'created_at' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
                                        )}
                                    >
                                        <span>Fecha Registro</span>
                                        <SortIcon column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} />
                                    </button>
                                </th>

                                {/* Actions */}
                                <th className="px-6 py-4 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
                            ) : sortedAgentes.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron agentes.</td></tr>
                            ) : (
                                sortedAgentes.map((agent) => (
                                    <tr key={agent.id} className="group hover:bg-white hover:shadow-lg transition-all">
                                        {/* Name with Avatar */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 shadow-sm shrink-0">
                                                    {agent.full_name?.charAt(0)}
                                                </div>
                                                <Link
                                                    to={`/agentes/${agent.id}`}
                                                    className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors"
                                                >
                                                    {agent.full_name}
                                                </Link>
                                            </div>
                                        </td>

                                        {/* Contact Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate max-w-[200px]">{agent.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {agent.phone_number}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Calendly Events with Tiered Styling */}
                                        <td className="px-6 py-4">
                                            {agent.calendly_events && agent.calendly_events.length > 0 ? (
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm",
                                                    getEventsBadgeStyle(agent.calendly_events.length)
                                                )}>
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {agent.calendly_events.length} {agent.calendly_events.length === 1 ? 'Evento' : 'Eventos'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Registration Date */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {format(new Date(agent.created_at), 'dd/MM/yyyy')}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {format(new Date(agent.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Action Button */}
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/agentes/${agent.id}`}
                                                className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg shadow-sm hover:text-brand-primary hover:border-brand-primary transition-colors inline-flex items-center justify-center"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Helper Component for Sorting Icons
function SortIcon({ column, sortColumn, sortDirection }: {
    column: 'name' | 'events' | 'created_at',
    sortColumn: 'name' | 'events' | 'created_at' | null,
    sortDirection: 'asc' | 'desc'
}) {
    if (sortColumn !== column) {
        return <ChevronsUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    return sortDirection === 'asc'
        ? <ChevronUp className="w-4 h-4" />
        : <ChevronDown className="w-4 h-4" />;
}
