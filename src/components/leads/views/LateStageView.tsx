import { Edit3, Plus, CheckCircle, FileSignature, Landmark } from 'lucide-react';
import { formatLeadTime } from '../../../lib/utils';
import type { Lead } from '../../../types';

interface LateStageViewProps {
    lead: Lead;
    notes: any[];
    onNewNote: () => void;
    onEditNote: (note: any) => void;
    onUpdateLead: (field: string, value: unknown) => Promise<void>;
}

export default function LateStageView({ lead, notes, onNewNote, onEditNote, onUpdateLead }: LateStageViewProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* High-Density Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Contract Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-border flex items-center gap-3 bg-gray-50/50">
                        <FileSignature className="w-4 h-4 text-emerald-600" />
                        <h2 className="text-sm font-bold text-gray-900">Detalles de Cierre</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Expected Close Date</label>
                            <input
                                type="date"
                                value={lead.expected_close_date || ''}
                                onChange={(e) => onUpdateLead('expected_close_date', e.target.value)}
                                className="w-full text-sm font-medium border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors py-2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Prioridad</label>
                            <select
                                value={lead.priority || 'Medium'}
                                onChange={(e) => onUpdateLead('priority', e.target.value)}
                                className="w-full text-sm font-medium border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors py-2"
                            >
                                <option value="High">🔴 Alta</option>
                                <option value="Medium">🟡 Media</option>
                                <option value="Low">🟢 Baja</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-border flex items-center gap-3 bg-gray-50/50">
                        <Landmark className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-bold text-gray-900">Datos de Facturación</h2>
                    </div>
                    <div className="p-5 space-y-4 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">Razón Social</span>
                            <span className="font-medium text-gray-900">{(lead.billing_info as any)?.entity_name || 'Pendiente'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">RUT / ID Fiscal</span>
                            <span className="font-medium font-mono text-gray-900">{(lead.billing_info as any)?.tax_id || 'Pendiente'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500">Método de Pago</span>
                            <span className="font-medium text-gray-900">{(lead.billing_info as any)?.payment_method || 'Pendiente'}</span>
                        </div>
                        <button className="w-full mt-2 text-xs font-bold text-brand-primary border border-brand-primary/20 bg-brand-primary/5 py-2 rounded-lg hover:bg-brand-primary/10 transition-colors">
                            Actualizar Datos
                        </button>
                    </div>
                </div>
            </div>

            {/* Compact Notes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                <div className="px-5 py-4 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-gray-500" />
                        <h2 className="text-sm font-bold text-gray-900">Notas Finales</h2>
                    </div>
                    <button
                        onClick={onNewNote}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        Add Note
                    </button>
                </div>

                <div className="p-5">
                    {notes.length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-400">Sin notas registradas.</div>
                    ) : (
                        <div className="space-y-3">
                            {notes.slice(0, 3).map((note) => (
                                <div key={note.id} onClick={() => onEditNote(note)} className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:border-brand-primary/30">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-xs text-brand-primary">{note.title}</h4>
                                        <span className="text-[9px] text-gray-400">{formatLeadTime(note.created_at).date}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">{note.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Checklist */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Checklist de Cierre
                </h3>
                <div className="space-y-3 text-sm text-emerald-900">
                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded shadow-sm opacity-50"><input type="checkbox" checked readOnly className="rounded text-emerald-600 focus:ring-emerald-500" /> KYC Completado</label>
                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded shadow-sm">
                        <input
                            type="checkbox"
                            checked={lead.contract_details?.contract_signed === 'true'}
                            onChange={(e) => onUpdateLead('contract_details', { ...lead.contract_details, contract_signed: e.target.checked ? 'true' : 'false' })}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        Contrato Firmado
                    </label>

                    <div className="bg-white px-3 py-2 rounded shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Contract URL (PDF/Drive)</label>
                        <input
                            type="url"
                            value={lead.contract_details?.contract_url || ''}
                            onChange={(e) => onUpdateLead('contract_details', { ...lead.contract_details, contract_url: e.target.value })}
                            className="w-full text-sm font-medium border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors py-1.5 px-3"
                            placeholder="https://docs.google.com/..."
                        />
                    </div>

                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded shadow-sm"><input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" /> Primer Pago Verificado</label>
                </div>
            </div>
        </div>
    );
}
