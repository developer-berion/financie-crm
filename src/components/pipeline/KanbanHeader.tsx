import type { Lead } from '../../types';
import { cn } from '../../lib/utils'; // Ensure cn is imported

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

    // Dynamic Color Logic based on Stage Name
    const getStageColor = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('contacto 1')) return {
            bg: 'bg-emerald-100',
            text: 'text-emerald-800',
            border: 'border-emerald-200',
            bar: 'bg-emerald-500',
            badge: 'bg-emerald-200 text-emerald-800'
        };
        if (lowerName.includes('contacto 2')) return {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            border: 'border-yellow-200',
            bar: 'bg-yellow-500',
            badge: 'bg-yellow-200 text-yellow-800'
        };
        if (lowerName.includes('contacto 3')) return {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-200',
            bar: 'bg-red-500',
            badge: 'bg-red-200 text-red-800'
        };
        // Default
        return {
            bg: 'bg-transparent',
            text: 'text-slate-800',
            border: 'border-transparent',
            bar: 'bg-indigo-500',
            badge: 'bg-slate-200 text-slate-600'
        };
    };

    const colors = getStageColor(stageName);

    return (
        <div className={cn(
            "mb-3 px-3 py-2 rounded-t-lg border-b-2 transition-colors",
            colors.bg,
            colors.border
        )}>
            <div className="flex items-center justify-between">
                <h3 className={cn("font-bold text-sm uppercase tracking-wide", colors.text)}>
                    {stageName}
                </h3>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", colors.badge)}>
                    {count}
                </span>
            </div>

            <div className="mt-2 flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500/80 uppercase tracking-wider">Total</span>
                <span className={cn("text-sm font-black tabular-nums", colors.text)}>{formattedValue}</span>
            </div>

            <div className="h-1.5 w-full bg-white/50 rounded-full mt-2 overflow-hidden">
                <div className={cn("h-full w-full opacity-80", colors.bar)} />
            </div>
        </div>
    );
}
