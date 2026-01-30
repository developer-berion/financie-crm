import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function SyncCalendlyButton({ className }: { className?: string }) {
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        // Check cooldown on mount
        const lastRun = localStorage.getItem('last_calendly_sync');
        if (lastRun) {
            const elapsed = Date.now() - parseInt(lastRun, 10);
            if (elapsed < COOLDOWN_MS) {
                setTimeLeft(COOLDOWN_MS - elapsed);
            }
        }
    }, []);

    useEffect(() => {
        if (timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft((prev) => Math.max(0, prev - 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timeLeft]);

    const handleSync = async () => {
        if (loading || timeLeft > 0) return;

        setLoading(true);
        setStatus('idle');
        try {
            const { data, error } = await supabase.functions.invoke('sync_calendly_events');

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setStatus('success');
            const now = Date.now();
            localStorage.setItem('last_calendly_sync', now.toString());
            setTimeLeft(COOLDOWN_MS);

            // Clear success status after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Sync failed:', err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading || timeLeft > 0}
            className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full",
                timeLeft > 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200",
                className
            )}
            title={timeLeft > 0 ? `Disponible en ${formatTime(timeLeft)}` : "Sincronizar Calendly ahora"}
        >
            {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : status === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            ) : status === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            ) : (
                <RefreshCw className="w-3.5 h-3.5" />
            )}

            {loading ? 'Sync...' :
                status === 'success' ? 'Listo' :
                    status === 'error' ? 'Error' :
                        timeLeft > 0 ? formatTime(timeLeft) : 'Sync Calendly'}
        </button>
    );
}
