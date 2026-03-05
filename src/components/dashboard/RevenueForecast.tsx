import { useState, useMemo, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import { Settings2, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ForecastStage {
    stage_id: string;
    stage_name: string;
    sort_order: number;
    probability_pct: number;
    total_value: number;
    weighted_value: number;
}

interface RevenueForecastProps {
    stages: ForecastStage[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: {
            fullValue: number;
            weightedValue: number;
            probability: number;
        };
    }>;
    label?: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg z-[100]">
                <p className="font-semibold text-brand-primary mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                        Valor Total: <span className="font-medium text-gray-900">{formatCurrency(payload[0].payload.fullValue)}</span>
                    </p>
                    <p className="text-sm text-brand-secondary">
                        Forecast (Ponderado): <span className="font-bold">{formatCurrency(payload[0].payload.weightedValue)}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-50">
                        Probabilidad aplicada: {payload[0].payload.probability}%
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

export default function RevenueForecast({ stages, isLoading, isError, onRetry }: RevenueForecastProps) {
    const [simulatorMode, setSimulatorMode] = useState(false);

    // Initial load of quota from localStorage, default to 150000
    const [monthlyQuota, setMonthlyQuota] = useState(() => {
        const saved = localStorage.getItem('financie_monthly_quota');
        return saved ? parseInt(saved, 10) : 150000;
    });

    // Save quota to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('financie_monthly_quota', monthlyQuota.toString());
    }, [monthlyQuota]);

    // In simulator mode, users can tweak the probability to see impact
    const [simulatedProbs, setSimulatedProbs] = useState<Record<string, number>>({});

    const handleProbChange = (stageId: string, value: number) => {
        setSimulatedProbs(prev => ({
            ...prev,
            [stageId]: value
        }));
    };

    // Prepare chart data
    const chartData = useMemo(() => {
        return stages.map(stage => {
            const currentProb = simulatorMode
                ? (simulatedProbs[stage.stage_id] ?? stage.probability_pct)
                : stage.probability_pct;

            const simulatedWeightedValue = (stage.total_value * currentProb) / 100;

            return {
                name: stage.stage_name,
                fullValue: stage.total_value,
                weightedValue: simulatedWeightedValue,
                probability: currentProb,
                stage_id: stage.stage_id,
            };
        });
    }, [stages, simulatorMode, simulatedProbs]);

    const totalPipelineValue = stages.reduce((sum, s) => sum + s.total_value, 0);
    const totalWeightedValue = chartData.reduce((sum, d) => sum + d.weightedValue, 0);

    // Mock Quota & Revenue Heat Logic
    const quotaProgress = totalWeightedValue > 0 ? (totalWeightedValue / monthlyQuota) * 100 : 0;

    let heatColorClass = "text-rose-600"; // Deep Ember
    let progressBgClass = "bg-rose-500";
    if (quotaProgress >= 100) {
        heatColorClass = "text-emerald-500"; // Emerald
        progressBgClass = "bg-emerald-500";
    } else if (quotaProgress >= 70) {
        heatColorClass = "text-emerald-400"; // Light Emerald
        progressBgClass = "bg-emerald-400";
    } else if (quotaProgress >= 40) {
        heatColorClass = "text-amber-500"; // Amber
        progressBgClass = "bg-amber-500";
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 flex flex-col h-full animate-pulse min-h-[380px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
                </div>
                <div className="flex items-end justify-between gap-4 mb-2 mt-4">
                    <div className="h-10 w-40 bg-gray-200 rounded"></div>
                    <div className="h-8 w-32 bg-gray-100 rounded"></div>
                </div>
                <div className="flex-1 mt-6 w-full flex items-end gap-2 px-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex-1 bg-gray-100 rounded-t-sm" style={{ height: `${20 + i * 12}%` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col h-full min-h-[380px] items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Error al cargar datos</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-[250px]">No pudimos obtener la proyección de ingresos. Por favor intenta de nuevo.</p>
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
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">Proyección de Ingresos</h2>
                        <div className="group relative flex items-center">
                            <Info className="w-4 h-4 text-gray-400 hover:text-brand-primary cursor-help transition-colors" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                <p className="font-semibold mb-1 text-gray-100">Forecast Ponderado</p>
                                <p className="text-gray-300 leading-relaxed">
                                    Calcula los ingresos esperados multiplicando el valor total en cada etapa por su probabilidad histórica de cierre. Permite proyectar ingresos realistas en lugar del monto bruto utópico.
                                </p>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-brand-text/50 mt-0.5">Pipeline Valorizado vs Probabilidad</p>
                </div>
                <button
                    onClick={() => setSimulatorMode(!simulatorMode)}
                    className={`p-2 rounded-lg transition-colors border ${simulatorMode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-brand-primary'}`}
                    title="Simulador What-If"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
            </div>

            {totalPipelineValue === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-xl mt-4">
                    <p className="text-sm font-medium text-gray-900">No hay deals proyectados en este periodo.</p>
                    <Link to="/pipeline" className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
                        Ver Pipeline y ajustar fechas <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            ) : (
                <>
                    <div className="flex items-end justify-between gap-4 mb-2">
                        <div className="flex items-baseline gap-3">
                            <div className={`text-3xl font-extrabold ${heatColorClass} drop-shadow-sm transition-colors`}>
                                {formatCurrency(totalWeightedValue)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-400 line-through">
                                    {formatCurrency(totalPipelineValue)}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Esperado</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="text-xs text-gray-500 font-medium">Meta Mensual: {formatCurrency(monthlyQuota)}</div>
                            <div className="flex items-center gap-2 mt-1 w-32">
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${progressBgClass} transition-all duration-700 ease-out`}
                                        style={{ width: `${Math.min(quotaProgress, 100)}%` }}
                                    ></div>
                                </div>
                                <span className={`text-[10px] font-bold ${heatColorClass}`}>
                                    {quotaProgress.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[250px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                                barGap={2}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#6b7280' }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                    width={45}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', opacity: 0.1 }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                                <ReferenceLine y={monthlyQuota} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta', fill: '#f43f5e', fontSize: 10 }} />
                                <Bar
                                    dataKey="fullValue"
                                    name="Valor Total Etapa"
                                    fill="#e5e7eb"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                                <Bar
                                    dataKey="weightedValue"
                                    name="Forecast Ponderado"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* What-If Simulator Panel */}
            {simulatorMode && (
                <div className="mt-4 pt-4 border-t border-indigo-100 bg-indigo-50/30 rounded-lg p-4 animate-in slide-in-from-top-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Configuración y Simulador</h3>
                        </div>

                        {/* Quota Setting */}
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                            <label htmlFor="quota-input" className="text-xs font-semibold text-gray-600">Meta Mensual:</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input
                                    id="quota-input"
                                    type="number"
                                    value={monthlyQuota}
                                    onChange={(e) => setMonthlyQuota(Number(e.target.value))}
                                    className="w-24 pl-5 pr-2 py-1 text-xs font-bold text-indigo-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-300 rounded"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 border-t border-indigo-100/50">
                        {chartData.map((stage) => (
                            <div key={stage.stage_id} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] items-center">
                                    <span className="font-semibold text-gray-700 truncate w-24" title={stage.name}>{stage.name}</span>
                                    <span className="font-bold text-indigo-600 w-8 text-right bg-white px-1 py-0.5 rounded shadow-sm border border-indigo-100">{stage.probability}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={stage.probability}
                                    onChange={(e) => handleProbChange(stage.stage_id, parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[10px] text-indigo-600 font-medium">
                        <span>Los cambios aquí no afectan la base de datos</span>
                        <button
                            onClick={() => {
                                const resetProbs: Record<string, number> = {};
                                stages.forEach(s => resetProbs[s.stage_id] = s.probability_pct);
                                setSimulatedProbs(resetProbs);
                            }}
                            className="hover:underline"
                        >
                            Restaurar Valores
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
