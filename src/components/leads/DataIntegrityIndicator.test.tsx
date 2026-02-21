import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataIntegrityIndicator } from './DataIntegrityIndicator';

describe('DataIntegrityIndicator', () => {
    it('shows "Verificación Offline" when there is an error', () => {
        render(
            <DataIntegrityIndicator
                isChecking={false}
                hasDuplicates={false}
                highestConfidence={0}
                error={new Error('RPC not found')}
            />
        );
        expect(screen.getByText('Verificación Offline')).toBeInTheDocument();
    });

    it('shows "Datos Limpios" when no duplicates and no errors', () => {
        render(
            <DataIntegrityIndicator
                isChecking={false}
                hasDuplicates={false}
                highestConfidence={0}
                error={null}
            />
        );
        expect(screen.getByText('Datos Limpios')).toBeInTheDocument();
    });
});
