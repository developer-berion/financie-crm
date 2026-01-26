import { useState } from 'react';
import { Calendar, MessageSquare, Clock, ExternalLink, Bot, AlertCircle, User } from 'lucide-react';
import { cn } from '../lib/utils';


interface Conversation {
    id: string;
    conversation_id: string;
    transcript: string;
    summary: string;
    outcome: any;
    scheduled_datetime: string | null;
    scheduled_channel: string | null;
    created_at: string;
}

interface ElevenLabsCallCardProps {
    conversation: Conversation;
    leadState?: string;
}

const getTimeZoneLabel = (state?: string) => {
    if (!state) return '';
    const s = state.toLowerCase().trim();
    if (['florida', 'fl', 'new york', 'ny', 'georgia', 'ga', 'north carolina', 'nc', 'ohio', 'oh', 'pennsylvania', 'pa'].includes(s)) return 'Hora del Este';
    if (['texas', 'tx', 'illinois', 'il', 'minnesota', 'mn', 'missouri', 'mo'].includes(s)) return 'Hora Central';
    if (['california', 'ca', 'washington', 'wa', 'nevada', 'nv', 'oregon', 'or'].includes(s)) return 'Hora del Pacífico';
    if (['colorado', 'co', 'arizona', 'az'].includes(s)) return 'Hora de Montaña';
    return '';
};

export default function ElevenLabsCallCard({ conversation, leadState }: ElevenLabsCallCardProps) {
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

    // Robust parsing for "agent:" and "user:" blocks
    const parseTranscript = (text: string) => {
        if (!text) return [];

        // Normalize newlines and split by roles
        // We look for "agent:" or "user:" at the start of a line, or preceded by newline
        const parts = text.split(/(?=\b(?:agent|user):)/gi);

        return parts.map(part => {
            const cleanPart = part.trim();
            if (!cleanPart) return null;

            const lower = cleanPart.toLowerCase();
            if (lower.startsWith('agent:')) {
                return { role: 'agent', content: cleanPart.replace(/^agent:\s*/i, '').trim() };
            }
            if (lower.startsWith('user:')) {
                return { role: 'user', content: cleanPart.replace(/^user:\s*/i, '').trim() };
            }
            return { role: 'unknown', content: cleanPart };
        }).filter(Boolean) as { role: string, content: string }[];
    };

    const transcriptLines = parseTranscript(conversation.transcript);
    const hasStructure = transcriptLines.some(l => l.role !== 'unknown');

    const extractAgendaInfo = () => {
        if (conversation.scheduled_datetime) {
            const dateObj = new Date(conversation.scheduled_datetime);
            return {
                date: dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
                time: dateObj.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true }),
                isConfirmed: true
            };
        }
        // Basic regex fallback
        const dateMatch = conversation.transcript.match(/(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)?\s*\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
        const timeMatch = conversation.transcript.match(/(?:\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)|(?:a\s+las\s+\d{1,2}(?::\d{2})?)/i);

        if (dateMatch || timeMatch) {
            return {
                date: dateMatch ? dateMatch[0] : 'Fecha por confirmar',
                time: timeMatch ? timeMatch[0] : 'Hora por confirmar',
                isConfirmed: false
            };
        }
        return null;
    };

    const agendaInfo = extractAgendaInfo();
    const timeZoneLabel = getTimeZoneLabel(leadState);

    return (
        <>
            <div className="bg-brand-primary rounded-2xl shadow-lg border border-brand-primary overflow-hidden font-sans group">
                {/* Collapsed View (Card) - Same as before but with updated Time */}
                <div className="p-6 md:p-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <MessageSquare className="w-48 h-48 text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                                <h3 className="text-xs font-bold text-brand-accent uppercase tracking-widest">
                                    Llamada ElevenLabs
                                </h3>
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                    {new Date(conversation.created_at).toLocaleString('es-ES', {
                                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/40">
                                    ID: {conversation.conversation_id?.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Summary */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Resumen de la Conversación</span>
                                <p className="text-gray-100 text-sm leading-relaxed font-medium">
                                    {conversation.summary || "Sin resumen disponible."}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsTranscriptOpen(true)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-brand-accent hover:text-white transition-colors group/btn"
                            >
                                Ver Transcripción
                                <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        {/* Agenda */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-between h-full hover:bg-white/10 transition-colors">
                            <div>
                                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Calendar className="w-3.5 h-3.5" /> Agenda Detectada
                                </span>

                                {agendaInfo ? (
                                    <div className="space-y-1">
                                        <div className="text-xl font-bold text-white capitalize">
                                            {agendaInfo.date}
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-brand-accent">
                                                {agendaInfo.time}
                                            </div>
                                            {timeZoneLabel && (
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                                    {timeZoneLabel}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            {agendaInfo.isConfirmed ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                    Confirmado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                                    <AlertCircle className="w-3 h-3" /> Requiere Confirmación
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                        <Calendar className="w-8 h-8 text-white/20 mb-2" />
                                        <p className="text-xs text-white/40 font-medium">No se detectó cita</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transcript Modal - Custom 80% width override */}
            {isTranscriptOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[80vw] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-sm">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-brand-text">Transcripción de Llamada</h3>
                                    <p className="text-xs text-gray-400 font-medium">
                                        ID: {conversation.conversation_id?.slice(0, 12)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTranscriptOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 space-y-6">
                            {hasStructure ? (
                                transcriptLines.map((line, idx) => {
                                    const isAgent = line.role === 'agent';
                                    return (
                                        <div key={idx} className={cn("flex w-full group", isAgent ? "justify-start" : "justify-end")}>
                                            <div className={cn("flex max-w-[70%] gap-4", isAgent ? "flex-row" : "flex-row-reverse")}>
                                                {/* Avatar */}
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm mt-1",
                                                    isAgent ? "bg-white text-brand-primary border border-gray-100" : "bg-brand-primary text-white"
                                                )}>
                                                    {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                </div>

                                                {/* Bubble */}
                                                <div className={cn(
                                                    "px-6 py-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all hover:shadow-md",
                                                    isAgent
                                                        ? "bg-white text-brand-text border border-gray-100 rounded-tl-none"
                                                        : "bg-[#E3E7EF] text-brand-primary border border-[#D1D5DB] rounded-tr-none font-medium"
                                                )}>
                                                    <p className="mb-1 text-[10px] uppercase font-bold tracking-wider opacity-40">
                                                        {isAgent ? "Laura (AI)" : "Bianca Garcia"}
                                                    </p>
                                                    {line.content}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 font-mono text-sm leading-loose">
                                    {conversation.transcript}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsTranscriptOpen(false)}
                                className="px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-secondary transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
