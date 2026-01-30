import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Mail, Phone, Calendar } from 'lucide-react';
import SyncCalendlyButton from '../components/SyncCalendlyButton';

export default function Agentes() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [agentes, setAgentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agentes Postulantes</h1>
                    <p className="text-sm text-gray-500">Gestión de entrevistas y agenda</p>
                </div>
                <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                    <SyncCalendlyButton />
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

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eventos Calendly</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
                        ) : filteredAgentes.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron agentes.</td></tr>
                        ) : (
                            filteredAgentes.map((agent) => (
                                <tr key={agent.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-blue-600 hover:text-blue-900">
                                            <Link to={`/agentes/${agent.id}`}>{agent.full_name}</Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="w-3 h-3" /> {agent.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="w-3 h-3" /> {agent.phone_number}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {agent.calendly_events && agent.calendly_events.length > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {agent.calendly_events.length} Eventos
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(agent.created_at), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/agentes/${agent.id}`} className="text-blue-600 hover:text-blue-900">Ver</Link>
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
