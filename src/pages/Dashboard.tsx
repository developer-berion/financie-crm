import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, Calendar, ListTodo, Zap } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

import StatCard from '../components/dashboard/StatCard';
import PipelineFunnel from '../components/dashboard/PipelineFunnel';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import UpcomingAppointments from '../components/dashboard/UpcomingAppointments';
import AgentsSummary from '../components/dashboard/AgentsSummary';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import MyDayWidget from '../components/dashboard/MyDayWidget';
import RevenueForecast from '../components/dashboard/RevenueForecast';
import type { ForecastStage } from '../components/dashboard/RevenueForecast';
import AgentLeaderboard from '../components/dashboard/AgentLeaderboard';
import type { AgentPerformance } from '../components/dashboard/AgentLeaderboard';
import { getDashboardDateRange, type DashboardDateRange } from '../lib/date-utils';

interface StageCount {
    id: string;
    name: string;
    sort_order: number;
    current_leads: number;
    entered_leads: number;
    conversion_rate: number;
    dropoff_rate: number;
    is_red_flag?: boolean;
}

/**
 * Dashboard principal que centraliza las métricas de RevOps del CRM.
 * 
 * Implementa una arquitectura de carga en paralelo usando Promise.all para 
 * minimizar el tiempo de bloqueo (LCP) y mejorar lo percibido por el usuario.
 */
