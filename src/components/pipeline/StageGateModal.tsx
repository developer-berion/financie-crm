import React, { useState } from 'react';
import { X, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { STAGE_GATES } from '../../lib/stage-gates';
import type { Lead } from '../../types';

interface StageGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    targetStageName: string;
    missingFields: string[];
    onSubmit: (updates: Partial<Lead>) => Promise<void>;
}

export function StageGateModal({
    isOpen,
    onClose,
    lead,
    targetStageName,
    missingFields,
    onSubmit
}: StageGateModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const rule = STAGE_GATES[targetStageName];

    if (!isOpen || !rule) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Build updates payload based on standard fields vs JSONB
            const updates: Partial<Lead> = {};

            if (formData.estimated_value !== undefined) {
                updates.estimated_value = Number(formData.estimated_value);
            }

            if (formData.contract_signed !== undefined || formData.contract_url !== undefined) {
                updates.contract_details = {
                    ...lead.contract_details,
                    ...formData
                };
            }

            await onSubmit(updates);
            onClose();
        } catch (error) {
            console.error('Failed to satisfy stage gates:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                    <div className="flex items-center gap-2 text-amber-800">
                        <Lock className="w-5 h-5" />
                        <h2 className="font-semibold text-sm uppercase tracking-wide">
                            Requisitos para {targetStageName}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg text-sm text-amber-800 mb-6 border border-amber-100">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{rule.explanation}</p>
                    </div>

                    <form id="stage-gate-form" onSubmit={handleSubmit} className="space-y-4">
                        {missingFields.includes('estimated_value') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor Estimado (Obligatorio)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        required
                                        value={formData.estimated_value || ''}
                                        onChange={(e) => handleFieldChange('estimated_value', e.target.value)}
                                        className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}

                        {missingFields.includes('contract_signed') && (
                            <div>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.contract_signed === 'true'}
                                        onChange={(e) => handleFieldChange('contract_signed', e.target.checked ? 'true' : 'false')}
                                        className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Contrato Firmado
                                    </span>
                                </label>
                            </div>
                        )}

                        {missingFields.includes('contract_url') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Enlace al Contrato (PDF/Drive Obligatorio)
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.contract_url || ''}
                                    onChange={(e) => handleFieldChange('contract_url', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                                    placeholder="https://docs.google.com/..."
                                />
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="stage-gate-form"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Completar y Mover'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
