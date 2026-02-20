export interface StageGateRule {
  stageName: string;
  requiredFields: string[];
  explanation: string;
}

// Map stage generic names to their required fields
export const STAGE_GATES: Record<string, StageGateRule> = {
  'Propuesta': {
    stageName: 'Propuesta',
    requiredFields: ['estimated_value'],
    explanation: 'Para mover un lead a Propuesta, debe tener un valor estimado mayor a 0.'
  },
  'Cerrado Ganado': {
    stageName: 'Cerrado Ganado',
    requiredFields: ['contract_signed', 'contract_url'],
    explanation: 'Para ganar un lead, debe tener el contrato firmado y el enlace al documento (PDF).'
  }
};

/**
 * Checks a lead object against the frontend stage gates.
 * Returns an array of missing string field keys, or an empty array if valid.
 */
export function validateLeadStageGate(lead: any, targetStageName: string): string[] {
  const rule = STAGE_GATES[targetStageName];
  if (!rule) return []; // No rules for this stage

  const missingFields: string[] = [];

  for (const field of rule.requiredFields) {
    if (field === 'estimated_value') {
      if (!lead.estimated_value || lead.estimated_value <= 0) {
        missingFields.push(field);
      }
    } else if (field === 'contract_signed') {
      if (!lead.contract_details?.contract_signed || lead.contract_details.contract_signed !== 'true') {
        missingFields.push(field);
      }
    } else if (field === 'contract_url') {
      if (!lead.contract_details?.contract_url || lead.contract_details.contract_url.trim() === '') {
        missingFields.push(field);
      }
    }
  }

  return missingFields;
}
