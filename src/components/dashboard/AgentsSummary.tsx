import { Link } from 'react-router-dom';
import { Users, CalendarCheck, ArrowRight } from 'lucide-react';

interface AgentsSummaryProps {
    totalAgents: number;
    agentsWithInterview: number;
}

export default function AgentsSummary({ totalAgents, agentsWithInterview }: AgentsSummaryProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-50">
                            <Users className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-brand-primary">{totalAgents}</span>
                            <span className="text-xs text-brand-text/50 ml-1.5">agentes registrados</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-brand-border" />

                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <CalendarCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-emerald-600">{agentsWithInterview}</span>
                            <span className="text-xs text-brand-text/50 ml-1.5">con entrevista agendada</span>
                        </div>
                    </div>
                </div>

                <Link
                    to="/agentes"
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors px-4 py-2 rounded-lg border border-brand-border hover:border-brand-primary/30"
                >
                    Ver todos
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}
