import { Calendar } from 'lucide-react';
import type { DashboardDateRange } from '../../lib/date-utils';

interface DateRangeFilterProps {
    value: DashboardDateRange;
    onChange: (value: DashboardDateRange) => void;
}

const options: { value: DashboardDateRange; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'this_week', label: 'Esta Semana' },
    { value: 'this_month', label: 'Este Mes' },
    { value: 'last_month', label: 'Mes Pasado' },
];

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
    return (
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-brand-border shadow-sm">
            <Calendar className="h-4 w-4 text-brand-text/40" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as DashboardDateRange)}
                className="text-sm font-medium text-brand-text bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                aria-label="Filtrar rango de fechas"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
