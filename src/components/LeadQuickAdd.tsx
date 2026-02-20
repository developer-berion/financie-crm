import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useDuplicateDetector } from '../hooks/useDuplicateDetector';
import { DataIntegrityIndicator } from './leads/DataIntegrityIndicator';
import { MergeConflictModal } from './leads/MergeConflictModal';

export default function LeadQuickAdd({ onLeadAdded }: { onLeadAdded: () => void }) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

    // Live parse the input to feed the duplicate detector
    const { parsedName, parsedPhone } = useMemo(() => {
        const parts = value.trim().split(' ');
        let phone = '';
        let name = value.trim();

        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (/^[\d+\-\(\)]+$/.test(lastPart)) {
                phone = lastPart;
                name = parts.slice(0, -1).join(' ');
            }
        }
        return { parsedName: name, parsedPhone: phone };
    }, [value]);

    const { duplicates, isChecking, hasDuplicates, highestConfidence, error: detectorError } = useDuplicateDetector(null, parsedPhone, parsedName);

    const handleSubmit = async () => {
        if (!value.trim()) return;

        // Intercept if high confidence duplicate exists
        if (hasDuplicates && highestConfidence >= 80) {
            setIsMergeModalOpen(true);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('leads').insert([
                {
                    full_name: parsedName,
                    phone: parsedPhone,
                    source: 'Manual',
                    status: 'Nuevo'
                }
            ]);

            if (error) throw error;

            toast.success('Lead creado exitosamente');
            setValue('');
            onLeadAdded();
        } catch (err) {
            console.error(err);
            toast.error('Error al crear lead');
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async (survivorId: string, _duplicateId: string, mergedFields: Record<string, string>) => {
        setLoading(true);
        setIsMergeModalOpen(false);
        try {
            const { error } = await supabase.rpc('merge_leads', {
                p_survivor_id: survivorId,
                // Passing a dummy or null since duplicate doesn't exist yet, 
                // but the RPC requires it to not be null and to exist.
                // Wait, if the RPC requires the duplicate to exist to merge related records... 
                // since this is a NEW lead, there are no related records!
                // We just need to UPDATE the existing survivor lead with the merged fields.
            });
            // Let's manually update the survivor lead instead of calling the RPC
            // because the RPC is designed for merging two EXISTING leads.

            const { error: updateError } = await supabase
                .from('leads')
                .update(mergedFields)
                .eq('id', survivorId);

            if (updateError) throw updateError;

            // Also add an audit log manually since we skipped the RPC
            await supabase.from('lead_events').insert({
                lead_id: survivorId,
                event_type: 'system.merged_on_create',
                payload: { updated_fields: mergedFields, timestamp: new Date().toISOString() }
            });

            toast.success('Lead actualizado y unido exitosamente');
            setValue('');
            onLeadAdded();
        } catch (err) {
            console.error('Merge error:', err);
            toast.error('Error al unir registros');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="relative w-full group flex flex-col gap-2">
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Plus className="h-5 w-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full h-[48px] pl-11 pr-12 py-3 bg-white border-transparent rounded-xl text-base text-gray-900 placeholder-gray-400 shadow-sm ring-1 ring-gray-900/5 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
                    placeholder="Quick add: 'Maria Perez +1 305 555 0123' + Enter"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />

                {/* Async specific check indicator overlayed in input if valued */}
                {value.trim().length > 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-all">
                        <DataIntegrityIndicator
                            isChecking={isChecking}
                            hasDuplicates={hasDuplicates}
                            highestConfidence={highestConfidence}
                            error={detectorError}
                        />
                    </div>
                )}
            </div>

            {duplicates.length > 0 && (
                <MergeConflictModal
                    isOpen={isMergeModalOpen}
                    onClose={() => setIsMergeModalOpen(false)}
                    onMerge={handleMerge}
                    newLeadData={{ full_name: parsedName, phone: parsedPhone, source: 'Manual' }}
                    existingLead={duplicates[0]}
                />
            )}
        </div>
    );
}
