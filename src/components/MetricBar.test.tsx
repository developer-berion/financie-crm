import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentProps } from 'react';
import MetricBar from './MetricBar';

describe('MetricBar', () => {
    const renderWithRouter = (props: ComponentProps<typeof MetricBar>) => {
        return render(
            <MemoryRouter>
                <MetricBar {...props} />
            </MemoryRouter>
        );
    };

    it('renders phone number with tel: link', () => {
        renderWithRouter({
            phone: '+1 (786) 555-1234',
            email: 'test@example.com',
            location: 'FL',
            source: 'Meta Ads'
        });
        expect(screen.getByText('+1 (786) 555-1234')).toBeInTheDocument();
    });
});
