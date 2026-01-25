export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: string;
  meta_lead_id: string | null;
  status: string;
  stage_id: string | null;
  do_not_call: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
  state?: string;
  terms_accepted?: boolean;
  meta_created_at?: string;
  message_status?: 'recibido' | 'no_enviado' | 'no_recibido';
  call_status?: 'exitosa' | 'rechazada' | 'sin_respuesta';
}

export interface PipelineStage {
  id: string;
  name: string;
  sort_order: number;
}
