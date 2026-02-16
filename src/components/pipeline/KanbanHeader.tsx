import type { Lead } from '../../types';

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

    return (
        <div className="mb-3 px-2">
            <h3 className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">{stageName}</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {count}
                </span>
            </h3>
            <div className="mt-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total: </span>
                <span className="text-sm font-bold text-emerald-600 tabular-nums">{formattedValue}</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}
