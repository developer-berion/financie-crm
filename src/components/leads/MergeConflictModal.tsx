import { useState } from 'react';
import { X, ArrowRight, ShieldAlert } from 'lucide-react';
import type { DuplicateMatch } from '../../hooks/useDuplicateDetector';
import { cn } from '../../lib/utils';

type MergeFieldKey = 'full_name' | 'email' | 'phone' | 'source';
type MergeLeadInput = Partial<Record<MergeFieldKey, string | null>>;

interface MergeConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMerge: (survivorId: string, duplicateId: string, mergedFields: Record<string, string>) => void;
    newLeadData: MergeLeadInput; // Current form data
    existingLead: DuplicateMatch; // The matched lead from DB
}

export function MergeConflictModal({ isOpen, onClose, onMerge, newLeadData, existingLead }: MergeConflictModalProps) {
    // State to hold which side won for each field. 'new' or 'existing'
    const [selections, setSelections] = useState<Record<MergeFieldKey, 'new' | 'existing'>>({
        full_name: 'existing',
        email: 'existing',
        phone: 'existing',
        source: 'new'
    });

    if (!isOpen) return null;

    const fieldsToCompare: Array<{ key: MergeFieldKey; label: string }> = [
        { key: 'full_name', label: 'Nombre Completo' },
        { key: 'email', label: 'Correo Electrónico' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'source', label: 'Origen' }
    ];

    const handleSelect = (field: MergeFieldKey, source: 'new' | 'existing') => {
        setSelections(prev => ({ ...prev, [field]: source }));
    };

    const handleConfirmMerge = () => {
        // Build the final merged object based on selections
        const merged: Record<string, string> = {};
        fieldsToCompare.forEach(({ key }) => {
            const winner = selections[key];
            const existingValue = (existingLead as Partial<Record<MergeFieldKey, string | null>>)[key];
            const val = winner === 'new' ? newLeadData[key] : existingValue;
            if (val) {
                merged[key] = val;
            }
        });

        // The existing lead is always the survivor to keep its history (Timeline, Notes).
        // The new lead (which hasn't been created yet) is essentially just dropped, 
        // but its data is used to update the existing lead.
        // Wait, the RPC expects a duplicateId. Since the new lead doesn't exist in DB yet, 
        // we don't actually need to call the merge_leads RPC with two IDs. 
        // We just need to UPDATE the existing lead with the merged data and maybe add a note.
        // Let's pass null for duplicateId to signal this is a "Merge before creation".

        onMerge(existingLead.id, 'new_creation', merged);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-red-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Conflicto de Duplicado</h2>
                            <p className="text-sm text-gray-500">Un lead con datos similares ya existe en la base de datos.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start mb-6">
                        {/* New Lead Column */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-center bg-gray-50 py-2 rounded-lg">
                                Datos Nuevos
                            </h3>
                            {fieldsToCompare.map(({ key, label }) => (
                                <div
                                    key={`new-${key}`}
                                    onClick={() => handleSelect(key, 'new')}
                                    className={cn(
                                        "p-3 rounded-xl border-2 cursor-pointer transition-all",
                                        selections[key] === 'new'
                                            ? "border-brand-primary bg-brand-primary/5"
                                            : "border-transparent hover:border-gray-200 bg-gray-50 opacity-60"
                                    )}
                                >
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                    <p className={cn(
                                        "font-medium truncate",
                                        !newLeadData[key] && "italic text-gray-400"
                                    )}>{newLeadData[key] || 'Vacío'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Arrows Column */}
                        <div className="flex flex-col gap-4 mt-12 justify-center">
                            {fieldsToCompare.map((_, i) => (
                                <div key={i} className="h-[76px] flex items-center justify-center">
                                    <ArrowRight className="w-5 h-5 text-gray-300" />
                                </div>
                            ))}
                        </div>

                        {/* Existing Lead Column */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-brand-primary text-sm uppercase tracking-wider text-center bg-brand-primary/10 py-2 rounded-lg">
                                Registro Existente (Guardar)
                            </h3>
                            {fieldsToCompare.map(({ key, label }) => (
                                <div
                                    key={`existing-${key}`}
                                    onClick={() => handleSelect(key, 'existing')}
                                    className={cn(
                                        "p-3 rounded-xl border-2 cursor-pointer transition-all",
                                        selections[key] === 'existing'
                                            ? "border-brand-primary bg-brand-primary/5"
                                            : "border-transparent hover:border-gray-200 bg-gray-50 opacity-60"
                                    )}
                                >
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                    <p className={cn(
                                        "font-medium truncate",
                                        !(existingLead as Partial<Record<MergeFieldKey, string | null>>)[key] && "italic text-gray-400"
                                    )}>{(existingLead as Partial<Record<MergeFieldKey, string | null>>)[key] || 'Vacío'}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3 items-start border border-blue-100">
                        <div className="font-bold">Info:</div>
                        <p>Al hacer clic en "Unir Registros", el lead nuevo no se creará. En su lugar, el registro existente se actualizará con los valores seleccionados arriba. Todo el historial previo se mantiene intacto.</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmMerge}
                        className="px-6 py-2.5 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/20 flex items-center gap-2"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Unir Registros y Continuar
                    </button>
                </div>
            </div>
        </div>
    );
}
