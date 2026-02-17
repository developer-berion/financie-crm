import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: 'primary' | 'emerald' | 'secondary' | 'amber' | 'blue';
    badge?: string;
}

const colorMap = {
    primary: {
        iconBg: 'bg-brand-primary/10 group-hover:bg-brand-primary/20',
        iconColor: 'text-brand-primary',
        valueColor: 'text-brand-primary',
    },
    emerald: {
        iconBg: 'bg-emerald-100 group-hover:bg-emerald-200',
        iconColor: 'text-emerald-600',
        valueColor: 'text-emerald-700',
    },
    secondary: {
        iconBg: 'bg-brand-secondary/10 group-hover:bg-brand-secondary/20',
        iconColor: 'text-brand-secondary',
        valueColor: 'text-brand-primary',
    },
    amber: {
        iconBg: 'bg-amber-100 group-hover:bg-amber-200',
        iconColor: 'text-amber-600',
        valueColor: 'text-amber-700',
    },
    blue: {
        iconBg: 'bg-blue-100 group-hover:bg-blue-200',
        iconColor: 'text-blue-600',
        valueColor: 'text-blue-700',
    },
};

export default function StatCard({ title, value, icon: Icon, color, badge }: StatCardProps) {
    const colors = colorMap[color];

    return (
        <div
            className="bg-white p-5 rounded-2xl shadow-sm border border-brand-border hover:shadow-md transition-all group"
            role="group"
            aria-label={`${title}: ${value}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl transition-colors', colors.iconBg)}>
                    <Icon className={cn('h-5 w-5', colors.iconColor)} />
                </div>
                {badge && (
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-xs font-medium text-brand-text/60 mb-1">{title}</p>
            <p className={cn('text-2xl font-bold', colors.valueColor)}>{value}</p>
        </div>
    );
}
