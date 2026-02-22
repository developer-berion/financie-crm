import { Edit3, Plus, FileText, Briefcase } from 'lucide-react';
import { formatLeadTime } from '../../../lib/utils';
import type { Lead } from '../../../types';

interface MidStageViewProps {
    lead: Lead;
    notes: any[];
    onNewNote: () => void;
    onEditNote: (note: any) => void;
}

export default function MidStageView({ lead, notes, onNewNote, onEditNote }: MidStageViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Proposal / Requirements Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-border flex items-center gap-3 bg-brand-primary/5">
                    <div className="p-2 bg-brand-primary text-white rounded-lg">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Propuesta de Valor</h2>
                        <p className="text-xs text-brand-text/60">Requerimientos y detalles de la cotización</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Necesidad Principal</label>
                            <div className="text-sm font-medium text-gray-900">
                                {(lead as any).main_objective || 'No especificado'}
                            </div>
                        </div>
                        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Solución Propuesta</label>
                            <div className="text-sm text-gray-500 italic">
                                Editar en notas o adjuntar documento...
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes Section - Reused pattern */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Notas de Negociación</h2>
                            <p className="text-xs text-gray-500">Detalles de la presentación y objeciones</p>
                        </div>
                    </div>
                    <button
                        onClick={onNewNote}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-primary/90 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Nota
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {notes.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm mb-4">
                                <FileText className="w-6 h-6 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No hay notas registradas</h3>
                            <button onClick={onNewNote} className="mt-4 text-brand-accent text-sm font-bold hover:underline">Crear nota ahora</button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => onEditNote(note)}
                                    className="group relative bg-white p-5 rounded-xl border border-gray-100 hover:border-brand-accent/30 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50/50"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-brand-primary text-base group-hover:text-brand-accent transition-colors">{note.title}</h4>
                                        <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-100 uppercase tracking-wider">
                                            {formatLeadTime(note.created_at).date}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-3 group-hover:text-gray-800 transition-colors">{note.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
