export interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  bar: string;
  label: string;
}

const leadNuevoConfig: StatusConfig = {
  color: 'text-blue-700',
  bg: 'bg-blue-50',
  border: 'border-blue-200',
  bar: 'bg-blue-500',
  label: 'Lead Nuevo',
};

const cerradoGanadoConfig: StatusConfig = {
  color: 'text-emerald-700',
  bg: 'bg-emerald-50',
  border: 'border-emerald-200',
  bar: 'bg-emerald-500',
  label: 'Cerrado Ganado',
};

const cerradoPerdidoConfig: StatusConfig = {
  color: 'text-slate-500',
  bg: 'bg-slate-100',
  border: 'border-slate-200',
  bar: 'bg-gray-400',
  label: 'Cerrado Perdido',
};

const contactadoConfig: StatusConfig = {
  color: 'text-violet-700',
  bg: 'bg-violet-50',
  border: 'border-violet-200',
  bar: 'bg-violet-500',
  label: 'Contactado',
};

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  'lead nuevo': leadNuevoConfig,
  // Backward-compatible aliases used by tests and legacy status values.
  'new': leadNuevoConfig,
  'contacto 1': { 
    color: 'text-emerald-800', 
    bg: 'bg-emerald-100', 
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    label: 'Contacto 1'
  },
  'contacto 2': { 
    color: 'text-yellow-800', 
    bg: 'bg-yellow-100', 
    border: 'border-yellow-200',
    bar: 'bg-yellow-500',
    label: 'Contacto 2'
  },
  'contacto 3': { 
    color: 'text-red-800', 
    bg: 'bg-red-100', 
    border: 'border-red-200',
    bar: 'bg-red-500',
    label: 'Contacto 3'
  },
  'cita agendada': { 
    color: 'text-amber-700', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    label: 'Cita Agendada'
  },
  'cita completada': { 
    color: 'text-orange-700', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200',
    bar: 'bg-orange-500',
    label: 'Cita Completada'
  },
  'propuesta': { 
    color: 'text-cyan-700', 
    bg: 'bg-cyan-50', 
    border: 'border-cyan-200',
    bar: 'bg-cyan-600',
    label: 'Propuesta'
  },
  'cerrado ganado': cerradoGanadoConfig,
  'won': cerradoGanadoConfig,
  'cerrado perdido': cerradoPerdidoConfig,
  'lost': cerradoPerdidoConfig,
  'contactado': contactadoConfig,
  'contacted': contactadoConfig,
  'nurturing': contactadoConfig,
  'calificando': { 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-200',
    bar: 'bg-indigo-500',
    label: 'Calificando'
  },
  'default': { 
    color: 'text-gray-700', 
    bg: 'bg-gray-50', 
    border: 'border-gray-200',
    bar: 'bg-gray-400',
    label: 'Desconocido'
  }
};

export const getStatusConfig = (status: string | null | undefined): StatusConfig => {
  if (!status) return STATUS_CONFIG['default'];
  
  const normalized = status.toLowerCase();
  
  // Exact match first
  if (STATUS_CONFIG[normalized]) return STATUS_CONFIG[normalized];

  // Pattern matching
  if (normalized.includes('nuevo') || normalized.includes('new')) return STATUS_CONFIG['lead nuevo'];
  if (normalized.includes('contacto 1')) return STATUS_CONFIG['contacto 1'];
  if (normalized.includes('contacto 2')) return STATUS_CONFIG['contacto 2'];
  if (normalized.includes('contacto 3')) return STATUS_CONFIG['contacto 3'];
  if (normalized.includes('cita agendada')) return STATUS_CONFIG['cita agendada'];
  if (normalized.includes('cita completada')) return STATUS_CONFIG['cita completada'];
  if (normalized.includes('propuesta')) return STATUS_CONFIG['propuesta'];
  if (normalized.includes('ganado') || normalized.includes('won') || normalized.includes('cerrado')) return STATUS_CONFIG['cerrado ganado'];
  if (normalized.includes('perdido') || normalized.includes('lost')) return STATUS_CONFIG['cerrado perdido'];
  if (normalized.includes('calificando')) return STATUS_CONFIG['calificando'];
  if (
    normalized.includes('contactado') ||
    normalized.includes('progreso') ||
    normalized.includes('progress') ||
    normalized.includes('negotiation') ||
    normalized.includes('nurturing')
  ) {
    return STATUS_CONFIG['contactado'];
  }
  
  return { ...STATUS_CONFIG['default'], label: status };
};
