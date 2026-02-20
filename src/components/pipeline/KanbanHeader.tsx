import { cn } from '../../lib/utils';
import type { Lead } from '../../types';
import { getStatusConfig } from '../../lib/constants';
import { Lock } from 'lucide-react';
import { STAGE_GATES } from '../../lib/stage-gates';

interface KanbanHeaderProps {
    stageName: string;
    leads: Lead[];
}

export default function KanbanHeader({ stageName, leads }: KanbanHeaderProps) {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const count = leads.length;

    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalValue);

    const config = getStatusConfig(stageName);

    return (
        <div className={cn(
            "mb-3 px-3 py-2 rounded-t-lg border-b-2 transition-colors",
            config.bg,
            config.border
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <h3 className={cn("font-bold text-sm uppercase tracking-wide", config.color)}>
                        {stageName}
                    </h3>
                    {STAGE_GATES[stageName] && (
                        <div title={STAGE_GATES[stageName].explanation} className={cn("cursor-help", config.color)}>
                            <Lock className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", config.bg, config.color)}>
                    {count}
                </span>
            </div>

            <div className="mt-2 flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500/80 uppercase tracking-wider">Total</span>
                <span className={cn("text-sm font-black tabular-nums", config.color)}>{formattedValue}</span>
            </div>

            <div className="h-1.5 w-full bg-white/50 rounded-full mt-2 overflow-hidden">
                <div className={cn("h-full w-full opacity-80", config.bar)} />
            </div>
        </div>
    );
}
