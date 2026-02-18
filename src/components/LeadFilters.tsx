import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LeadFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: { stages: string[] };
    onApplyFilters: (filters: { stages: string[] }) => void;
}

export default function LeadFilters({ isOpen, onClose, currentFilters, onApplyFilters }: LeadFiltersProps) {
    const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
    const [selectedStages, setSelectedStages] = useState<string[]>(currentFilters.stages);
    const [expandedSection, setExpandedSection] = useState<string | null>('status');

    useEffect(() => {
        async function fetchStages() {
            const { data } = await supabase.from('pipeline_stages').select('id, name').order('position');
            if (data) setStages(data);
        }
        fetchStages();
    }, []);

    useEffect(() => {
        setSelectedStages(currentFilters.stages);
    }, [currentFilters]);

    const toggleStage = (stageName: string) => {
        setSelectedStages(prev =>
            prev.includes(stageName)
                ? prev.filter(s => s !== stageName)
                : [...prev, stageName]
        );
    };

    const handleApply = () => {
        onApplyFilters({ stages: selectedStages });
        onClose();
    };

    const handleClear = () => {
        setSelectedStages([]);
        onApplyFilters({ stages: [] });
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
                <h3 className="text-base font-bold text-gray-900">Filtros</h3>
                <button
                    onClick={handleClear}
                    className="text-xs text-gray-400 hover:text-brand-primary transition-colors font-semibold uppercase tracking-wider"
                >
                    Limpiar todo
                </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-250px)]">
                {/* Status / Stage Section */}
                <div>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'status' ? null : 'status')}
                        className="flex w-full items-center justify-between group"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">Estatus / Etapa</span>
                        {expandedSection === 'status' ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>

                    {expandedSection === 'status' && (
                        <div className="mt-4 space-y-3 pl-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Estatus del Lead</span>
                            {stages.map(stage => (
                                <label key={stage.id} className="flex items-center space-x-3 cursor-pointer group/item">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedStages.includes(stage.name)}
                                            onChange={() => toggleStage(stage.name)}
                                            className="peer h-5 w-5 rounded-md border-gray-200 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer appearance-none border flex items-center justify-center checked:bg-brand-primary checked:border-brand-primary"
                                        />
                                        <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 group-hover/item:text-gray-900 transition-colors">{stage.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Other Filter Sections */}
                <div className="pt-4 border-t border-gray-50">
                    <button className="flex w-full items-center justify-between text-gray-900 group">
                        <span className="text-sm font-bold uppercase tracking-tight text-gray-400">Fuente</span>
                        <ChevronDown size={14} className="text-gray-300" />
                    </button>
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <button className="flex w-full items-center justify-between text-gray-900 group">
                        <span className="text-sm font-bold uppercase tracking-tight text-gray-400">Fecha de Creación</span>
                        <ChevronDown size={14} className="text-gray-300" />
                    </button>
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <button className="flex w-full items-center justify-between text-gray-900 group">
                        <span className="text-sm font-bold uppercase tracking-tight text-gray-400">Valor Estimado (USD)</span>
                        <ChevronDown size={14} className="text-gray-300" />
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-50 bg-gray-50/50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <button
                    onClick={onClose}
                    className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleApply}
                    className="rounded-xl bg-brand-primary px-8 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                    Listo
                </button>
            </div>
        </div>
    );
}
