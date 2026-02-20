import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadQuickFilters, { type QuickFilterType } from './LeadQuickFilters';

describe('LeadQuickFilters', () => {
    it('renders all filter options', () => {
        render(<LeadQuickFilters activeFilter="all" onFilterChange={() => { }} />);

        expect(screen.getByText('Todos')).toBeInTheDocument();
        expect(screen.getByText('Nuevos')).toBeInTheDocument();
        expect(screen.getByText('Sin Leer')).toBeInTheDocument();
        expect(screen.getByText('Alto Valor')).toBeInTheDocument();
    });

    it('highlights the active filter', () => {
        render(<LeadQuickFilters activeFilter="new" onFilterChange={() => { }} />);

        const newButton = screen.getByText('Nuevos').closest('button');
        expect(newButton).toHaveClass('bg-brand-primary');
        expect(newButton).toHaveClass('text-white');

        const allButton = screen.getByText('Todos').closest('button');
        expect(allButton).not.toHaveClass('bg-brand-primary');
    });

    it('calls onFilterChange when clicked', () => {
        const handleChange = vi.fn();
        render(<LeadQuickFilters activeFilter="all" onFilterChange={handleChange} />);

        fireEvent.click(screen.getByText('Nuevos'));
        expect(handleChange).toHaveBeenCalledWith('new');
    });

    it('displays counts when provided', () => {
        const counts: Record<QuickFilterType, number> = {
            all: 10,
            new: 3,
            unread: 2,
            high_value: 5
        };
        render(<LeadQuickFilters activeFilter="all" onFilterChange={() => { }} counts={counts} />);

        expect(screen.getByText('3')).toBeInTheDocument(); // Count for New
        expect(screen.getByText('2')).toBeInTheDocument(); // Count for Unread
        expect(screen.getByText('5')).toBeInTheDocument(); // Count for High Value
    });

    it('does not display count if zero', () => {
        const counts: Record<QuickFilterType, number> = {
            all: 10,
            new: 0,
            unread: 2,
            high_value: 5
        };
        render(<LeadQuickFilters activeFilter="all" onFilterChange={() => { }} counts={counts} />);

        // Should not find a 0 count badge for "Nuevos"
        const newButton = screen.getByText('Nuevos').closest('button');
        expect(newButton).toHaveTextContent('Nuevos');
        expect(newButton).not.toHaveTextContent('0');
    });
});
