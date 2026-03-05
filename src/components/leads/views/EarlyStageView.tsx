import QualificationPanel from '../../QualificationPanel';
import { Edit3, Plus, FileText, ExternalLink } from 'lucide-react';
import { formatLeadTime } from '../../../lib/utils';
import type { Lead, Note } from '../../../types';

interface EarlyStageViewProps {
    lead: Lead;
    notes: Note[];
    onUpdateLead: (field: string, value: unknown) => Promise<void>;
    onNewNote: () => void;
    onEditNote: (note: Note) => void;
}

export default function EarlyStageView({ lead, notes, onUpdateLead, onNewNote, onEditNote }: EarlyStageViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Qualification Panel */}
            <QualificationPanel
                objective={lead.main_objective || null}
                income={lead.stable_income || null}
                health={lead.health_condition || null}
                botVerification={lead.bot_verification || null}
                onUpdate={onUpdateLead}
            />

            {/* Notes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Discovery Notes</h2>
                            <p className="text-xs text-gray-500">Early stage interactions and discoveries</p>
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
                            <p className="text-xs text-gray-400">Registra la primera interacción clave con este lead.</p>
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

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400">
                                            {note.archived ? 'Archivada' : 'Activa'}
                                        </span>
                                        <span className="text-xs font-medium text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            Editar <ExternalLink className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
