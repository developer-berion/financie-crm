export interface MockLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  created_at: string;
}

const STATUSES = [
  'Nuevo',
  'En contacto automático',
  'Contactado',
  'No contactado',
  'Cita agendada',
  'Requiere seguimiento',
  'No interesado',
  'Cerrado ganado',
  'Duplicado'
];

const SOURCES = ['Meta Ads', 'Calendly', 'Directo', 'Referido'];

const NAMES = [
  'Socrates Itumay', 'Luke Cooper', 'Rony Brad', 'Sophia Khud', 'Cooper Hard',
  'Ana García', 'Carlos Rodríguez', 'Elena Martínez', 'Javier López', 'Marta Sánchez',
  'Diego Pérez', 'Laura Gómez', 'Ricardo Torres', 'Isabel Ruiz', 'Miguel Ángel',
  'Sofía Castro', 'Andrés Morales', 'Valentina Ortiz', 'Fernando Silva', 'Gabriela Vega',
  'Santiago Peña', 'Daniela Ríos', 'Mateo Luna', 'Camila Soler', 'Alejandro Cruz'
];

export const generateMockLeads = (count: number): MockLead[] => {
  return Array.from({ length: count }, (_, i) => {
    const name = NAMES[i % NAMES.length];
    const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

    return {
      id: crypto.randomUUID(),
      full_name: name + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length)}` : ''),
      email,
      phone: `+1 (555) ${100 + i}-${2000 + i}`,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      created_at: randomDate.toISOString(),
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const MOCK_LEADS = generateMockLeads(50);
