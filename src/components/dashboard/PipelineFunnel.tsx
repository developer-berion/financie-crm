import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface StageCount {
    id: string;
    name: string;
    count: number;
    sort_order: number;
}

interface PipelineFunnelProps {
    stages: StageCount[];
}

const stageColors: Record<string, string> = {
    'lead nuevo': 'bg-blue-500',
    'contacto 1': 'bg-emerald-500',
    'contacto 2': 'bg-yellow-500',
    'contacto 3': 'bg-red-500',
    'llamada en curso': 'bg-indigo-500',
    'contactado': 'bg-violet-500',
    'calificando': 'bg-violet-500',
    'cita agendada': 'bg-amber-500',
    'cita completada': 'bg-orange-500',
    'propuesta': 'bg-cyan-600',
    'cerrado ganado': 'bg-emerald-500',
    'cerrado perdido': 'bg-gray-400',
};

function getBarColor(stageName: string): string {
    const lower = stageName.toLowerCase();
    for (const [key, color] of Object.entries(stageColors)) {
        if (lower.includes(key)) return color;
    }
    return 'bg-blue-500';
}

export default function PipelineFunnel({ stages }: PipelineFunnelProps) {
    const totalLeads = stages.reduce((sum, s) => sum + s.count, 0);
    const maxCount = Math.max(...stages.map(s => s.count), 1);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-bold text-brand-primary">Pipeline</h2>
                    <p className="text-xs text-brand-text/50 mt-0.5">Distribución de leads por etapa</p>
                </div>
                <Link
                    to="/pipeline"
                    className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand-primary/30"
                >
                    Ver Kanban →
                </Link>
            </div>

            <div className="space-y-2.5">
                {stages.map((stage) => {
                    const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
                    const barWidth = Math.max((stage.count / maxCount) * 100, 2);

                    return (
                        <div key={stage.id} className="group flex items-center gap-3">
                            <span className="text-[11px] font-medium text-brand-text/70 w-40 truncate text-right shrink-0" title={stage.name}>
                                {stage.name}
                            </span>
                            <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                                <div
                                    className={cn(
                                        'h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2',
                                        getBarColor(stage.name)
                                    )}
                                    style={{ width: `${barWidth}%` }}
                                    role="progressbar"
                                    aria-valuenow={stage.count}
                                    aria-valuemax={totalLeads}
                                    aria-label={`${stage.name}: ${stage.count} leads`}
                                >
                                    {stage.count > 0 && barWidth > 15 && (
                                        <span className="text-[10px] font-bold text-white/90">
                                            {stage.count}
                                        </span>
                                    )}
                                </div>
                                {(stage.count === 0 || barWidth <= 15) && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">
                                        {stage.count}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-semibold text-brand-text/40 w-10 text-right shrink-0">
                                {pct}%
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-medium text-brand-text/50">
                    Total: <span className="font-bold text-brand-primary">{totalLeads}</span> leads en pipeline
                </span>
            </div>
        </div>
    );
}
