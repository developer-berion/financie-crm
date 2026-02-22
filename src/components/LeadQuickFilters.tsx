import type { ComponentType } from 'react';
import { Sparkles, Bell, Banknote, List } from 'lucide-react';
import { cn } from '../lib/utils';

export type QuickFilterType = 'all' | 'new' | 'unread' | 'high_value';

interface LeadQuickFiltersProps {
    activeFilter: QuickFilterType;
    onFilterChange: (filter: QuickFilterType) => void;
    counts?: Record<QuickFilterType, number>;
}

export default function LeadQuickFilters({ activeFilter, onFilterChange, counts }: LeadQuickFiltersProps) {
    const filters: { id: QuickFilterType; label: string; icon: ComponentType<{ className?: string }> }[] = [
        { id: 'all', label: 'Todos', icon: List },
        { id: 'new', label: 'Nuevos', icon: Sparkles },
        { id: 'unread', label: 'Sin Leer', icon: Bell },
        { id: 'high_value', label: 'Alto Valor', icon: Banknote },
    ];

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => {
                const isActive = activeFilter === filter.id;
                const Icon = filter.icon;

                return (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                            isActive
                                ? "bg-brand-primary text-white border-brand-primary shadow-sm ring-2 ring-brand-primary/20"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-gray-400")} />
                        <span>{filter.label}</span>
                        {counts && counts[filter.id] > 0 && (
                            <span className={cn(
                                "ml-1 px-1.5 py-0.5 rounded-full text-[9px]",
                                isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-500"
                            )}>
                                {counts[filter.id]}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
