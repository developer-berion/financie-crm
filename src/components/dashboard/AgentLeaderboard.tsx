import { useState } from 'react';
import { Trophy, TrendingUp, Clock, Medal, Info } from 'lucide-react';

export interface AgentPerformance {
    agent_id: string;
    agent_name: string;
    total_leads: number;
    won_deals: number;
    efficiency_score: number;
    total_revenue: number;
    avg_days_to_close: number;
}

interface AgentLeaderboardProps {
    agents: AgentPerformance[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

type SortMetric = 'efficiency' | 'revenue' | 'speed';

export default function AgentLeaderboard({ agents, isLoading, isError, onRetry }: AgentLeaderboardProps) {
    const [sortBy, setSortBy] = useState<SortMetric>('efficiency');

    // Inline currency formatter
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const sortedAgents = [...agents].sort((a, b) => {
        if (sortBy === 'efficiency') return b.efficiency_score - a.efficiency_score;
        if (sortBy === 'revenue') return b.total_revenue - a.total_revenue;
        // For speed, lower is better (faster) but we need to put 0s at the end
        if (sortBy === 'speed') {
            const valA = a.avg_days_to_close === 0 ? 9999 : a.avg_days_to_close;
            const valB = b.avg_days_to_close === 0 ? 9999 : b.avg_days_to_close;
            return valA - valB;
        }
        return 0;
    });

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'text-yellow-400 bg-yellow-50 border-yellow-200'; // Gold
            case 1: return 'text-slate-400 bg-slate-50 border-slate-200'; // Silver
            case 2: return 'text-amber-600 bg-amber-50 border-amber-200'; // Bronze
            default: return 'text-transparent bg-transparent border-transparent';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-brand-primary">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Rendimiento de Agentes</h2>
                        <p className="text-xs text-brand-text/50">Ranking de mejores cerradores</p>
                    </div>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
                    <button
                        onClick={() => setSortBy('efficiency')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'efficiency' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Eficiencia
                    </button>
                    <button
                        onClick={() => setSortBy('revenue')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'revenue' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Ingresos
                    </button>
                    <button
                        onClick={() => setSortBy('speed')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'speed' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Velocidad
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 p-4 space-y-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                                <div className="h-2 w-20 bg-gray-100 rounded"></div>
                            </div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[250px]">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Error al cargar datos</h3>
                    <p className="text-xs text-gray-500 mb-4 max-w-[250px]">No pudimos obtener el ranking de agentes. Por favor intenta de nuevo.</p>
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-white border border-gray-200 hover:border-brand-primary/30 hover:bg-gray-50 text-brand-primary text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        Reintentar
                    </button>
                </div>
            ) : agents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <Trophy className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-900">Sin agentes con datos</p>
                    <p className="text-xs text-gray-500 mt-1">Asigna leads a agentes externos para ver su ranking.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                <th className="px-4 py-3 font-semibold">Rango & Agente</th>
                                <th className="px-4 py-3 font-semibold text-right">
                                    <div className="flex items-center justify-end gap-1 group relative">
                                        <span>Tasa Cierre</span>
                                        <Info className="w-3 h-3 text-gray-300 hover:text-brand-primary cursor-help" />
                                        <div className="absolute right-[-10px] top-full mt-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none normal-case tracking-normal font-normal text-left">
                                            (Deals ganados / Total de Leads) * 100. Mide la eficiencia de conversión.
                                            <div className="absolute right-4 bottom-full border-4 border-transparent border-b-gray-900"></div>
                                        </div>
                                    </div>
                                </th>
                                <th className="px-4 py-3 font-semibold text-right">
                                    <div className="flex items-center justify-end gap-1 group relative">
                                        <span>Ingresos</span>
                                        <Info className="w-3 h-3 text-gray-300 hover:text-brand-primary cursor-help" />
                                        <div className="absolute right-[-10px] top-full mt-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none normal-case tracking-normal font-normal text-left">
                                            Valor total de todos los tratos marcados como 'Ganado' por este agente.
                                            <div className="absolute right-4 bottom-full border-4 border-transparent border-b-gray-900"></div>
                                        </div>
                                    </div>
                                </th>
                                <th className="px-4 py-3 font-semibold text-right hidden sm:table-cell">
                                    <div className="flex items-center justify-end gap-1 group relative">
                                        <span>Vel. Promedio</span>
                                        <Info className="w-3 h-3 text-gray-300 hover:text-brand-primary cursor-help" />
                                        <div className="absolute right-[-10px] top-full mt-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none normal-case tracking-normal font-normal text-left">
                                            Promedio de días en cerrar un trato, desde su creación hasta 'Ganado'. Mientras menos, mejor.
                                            <div className="absolute right-4 bottom-full border-4 border-transparent border-b-gray-900"></div>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sortedAgents.map((agent, index) => {
                                const medalClasses = getMedalColor(index);
                                const isPodium = index < 3;

                                return (
                                    <tr
                                        key={agent.agent_id}
                                        className={`group hover:bg-gray-50 transition-colors ${isPodium ? 'bg-white rounded-lg' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${medalClasses}`}>
                                                    {isPodium ? <Medal className="w-3.5 h-3.5" /> : (index + 1)}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-semibold text-gray-900 ${isPodium ? '' : 'font-medium'}`}>
                                                        {agent.agent_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {agent.won_deals} ganados / {agent.total_leads} leads
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className={`text-sm font-bold ${sortBy === 'efficiency' ? 'text-brand-primary' : 'text-gray-700'}`}>
                                                    {agent.efficiency_score}%
                                                </span>
                                                {agent.efficiency_score > 0 && <TrendingUp className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-sm font-semibold">
                                                <span className={sortBy === 'revenue' ? 'text-emerald-600' : 'text-gray-700'}>
                                                    {formatCurrency(agent.total_revenue)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                                            <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className={sortBy === 'speed' ? 'font-bold text-gray-900' : ''}>
                                                    {agent.avg_days_to_close > 0 ? `${agent.avg_days_to_close}d` : '-'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
