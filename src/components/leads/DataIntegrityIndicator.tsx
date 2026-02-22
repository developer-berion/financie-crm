import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DataIntegrityIndicatorProps {
    isChecking: boolean;
    hasDuplicates: boolean;
    highestConfidence: number;
    error: Error | null;
}

export function DataIntegrityIndicator({ isChecking, hasDuplicates, highestConfidence, error }: DataIntegrityIndicatorProps) {
    if (error) {
        return (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200" title="Verificación inactiva (RPC faltante)">
                <Shield className="w-3.5 h-3.5" />
                <span>Verificación Offline</span>
            </div>
        );
    }

    if (isChecking) {
        return (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verificando Integridad...</span>
            </div>
        );
    }

    if (hasDuplicates) {
        const isHighConfidence = highestConfidence >= 90;

        return (
            <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border shadow-sm transition-all",
                isHighConfidence
                    ? "text-red-700 bg-red-50 border-red-200"
                    : "text-amber-700 bg-amber-50 border-amber-200"
            )}>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isHighConfidence ? 'Conflicto Crítico' : 'Posible Duplicado'}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 transition-all">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Datos Limpios</span>
        </div>
    );
}
