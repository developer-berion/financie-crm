import { Mail, MapPin, Phone, Globe } from 'lucide-react';

interface MetricBarProps {
    phone: string;
    email: string | null;
    location: string | null;
    source: string;
}

export default function MetricBar({ phone, email, location, source }: MetricBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 text-sm text-brand-text/80 bg-gray-50/50 px-6 py-3 border-b border-brand-border/50">
            <div className="flex items-center gap-2 min-w-[140px]">
                <Phone className="w-4 h-4 text-brand-text/50" />
                <a href={`tel:${phone}`} className="hover:text-brand-primary font-medium transition-colors">
                    {phone}
                </a>
            </div>

            <div className="h-4 w-px bg-brand-border/50 hidden sm:block" />

            <div className="flex items-center gap-2 min-w-[200px]">
                <Mail className="w-4 h-4 text-brand-text/50" />
                {email ? (
                    <span className="font-medium select-all">{email}</span>
                ) : (
                    <span className="text-brand-text/40 italic">Sin email</span>
                )}
            </div>

            <div className="h-4 w-px bg-brand-border/50 hidden md:block" />

            {location && (
                <div className="flex items-center gap-2 min-w-[100px]">
                    <MapPin className="w-4 h-4 text-brand-text/50" />
                    <span className="font-medium">{location}</span>
                </div>
            )}

            <div className="h-4 w-px bg-brand-border/50 hidden md:block" />

            <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-text/50" />
                <span className="font-medium capitalize">{source}</span>
            </div>
        </div>
    );
}
