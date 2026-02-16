import { useState } from 'react';
import { Phone, Check, Clock, Voicemail } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface ContactAttemptsPanelProps {
    attempts: number;
    lastAttempt: string | null | undefined;
    onUpdate: (newAttempts: number) => Promise<void>; // Keep for manual correction/reset
    onOutcomeSelected: (outcome: string, title: string, nextAttempt: number) => void;
}

export default function ContactAttemptsPanel({ attempts = 0, lastAttempt, onUpdate, onOutcomeSelected }: ContactAttemptsPanelProps) {
    const [loading, setLoading] = useState(false);
    const [isResetConfirming, setIsResetConfirming] = useState(false);

    const handleAttempt = (outcome: 'no_answer' | 'busy' | 'bad_number' | 'voicemail') => {
        const nextAttempt = attempts + 1;
        let title = '';
        switch (outcome) {
            case 'no_answer': title = `Intento #${nextAttempt}: No contestó`; break;
            case 'busy': title = `Intento #${nextAttempt}: Ocupado`; break;
            case 'voicemail': title = `Intento #${nextAttempt}: Buzón de voz`; break;
            case 'bad_number': title = `Intento #${nextAttempt}: Número equivocado / No existe`; break;
        }

        onOutcomeSelected(outcome, title, nextAttempt);
    };

    const handleSuccess = () => {
        const attemptNum = attempts + 1;
        onOutcomeSelected('answered', `Intento #${attemptNum}: Contestó`, attemptNum);
    };

    const handleCorrection = async (targetAttempt: number) => {
        if (loading) return;
        if (targetAttempt === attempts) return;

        // If it's a reset (target 0), we assume confirmation is handled by the UI state
        // For other manual corrections (clicking bubbles), we keep window.confirm for now or assume intent
        if (targetAttempt > 0 && !window.confirm(`¿Estás seguro de cambiar el contador a ${targetAttempt}?`)) {
            return;
        }

        setLoading(true);
        try {
            await onUpdate(targetAttempt);
            toast.success(`Contador actualizado a ${targetAttempt}`);
        } catch (error) {
            toast.error('Error al actualizar contador');
        } finally {
            setLoading(false);
        }
    };

    const handleResetClick = () => {
        if (isResetConfirming) {
            handleCorrection(0);
            setIsResetConfirming(false);
        } else {
            setIsResetConfirming(true);
            setTimeout(() => setIsResetConfirming(false), 3000); // Auto-cancel after 3s
        }
    };

    const getLastAttemptLabel = () => {
        if (!lastAttempt) return null;
        const date = new Date(lastAttempt);
        return `Último: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-brand-border p-5 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-brand-text/60 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Estrategia de Contacto
                </h3>
                {lastAttempt && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResetClick}
                            className={cn(
                                "text-[10px] underline cursor-pointer transition-colors font-medium",
                                isResetConfirming ? "text-red-600 font-bold no-underline bg-red-50 px-2 py-0.5 rounded" : "text-red-400 hover:text-red-600"
                            )}
                            title="Reiniciar contador"
                        >
                            {isResetConfirming ? "¿Confirmar?" : "Reset"}
                        </button>
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">
                            {getLastAttemptLabel()}
                        </span>
                    </div>
                )}
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center justify-between px-4 mb-8 relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 -translate-y-1/2 rounded-full" />

                {[1, 2, 3].map((step) => {
                    const isCompleted = attempts >= step;
                    const isCurrent = attempts === step - 1; // e.g. attempts=0 -> step 1 is current target

                    return (
                        <div
                            key={step}
                            className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                            onClick={() => handleCorrection(step - 1)}
                            title={`Ir al Intento ${step}`}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300 bg-white group-hover:scale-110",
                                isCompleted
                                    ? "border-brand-primary text-brand-primary"
                                    : (isCurrent ? "border-brand-accent text-brand-accent scale-110 shadow-lg" : "border-gray-200 text-gray-300")
                            )}>
                                {isCompleted ? <Check className="w-5 h-5" /> : step}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wide",
                                isCompleted ? "text-brand-primary" : (isCurrent ? "text-brand-accent" : "text-gray-300")
                            )}>
                                Intento {step}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            {attempts < 3 ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <button
                            onClick={handleSuccess}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20 transition-all active:scale-95"
                        >
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-bold">Contestó</span>
                        </button>
                    </div>

                    <button
                        onClick={() => handleAttempt('no_answer')}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-orange-200 hover:bg-orange-50 transition-all group"
                    >
                        <Clock className="w-5 h-5 text-gray-400 group-hover:text-orange-500 mb-1" />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-orange-700">No Contestó</span>
                    </button>

                    <button
                        onClick={() => handleAttempt('voicemail')}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                    >
                        <Voicemail className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1" />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-700">Buzón</span>
                    </button>
                </div>
            ) : (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                    <h4 className="text-sm font-bold text-red-700 mb-1">Máximo de intentos alcanzado</h4>
                    <p className="text-xs text-red-600">Considera descartar el lead o moverlo a reciclaje.</p>
                </div>
            )}
        </div>
    );
}
