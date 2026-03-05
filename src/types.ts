export interface LeadBillingInfo {
  entity_name?: string | null;
  tax_id?: string | null;
  payment_method?: string | null;
  [key: string]: unknown;
}

export interface LeadContractDetails {
  contract_signed?: 'true' | 'false';
  contract_url?: string;
  [key: string]: unknown;
}

export interface LeadPipelineStage {
  id?: string;
  name: string;
}

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
  main_objective?: string | null;
  stable_income?: string | null;
  health_condition?: string | null;
  bot_verification?: string | null;
  signup_date?: string | null;
  signup_time?: string | null;
  billing_info?: LeadBillingInfo | null;
  contract_details?: LeadContractDetails | null;
  pipeline_stages?: LeadPipelineStage | LeadPipelineStage[] | null;
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

export interface Note {
  id: string;
  lead_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  archived: boolean;
}

export interface Task {
  id: string;
  lead_id: string | null;
  type: string;
  title: string;
  due_at: string | null;
  priority: 'low' | 'med' | 'high';
  status: 'pending' | 'completed';
  assigned_to?: string | null;
  reminders_sent?: Record<'24h' | '1h', boolean | string>;
  created_at: string;
  completed_at: string | null;
  leads?: { id?: string; full_name: string } | null;
}
