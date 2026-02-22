import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs() {
    return (
        <nav className="flex items-center text-sm" aria-label="Breadcrumb">
            <Link to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                Inicio
            </Link>
            <ChevronRight className="mx-2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="font-medium text-gray-900">Leads</span>
        </nav>
    );
}
