import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDebounce } from './useDebounce';

export interface DuplicateMatch {
    id: string;
    full_name: string;
    email: string | null;
    phone: string;
    status: string;
    confidence_score: number;
    match_type: string;
}

export function useDuplicateDetector(email: string | null, phone: string, fullName: string) {
    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Debounce the inputs so we don't spam the database on every keystroke
    const debouncedEmail = useDebounce(email, 500);
    const debouncedPhone = useDebounce(phone, 500);
    const debouncedFullName = useDebounce(fullName, 500);

    const checkDuplicates = useCallback(async () => {
        // Only check if we have at least one valid piece of identity information
        if (!debouncedEmail && (!debouncedPhone || debouncedPhone.length < 5) && (!debouncedFullName || debouncedFullName.length < 3)) {
            setDuplicates([]);
            return;
        }

        setIsChecking(true);
        setError(null);

        try {
            const { data, error } = await supabase.rpc('check_lead_duplicates', {
                p_email: debouncedEmail || null,
                p_phone: debouncedPhone || null,
                p_full_name: debouncedFullName || null
            });

            if (error) {
                console.warn('Error checking duplicates (maybe RPC not pushed yet):', error.message);
                throw error;
            }

            setDuplicates(data || []);
        } catch (err: any) {
            console.error('Duplicate detection failed:', err);
            setError(err);
            setDuplicates([]);
        } finally {
            setIsChecking(false);
        }
    }, [debouncedEmail, debouncedPhone, debouncedFullName]);

    useEffect(() => {
        checkDuplicates();
    }, [checkDuplicates]);

    return {
        duplicates,
        isChecking,
        error,
        hasDuplicates: duplicates.length > 0,
        highestConfidence: duplicates.length > 0 ? duplicates[0].confidence_score : 0
    };
}
