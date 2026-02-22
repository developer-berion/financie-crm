import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { getStatusConfig } from '../../lib/constants';

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

interface PipelineFunnelProps {
    stages: StageCount[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

export default function PipelineFunnel({ stages, isLoading, isError, onRetry }: PipelineFunnelProps) {
    const totalLeads = stages.reduce((sum, s) => sum + s.current_leads, 0);
    const maxEntered = Math.max(...stages.map(s => s.entered_leads), 1);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 flex flex-col min-h-[380px] animate-pulse">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-64 bg-gray-100 rounded"></div>
                    </div>
                </div>
                <div className="flex-1 space-y-4 lg:space-y-5 mt-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                <div className="h-3 w-16 bg-gray-100 rounded"></div>
                            </div>
                            <div className="h-8 bg-gray-100 rounded-lg w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col min-h-[380px] items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Error al cargar datos</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-[250px]">No pudimos obtener la información del funnel. Por favor intenta de nuevo.</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-brand-primary/30 hover:bg-gray-50 text-brand-primary text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-bold text-brand-primary">Pipeline & Leakage</h2>
                    <p className="text-xs text-brand-text/50 mt-0.5">Análisis de conversión y cuellos de botella</p>
                </div>
                <Link
                    to="/pipeline"
                    className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand-primary/30"
                >
                    Ver Kanban →
                </Link>
            </div>

            <div className="flex-1 space-y-4 lg:space-y-5">
                {stages.map((stage, index) => {
                    const barWidth = Math.max((stage.entered_leads / maxEntered) * 100, 2);

                    return (
                        <div key={stage.id} className="relative group">
                            <Link to={`/leads?stage_id=${stage.id}`} className="block">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-brand-primary">{stage.name}</span>
                                        {stage.is_red_flag && (
                                            <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-600 rounded">
                                                Cuello de botella
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-brand-text/60">
                                        <span className="font-bold text-brand-text/80">{stage.current_leads}</span> actuales
                                        <span className="mx-1 text-gray-300">|</span>
                                        <span>{stage.entered_leads} históricos</span>
                                    </span>
                                </div>

                                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative flex items-center group-hover:bg-gray-200 transition-colors">
                                    <div
                                        className={cn(
                                            'h-full rounded-lg transition-all duration-500 ease-out flex items-center pr-3 justify-end relative',
                                            stage.is_red_flag ? 'bg-red-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]' : (getStatusConfig(stage.name).bar || 'bg-brand-primary')
                                        )}
                                        style={{ width: `${barWidth}%` }}
                                        role="progressbar"
                                        aria-valuenow={stage.entered_leads}
                                        aria-valuemax={maxEntered}
                                    >
                                        {stage.entered_leads > 0 && barWidth > 15 && (
                                            <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
                                                {barWidth === 100 ? '100% Volumen' : `${Math.round(barWidth)}%`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tooltip Overlay Layer */}
                                    <div className="absolute inset-x-0 inset-y-0 flex items-center pl-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {index > 0 ? (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded shadow-sm text-gray-800 bg-white/90 border border-gray-200">
                                                Conversión: {stage.conversion_rate}% (Drop-off: <span className={stage.dropoff_rate > 30 ? 'text-red-600' : 'text-orange-500'}>{stage.dropoff_rate}%</span>)
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded shadow-sm text-gray-800 bg-white/90 border border-gray-200">
                                                Etapa de Entrada
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 p-3 rounded-lg">
                <span className="text-xs font-medium text-brand-text/60">
                    Total: <span className="font-bold text-brand-primary">{totalLeads}</span> leads activos en pipeline
                </span>
                <span className="text-[10px] text-brand-text/40">
                    * El ancho de barra repesenta leads históricos
                </span>
            </div>
        </div>
    );
}
