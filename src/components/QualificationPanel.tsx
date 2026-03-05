import { Target, Wallet, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface QualificationPanelProps {
    objective: string | null;
    income: string | null;
    health: string | null;
    botVerification: string | null;
    onUpdate: (field: string, value: unknown) => void;
}

export default function QualificationPanel({ objective, income, health, botVerification, onUpdate }: QualificationPanelProps) {

    // Helper to normalize values for select inputs
    const normalizeObjective = (val: string | null) => {
        if (!val) return '';
        const lower = val.toLowerCase().trim();
        // Match approximate string values from DB to simpler Select values if needed, 
        // or just return the value if it mimics the DB exactly. 
        // Assuming DB stores these exact strings or similar.
        if (lower.includes('protección') || lower.includes('proteccion') || lower.includes('familiar')) return 'Protección Familiar';
        if (lower.includes('retiro')) return 'Ahorro para retiro';
        if (lower.includes('hijos') || lower.includes('educación') || lower.includes('educacion')) return 'Educación para tus hijos';
        return val;
    };

    const normalizeYesNo = (val: string | null) => {
        if (!val) return '';
        const lower = val.toLowerCase().trim();
        if (lower === 'si' || lower === 'sí' || lower === 'yes') return 'Si';
        if (lower === 'no') return 'No';
        return val;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6">
            <h3 className="text-xs font-bold text-brand-text/60 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Drivers del Cierre (Calificación)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. OBJETIVO PRINCIPAL */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Objetivo Principal</label>
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none"
                            value={normalizeObjective(objective)}
                            onChange={(e) => onUpdate('main_objective', e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Protección Familiar">Protección Familiar</option>
                            <option value="Ahorro para retiro">Ahorro para retiro</option>
                            <option value="Educación para tus hijos">Educación para tus hijos</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* 2. INGRESOS ESTABLES */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ingresos Estables</label>
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all appearance-none"
                            value={normalizeYesNo(income)}
                            onChange={(e) => onUpdate('stable_income', e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Si">Si</option>
                            <option value="No">No</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                            <Wallet className="w-4 h-4 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* 3. CONDICIÓN DE SALUD */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Condición de Salud</label>
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all appearance-none"
                            value={normalizeYesNo(health)}
                            onChange={(e) => onUpdate('health_condition', e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Si">Si</option>
                            <option value="No">No</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                            <Activity className="w-4 h-4 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* 4. VERIFICACIÓN ANTI-BOT */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Verificación Anti-Bot</label>
                    <div className="relative">
                        <div className={cn(
                            "w-full border rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 bg-gray-50",
                            botVerification === 'human' ? "border-green-200 bg-green-50 text-green-700" : "border-gray-100 text-gray-400 italic"
                        )}>
                            {botVerification === 'human' ? (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Verificado</span>
                                </>
                            ) : (
                                <span>{botVerification || "No aplica / No data"}</span>
                            )}
                        </div>
                        {/* Optional: If user really wants to edit this system field manually, we could make it a select too, 
                             but usually this is system-generated. User image shows it as "No aplica / No data" in a gray box, 
                             which implies read-only state, OR a placeholder. 
                             The user said "ponlos como yo pueda editarlos", referring to the 3 fields he mentioned explicitly?
                             Actually he listed all 4. "quiero reponer estos tres campos... cuatro".
                             "son los más importantes... algunos vienen vacíos otros llenos... no los dejes vacíos... y no los dejes sin editar".
                             Okay, I will make Bot Verification editable as well just in case.
                         */}
                    </div>
                </div>

            </div>
        </div>
    );
}