export default function Dashboard() {
    // Métricas principales (KPIs)
    const [totalLeads, setTotalLeads] = useState(0); // Universo total de leads
    const [leadsToday, setLeadsToday] = useState(0); // Leads captados hoy (Meta Ads)
    const [appointmentsToday, setAppointmentsToday] = useState(0); // Citas agendadas para hoy (Calendly)
    const [pendingTasks, setPendingTasks] = useState(0); // Tareas de seguimiento pendientes
    const [pendingJobs, setPendingJobs] = useState(0); // Tareas automáticas (llamadas AI) procesándose

    // State for MyDayWidget
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [myDayTasks, setMyDayTasks] = useState<any[]>([]);

    // Global Date Filter
    const [dateRange, setDateRange] = useState<DashboardDateRange>('this_month');

    // Next appointment time badge
    const [nextApptTime, setNextApptTime] = useState<string | null>(null);

    // Pipeline and Forecast
    const [pipelineStages, setPipelineStages] = useState<StageCount[]>([]);
    const [pipelineLoading, setPipelineLoading] = useState(true);
    const [pipelineError, setPipelineError] = useState(false);

    const [forecastStages, setForecastStages] = useState<ForecastStage[]>([]);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [forecastError, setForecastError] = useState(false);

    const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardError, setLeaderboardError] = useState(false);

    // Activity Feed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activityEvents, setActivityEvents] = useState<any[]>([]);

    // Upcoming Appointments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

    // Agents Summary
    const [totalAgents, setTotalAgents] = useState(0);
    const [agentsWithInterview, setAgentsWithInterview] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData(dateRange);
    }, [dateRange]);

    const fetchPipelineData = async () => {
        const { start, end } = getDashboardDateRange(dateRange);
        setPipelineLoading(true);
        setPipelineError(false);
        try {
            const { data: leakageData, error: leakageError } = await supabase
                .rpc('get_pipeline_leakage', {
                    p_start_date: start,
                    p_end_date: end,
                    p_source: null
                });

            let processedStages: any[] = [];

            if (!leakageError && leakageData && leakageData.length > 0) {
                processedStages = leakageData.map((s: any) => ({
                    id: s.stage_id,
                    name: s.stage_name,
                    sort_order: s.sort_order,
                    current_leads: s.current_leads,
                    entered_leads: s.entered_leads || s.current_leads,
                }));
            } else {
                const { data: stagesData } = await supabase.from('pipeline_stages').select('*').order('sort_order');
                const { data: leadsWithStage } = await supabase.from('leads').select('stage_id').gte('created_at', start).lte('created_at', end);

                const countMap: Record<string, number> = {};
                (leadsWithStage || []).forEach((l) => countMap[l.stage_id] = (countMap[l.stage_id] || 0) + 1);

                if (stagesData) {
                    processedStages = stagesData.map((s) => ({
                        id: s.id,
                        name: s.name,
                        sort_order: s.sort_order,
                        current_leads: countMap[s.id] || 0,
                        entered_leads: countMap[s.id] || 0,
                    }));
                }
            }

            let minCR = 100;
            let redFlagStageId: string | null = null;
            let previousEntered = processedStages[0]?.entered_leads || 0;

            const enrichedStages = processedStages.map((stage, index) => {
                let conversion_rate = 100;
                let dropoff_rate = 0;

                const adjustedEntered = index === 0 ? stage.entered_leads : Math.min(stage.entered_leads, previousEntered);
                previousEntered = adjustedEntered;

                if (index > 0 && processedStages[index - 1].entered_leads > 0) {
                    conversion_rate = Math.round((adjustedEntered / processedStages[index - 1].entered_leads) * 100);
                    dropoff_rate = 100 - conversion_rate;

                    if (conversion_rate < minCR && adjustedEntered > 0) {
                        minCR = conversion_rate;
                        redFlagStageId = stage.id;
                    }
                }

                return {
                    ...stage,
                    entered_leads: adjustedEntered,
                    conversion_rate,
                    dropoff_rate
                };
            });

            setPipelineStages(enrichedStages.map((s) => ({
                ...s,
                is_red_flag: s.id === redFlagStageId && s.dropoff_rate > 30
            })));
        } catch (error) {
            console.error('Pipeline fetch error:', error);
            setPipelineError(true);
        } finally {
            setPipelineLoading(false);
        }
    };

    const fetchForecastData = async () => {
        const { start, end } = getDashboardDateRange(dateRange);
        setForecastLoading(true);
        setForecastError(false);
        try {
            const { data: forecastData, error } = await supabase
                .rpc('get_revenue_forecast', {
                    p_start_date: start,
                    p_end_date: end
                });
            if (error) throw error;
            if (forecastData) setForecastStages(forecastData);
        } catch (error) {
            console.error('Forecast fetch error:', error);
            setForecastError(true);
        } finally {
            setForecastLoading(false);
        }
    };

    const fetchLeaderboardData = async () => {
        const { start, end } = getDashboardDateRange(dateRange);
        setLeaderboardLoading(true);
        setLeaderboardError(false);
        try {
            const { data: leaderData, error } = await supabase
                .rpc('get_agent_leaderboard', {
                    p_start_date: start,
                    p_end_date: end
                });
            if (error) throw error;
            if (leaderData) setAgentPerformance(leaderData);
        } catch (error) {
            console.error('Leaderboard fetch error:', error);
            setLeaderboardError(true);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    async function fetchDashboardData(range: DashboardDateRange) {
        const { start, end } = getDashboardDateRange(range);

        // Specific dates for "My Day" (strictly today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        setLoading(true);

        try {
            // ─── Trigger Independent Intelligence Fetches ──────────
            fetchPipelineData();
            fetchForecastData();
            fetchLeaderboardData();

            // ─── KPI Queries (parallel) ────────────────────────
            const [
                totalLeadsRes,
                leadsTodayRes,
                apptsTodayRes,
                tasksRes,
                jobsRes,
            ] = await Promise.all([
                // Total leads (filtered by date)
                supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', start)
                    .lte('created_at', end),
                // Leads in specific range (same as total if filter is active, but keeping PM logic)
                supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', start)
                    .lte('created_at', end),
                // Appointments today
                supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .gte('start_time', todayStart.toISOString())
                    .lte('start_time', todayEnd.toISOString())
                    .eq('status', 'scheduled'),
                // Pending tasks (Global, doesn't respect date filter as per PM decision)
                supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .neq('status', 'completed'),
                // Pending jobs
                supabase
                    .from('jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'PENDING'),
            ]);

            setTotalLeads(totalLeadsRes.count || 0);
            setLeadsToday(leadsTodayRes.count || 0);
            setAppointmentsToday(apptsTodayRes.count || 0);
            setPendingTasks(tasksRes.count || 0);
            setPendingJobs(jobsRes.count || 0);

            // ─── Activity Feed (last 8 events) ────────────────
            const { data: eventsData } = await supabase
                .from('lead_events')
                .select('id, lead_id, event_type, payload, created_at')
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: false })
                .limit(8);

            if (eventsData && eventsData.length > 0) {
                // Get lead names for the events
                const leadIds = [...new Set(eventsData.filter(e => e.lead_id).map(e => e.lead_id))];
                const { data: leadsNames } = await supabase
                    .from('leads')
                    .select('id, full_name')
                    .in('id', leadIds);

                const nameMap: Record<string, string> = {};
                (leadsNames || []).forEach((l) => {
                    nameMap[l.id] = l.full_name || 'Lead';
                });

                const enrichedEvents = eventsData.map((e) => ({
                    ...e,
                    lead_name: e.lead_id ? nameMap[e.lead_id] || 'Lead' : undefined,
                }));
                setActivityEvents(enrichedEvents);
            }

            // ─── My Day Tasks (Today + Overdue) ───────────────
            const { data: myTasksData } = await supabase
                .from('tasks')
                .select('id, lead_id, title, due_at, status')
                .neq('status', 'completed')
                .lte('due_at', todayEnd.toISOString())
                .order('due_at', { ascending: true });

            if (myTasksData && myTasksData.length > 0) {
                const taskLeadIds = [...new Set(myTasksData.filter(t => t.lead_id).map(t => t.lead_id))];
                const { data: taskLeadNames } = await supabase
                    .from('leads')
                    .select('id, full_name')
                    .in('id', taskLeadIds);

                const taskNameMap: Record<string, string> = {};
                (taskLeadNames || []).forEach((l) => { taskNameMap[l.id] = l.full_name || 'Lead'; });

                const enrichedMyTasks = myTasksData.map((t) => ({
                    ...t,
                    lead_name: t.lead_id ? taskNameMap[t.lead_id] || 'Lead' : undefined,
                }));
                setMyDayTasks(enrichedMyTasks);
            } else {
                setMyDayTasks([]);
            }

            // ─── Upcoming Appointments ─────────────────────────
            const { data: upcomingData } = await supabase
                .from('appointments')
                .select('id, lead_id, start_time, status, meeting_url')
                .gte('start_time', new Date().toISOString())
                .eq('status', 'scheduled')
                .order('start_time', { ascending: true })
                .limit(5);

            if (upcomingData && upcomingData.length > 0) {
                const apptLeadIds = [...new Set(upcomingData.filter(a => a.lead_id).map(a => a.lead_id))];
                const { data: apptLeadNames } = await supabase
                    .from('leads')
                    .select('id, full_name')
                    .in('id', apptLeadIds);

                const apptNameMap: Record<string, string> = {};
                (apptLeadNames || []).forEach((l) => {
                    apptNameMap[l.id] = l.full_name || 'Lead';
                });

                const enrichedAppts = upcomingData.map((a) => ({
                    ...a,
                    lead_name: a.lead_id ? apptNameMap[a.lead_id] || 'Lead' : undefined,
                }));
                setUpcomingAppointments(enrichedAppts);

                // Set next appointment time badge
                if (upcomingData[0]) {
                    const nextTime = format(new Date(upcomingData[0].start_time), 'h:mm a', { locale: es });
                    setNextApptTime(`Próxima: ${nextTime}`);
                }
            }

            // ─── Agents Summary ────────────────────────────────
            const { data: agentsData } = await supabase
                .from('agentes')
                .select('id, calendly_events');

            if (agentsData) {
                setTotalAgents(agentsData.length);
                const withEvents = agentsData.filter(
                    (a) => a.calendly_events && Array.isArray(a.calendly_events) && a.calendly_events.length > 0
                );
                setAgentsWithInterview(withEvents.length);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    }

    // ─── Loading State (Skeletons) ─────────────────────────
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header skeleton */}
                <div>
                    <div className="h-8 w-40 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
                </div>

                {/* KPI skeletons */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-brand-border">
                            <div className="h-10 w-10 bg-gray-100 rounded-xl mb-3" />
                            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                            <div className="h-7 w-16 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>

                {/* Independent components will manage their own skeletons */}
            </div>
        );
    }

    // ─── Today's date formatted ────────────────────────────
    const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ─── Header ───────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-brand-primary">Dashboard</h1>
                    <p className="text-sm text-brand-text/60 mt-1 capitalize">{todayFormatted}</p>
                </div>
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>

            {/* ─── KPI Cards (5) ────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    title="Total Leads"
                    value={totalLeads}
                    icon={Users}
                    color="primary"
                    to="/leads"
                />
                <StatCard
                    title="Leads Nuevos"
                    value={leadsToday}
                    icon={UserPlus}
                    color="emerald"
                    to={`/leads?status=new&created_at=${dateRange}`}
                    badge={leadsToday > 0 ? 'En el periodo' : undefined}
                />
                <StatCard
                    title="Citas (Hoy)"
                    value={appointmentsToday}
                    icon={Calendar}
                    color="secondary"
                    to="/calendar"
                    badge={nextApptTime || undefined}
                />
                <StatCard
                    title="Tareas Pendientes"
                    value={pendingTasks}
                    icon={ListTodo}
                    color="amber"
                    to="/tasks?status=pending"
                />
                <StatCard
                    title="Jobs en Cola"
                    value={pendingJobs}
                    icon={Zap}
                    color="blue"
                />
            </div>

            {/* ─── Intelligence Charts ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PipelineFunnel
                    stages={pipelineStages}
                    isLoading={pipelineLoading}
                    isError={pipelineError}
                    onRetry={fetchPipelineData}
                />
                <RevenueForecast
                    stages={forecastStages}
                    isLoading={forecastLoading}
                    isError={forecastError}
                    onRetry={fetchForecastData}
                />
            </div>

            {/* ─── My Day + activity ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MyDayWidget
                        tasks={myDayTasks}
                        appointments={upcomingAppointments.filter(a => isToday(new Date(a.start_time)))}
                        onTaskUpdate={() => fetchDashboardData(dateRange)}
                    />
                </div>
                <div className="lg:col-span-1">
                    <ActivityFeed events={activityEvents} />
                </div>
            </div>

            {/* ─── Upcoming Appointments & Agents ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UpcomingAppointments appointments={upcomingAppointments} />
                <AgentLeaderboard
                    agents={agentPerformance}
                    isLoading={leaderboardLoading}
                    isError={leaderboardError}
                    onRetry={fetchLeaderboardData}
                />
            </div>

            {/* ─── Agents Summary ───────────────────────────── */}
            <AgentsSummary
                totalAgents={totalAgents}
                agentsWithInterview={agentsWithInterview}
            />
        </div>
    );
}
