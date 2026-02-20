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
  estimated_value?: number;
  currency?: string;
  contact_attempts?: number;
  last_contact_attempt?: string;
  last_interaction_at?: string; // New field
  expected_close_date?: string | null;
  priority?: 'High' | 'Medium' | 'Low';
  billing_info?: any;
  contract_details?: Record<string, any>;
  pipeline_stages?: { name: string } | { name: string }[] | null;
}

export interface PipelineStage {
  id: string;
  name: string;
  sort_order: number;
}

export interface LeadEvent {
  id: string;
  lead_id: string | null;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  lead_name?: string;
}

export interface ConversationResult {
  id: string;
  lead_id: string;
  conversation_id: string;
  transcript: string | null;
  summary: string | null;
  outcome: unknown;
  created_at: string;
}
