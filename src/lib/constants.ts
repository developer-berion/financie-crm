export interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  'new': { 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    label: 'Nuevo'
  },
  'contacted': { 
    color: 'text-amber-700', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200',
    label: 'Contactado'
  },
  'nurturing': { 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-200',
    label: 'Nutriendo'
  },
  'won': { 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200',
    label: 'Ganado'
  },
  'lost': { 
    color: 'text-slate-500', 
    bg: 'bg-slate-100', 
    border: 'border-slate-200',
    label: 'Perdido'
  },
  'default': { 
    color: 'text-gray-700', 
    bg: 'bg-gray-50', 
    border: 'border-gray-200',
    label: 'Desconocido'
  }
};

/**
 * Normalizes the status string to find the matching config.
 * Falls back to 'default' style but keeps original label if not found.
 */
export const getStatusConfig = (status: string | null | undefined): StatusConfig => {
  if (!status) return STATUS_CONFIG['default'];
  
  const normalized = status.toLowerCase();
  // Map common variations if needed
  if (normalized.includes('new') || normalized.includes('nuevo')) return STATUS_CONFIG['new'];
  if (normalized.includes('won') || normalized.includes('ganado') || normalized.includes('cerrado')) return STATUS_CONFIG['won'];
  if (normalized.includes('lost') || normalized.includes('perdido')) return STATUS_CONFIG['lost'];
  if (normalized.includes('contact') || normalized.includes('progres') || normalized.includes('negotiation')) return STATUS_CONFIG['contacted'];
  
  return STATUS_CONFIG[normalized] || { ...STATUS_CONFIG['default'], label: status };
};
