import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import { Save, History, Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Note {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    archived: boolean;
}

interface NoteVersion {
    id: string;
    note_id: string;
    title: string;
    content: string;
    created_at: string;
}

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    note?: Note | null;
    leadId: string;
    onNoteSaved: () => void;
}

export default function NoteModal({ isOpen, onClose, note, leadId, onNoteSaved }: NoteModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState<NoteVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (note) {
                setTitle(note.title);
                setContent(note.content);
                fetchVersions(note.id);
            } else {
                setTitle('');
                setContent('');
                setVersions([]);
            }
        }
    }, [isOpen, note]);

    const fetchVersions = async (noteId: string) => {
        setLoadingVersions(true);
        const { data, error } = await supabase
            .from('note_versions')
            .select('*')
            .eq('note_id', noteId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setVersions(data);
        }
        setLoadingVersions(false);
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;

        setLoading(true);
        try {
            if (note) {
                // Editing existing note
                // 1. Create version from current state (snapshotting what is in DB effectively, but we assume UI state was synced. 
                //    Wait, to be safe and accurate, we should snapshot what WAS there. 
                //    But `note` prop holds what WAS there before we user started typing if we don't update `note` prop on type.
                //    Yes, `note` prop is the current DB state when modal opened. 

                // Let's verify if `note` matches current DB. Ideally yes.

                const { error: versionError } = await supabase
                    .from('note_versions')
                    .insert({
                        note_id: note.id,
                        title: note.title, // The OLD title
                        content: note.content // The OLD content
                    });

                if (versionError) throw versionError;

                // 2. Update note
                const { error: updateError } = await supabase
                    .from('notes')
                    .update({
                        title,
                        content,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', note.id);

                if (updateError) throw updateError;

            } else {
                // Creating new note
                const { error } = await supabase
                    .from('notes')
                    .insert({
                        lead_id: leadId,
                        title,
                        content
                    });

                if (error) throw error;
            }

            onNoteSaved();
            onClose();
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Error al guardar la nota');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!note) return;
        if (!confirm('¿Estás seguro de que deseas archivar esta nota?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('notes')
                .update({ archived: true })
                .eq('id', note.id);

            if (error) throw error;
            onNoteSaved();
            onClose();
        } catch (error) {
            console.error('Error archiving note:', error);
            alert('Error al archivar la nota');
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async () => {
        if (!note) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('notes')
                .update({ archived: false })
                .eq('id', note.id);

            if (error) throw error;
            onNoteSaved();
            onClose();
        } catch (error) {
            console.error('Error restoring note:', error);
            alert('Error al restaurar la nota');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={note ? "Editar Nota" : "Nueva Nota"}
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Resumen breve de la nota..."
                            className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contenido</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Detalles completos..."
                            rows={6}
                            className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <div>
                        {note && (
                            note.archived ? (
                                <button
                                    type="button"
                                    onClick={handleUnarchive}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors text-sm font-medium"
                                >
                                    <ArchiveRestore className="w-4 h-4" />
                                    Restaurar
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleArchive}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                                >
                                    <Archive className="w-4 h-4" />
                                    Archivar
                                </button>
                            )
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || !title.trim() || !content.trim()}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all flex items-center gap-2",
                                loading || !title.trim() || !content.trim()
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-brand-primary hover:bg-brand-secondary hover:shadow-lg active:scale-95"
                            )}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Guardando...' : 'Guardar Nota'}
                        </button>
                    </div>
                </div>

                {/* History Section */}
                {note && (
                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <History className="w-4 h-4" /> Historial de Cambios
                        </h4>

                        {loadingVersions ? (
                            <div className="text-center py-4 text-gray-400 text-xs">Cargando historial...</div>
                        ) : versions.length > 0 ? (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {versions.map((version) => (
                                    <div key={version.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-600">{version.title}</span>
                                            <span className="text-gray-400 text-[10px]">
                                                {format(new Date(version.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 line-clamp-2">{version.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
                                No hay versiones anteriores.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
