import { useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function LeadQuickAdd({ onLeadAdded }: { onLeadAdded: () => void }) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!value.trim()) return;

        setLoading(true);
        try {
            // Basic heuristic: Last part is phone if it starts with + or is digits
            const parts = value.trim().split(' ');
            let phone = '';
            let name = value.trim();

            if (parts.length > 1) {
                const lastPart = parts[parts.length - 1];
                // Check if last part looks like a phone number (e.g. +123, 123-456, etc)
                // Allowing +, -, (, ), and digits
                if (/^[\d+\-\(\)]+$/.test(lastPart)) {
                    phone = lastPart;
                    name = parts.slice(0, -1).join(' ');
                }
            }

            const { error } = await supabase.from('leads').insert([
                {
                    full_name: name,
                    phone: phone,
                    source: 'Manual',
                    status: 'Nuevo'
                }
            ]);

            if (error) throw error;

            toast.success('Lead creado exitosamente');
            setValue('');
            onLeadAdded();
        } catch (error) {
            console.error(error);
            toast.error('Error al crear lead');
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
        <div className="relative w-full group">
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
        </div>
    );
}
