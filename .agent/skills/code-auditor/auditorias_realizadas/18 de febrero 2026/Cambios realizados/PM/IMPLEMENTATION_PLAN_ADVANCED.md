# Implementation Plan: Advanced Product Improvements (Phase 2)
**Focus:** Intelligence, Governance, and Revenue Optimization.
**Goal:** Transform the CRM into a "System of Intelligence" with predictive capabilities and enterprise-grade controls.

## 1. Dashboard Intelligence
### Pipeline Leakage Metrics
- **User Story:** "Show me where I'm losing the most leads in the funnel."
- **Tech:** Calculate conversion % between each stage pair (New -> Contact 1). Display "Drop-off Rate" chart.
- **Est:** 5h

### Agent Performance Leaderboard
- **User Story:** "Rank agents by conversion efficiency, not just volume."
- **Tech:** SQL aggregation: [(won_deals / total_assigned_leads) * 100](file:///c:/Users/victo/Berion%20Company%20Projects/financie-crm/src/App.tsx#17-57) per agent.
- **Est:** 4h

### Weighted Revenue Forecast
- **User Story:** "Predict next month's revenue based on deal probability."
- **Tech:** Add `probability` field to stages (e.g., Proposal = 60%). Sum `deal_value * probability` for open deals closing next month.
- **Est:** 3h

## 2. Smart Leads (AI & Dynamic UI)
### Dynamic Layouts (Role-Based UI)
- **User Story:** "Change the view based on the lead's stage."
- **Tech:** Create stage-specific components (e.g., `QualificationView`, `ContractView`). Render conditionally in [LeadDetail](file:///C:/Users/victo/Berion%20Company%20Projects/financie-crm/src/pages/LeadDetail.tsx#27-544).
- **Est:** 6h

### Anti-Duplicate Engine
- **User Story:** "Detect duplicate leads instantly."
- **Tech:** On lead creation/update, run fuzzy match on name/email/phone. Show alert if match > 80%.
- **Est:** 5h (Requires Supabase PgTrgm extension)

### Smart Lead Scoring
- **User Story:** "Tell me which leads are 'Hot'."
- **Tech:** Define point system (e.g., Income > 100k = +10pts, Email Opened = +5pts). Auto-update `lead_score`.
- **Est:** 6h

## 3. Pipeline Governance
### Validation Rules (Stage Gates)
- **User Story:** "Prevent moving a deal to 'Won' if the contract isn't signed."
- **Tech:** Implement `StageGate` logic. `beforeDragEnd` check: `if (dest == 'Won' && !lead.contract_signed) return false`.
- **Est:** 4h

### Multiple Pipelines
- **User Story:** "Manage 'New Business' separate from 'Renewals'."
- **Tech:** Add `pipeline_id` to `leads` and `pipelines` table. UI switcher in Kanban.
- **Est:** 8h

## 4. Enterprise Settings
### RBAC Matrix
- **User Story:** "Granularly control who can export data or delete notes."
- **Tech:** Database policies (RLS). UI for Admin to toggle permissions per role.
- **Est:** 6h

### Audit Logs (Immutable)
- **User Story:** "See exactly who changed what and when."
- **Tech:** Trigger on all tables to write to `audit_logs`. View-only UI for Admins.
- **Est:** 4h

### Commission Calculator
- **User Story:** "Estimate commissions for approved deals."
- **Tech:** `CommissionRule` table (e.g., flat 10%, tiered). Calculation engine run on 'Closed Won'.
- **Est:** 5h

---

**Total Estimated Effort:** ~56 hours (7-8 Days)
