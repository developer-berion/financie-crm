import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Phone, Calendar, BarChart3 } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import type { Lead } from '../types';

export default function Dashboard() {
    const [stats, setStats] = useState({
        newLeadsToday: 0,
        callsPending: 0,
        appointmentsToday: 0,
        totalLeads: 0
    });
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayIso = today.toISOString();

            // New Leads Today
            const { count: leadsToday } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayIso);

            // Pending Calls
            const { count: callsPending } = await supabase
                .from('call_schedules')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            // Appointments Today
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { count: apptsToday } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .gte('start_time', todayIso)
                .lt('start_time', tomorrow.toISOString());

            // Total Leads
            const { count: totalLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            // Latest Leads for the table (limited to 50 for the report)
            const { data: latestLeads } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setLeads(latestLeads || []);
            setStats({
                newLeadsToday: leadsToday || 0,
                callsPending: callsPending || 0,
                appointmentsToday: apptsToday || 0,
                totalLeads: totalLeads || 0
            });
            setLoading(false);
        }

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f6c71e] border-t-transparent"></div>
                <p className="font-bold text-[#414042] animate-pulse">Analizando métricas...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#0f171a]">Dashboard</h1>
                    <p className="text-sm text-[#414042]/60 mt-1">Resumen general de tu operativa</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#d9d9d9] hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">+12%</span>
                    </div>
                    <dt className="text-sm font-semibold text-[#414042]/50">Leads Nuevos (Hoy)</dt>
                    <dd className="text-3xl font-bold text-[#0f171a] mt-1">{stats.newLeadsToday}</dd>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#d9d9d9] hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-orange-50 group-hover:bg-orange-100 transition-colors">
                            <Phone className="h-6 w-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">8 hoy</span>
                    </div>
                    <dt className="text-sm font-semibold text-[#414042]/50">Llamadas Pendientes</dt>
                    <dd className="text-3xl font-bold text-[#0f171a] mt-1">{stats.callsPending}</dd>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#d9d9d9] hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">Próxima: 2pm</span>
                    </div>
                    <dt className="text-sm font-semibold text-[#414042]/50">Citas (Hoy)</dt>
                    <dd className="text-3xl font-bold text-[#0f171a] mt-1">{stats.appointmentsToday}</dd>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-[#d9d9d9] hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-[#f6c71e]/10 group-hover:bg-[#f6c71e]/20 transition-colors">
                            <BarChart3 className="h-6 w-6 text-[#f6c71e]" />
                        </div>
                    </div>
                    <dt className="text-sm font-semibold text-[#414042]/50">Total Leads</dt>
                    <dd className="text-3xl font-bold text-[#0f171a] mt-1">{stats.totalLeads}</dd>
                </div>
            </div>

            <div className="mt-8">
                <LeadTable leads={leads} />
            </div>
        </div>
    );
}
