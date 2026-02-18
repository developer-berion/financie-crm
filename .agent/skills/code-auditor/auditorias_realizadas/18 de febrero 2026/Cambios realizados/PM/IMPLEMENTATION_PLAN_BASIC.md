# Implementation Plan: Basic Product Improvements (Phase 1)
**Focus:** Operational Hygiene, Usability, and "Quick Wins".
**Goal:** Reduce click fatigue and increase visibility without complex architectural changes.

## 1. Dashboard Improvements
### Clickable KPIs
- **User Story:** "As a user, when I click '5 New Leads', I want to see a list of those 5 leads."
- **Tech:** Update `Dashboard.tsx` to link to `/leads?status=new`.
- **Est:** 2h

### Global Date Filter
- **User Story:** "As a user, I want to filter dashboard metrics by 'This Week' or 'Last Month'."
- **Tech:** Add `DateRangePicker` component to [Layout.tsx](file:///c:/Users/victo/Berion%20Company%20Projects/financie-crm/src/components/Layout.tsx) context. Pass date range to KPI queries.
- **Est:** 4h

### My Day Widget
- **User Story:** "As an agent, I want to see my overdue tasks and today's appointments in one place."
- **Tech:** Create `MyDayWidget.tsx` component. Fetch tasks where `due_date <= today` and status != completed.
- **Est:** 4h

## 2. Leads Module
### Status Color Coding
- **User Story:** "I want to see the same status colors in the list as in the pipeline."
- **Tech:** Centralize `statusColorMap` in [utils.ts](file:///c:/Users/victo/Berion%20Company%20Projects/financie-crm/supabase/functions/shared-utils.ts) and apply to [LeadTable](file:///c:/Users/victo/Berion%20Company%20Projects/financie-crm/src/components/LeadTable.tsx#14-245) and [LeadDetail](file:///C:/Users/victo/Berion%20Company%20Projects/financie-crm/src/pages/LeadDetail.tsx#27-544).
- **Est:** 1h

### Quick Filters
- **User Story:** "I want one-click access to 'Unread' or 'High Value' leads."
- **Tech:** Add pill buttons above [LeadTable](file:///c:/Users/victo/Berion%20Company%20Projects/financie-crm/src/components/LeadTable.tsx#14-245).
- **Est:** 2h

### Last Interaction Column
- **User Story:** "I need to see how many days since I last spoke to a lead."
- **Tech:** Compute `daysSinceLastInteraction` from `lead_events` (latest event timestamp). Add column to table.
- **Est:** 3h

## 3. Pipeline (Kanban)
### Stagnation Alerts
- **User Story:** "Highlight deals that haven't moved in 10 days."
- **Tech:** Compare `current_date` vs `stage_changed_at`. Apply red border style if > threshold.
- **Est:** 2h

### Total Value Headers
- **User Story:** "See the total potential revenue for each pipeline stage."
- **Tech:** `reduce` operation on leads in each Kanban column to sum `deal_value`. Display in header.
- **Est:** 1h

### Lost Reason Modal
- **User Story:** "Force me to explain why a deal was lost."
- **Tech:** Intercept `onDragEnd` when dest is "Closed Lost". Open `LostReasonModal`. Save to `lead_metadata`.
- **Est:** 4h

## 4. Agents & System
### Agent Roles & Status
- **User Story:** "Distinguish Admins from Agents and deactivate users."
- **Tech:** Add `role` badge in User List. Add `is_active` toggle (soft delete logic).
- **Est:** 3h

### System Notifications (Toaster)
- **User Story:** "Get feedback when actions succeed or fail."
- **Tech:** Implement `react-hot-toast` for global notifications (e.g., "Lead Saved", "Sync Failed").
- **Est:** 2h

---

**Total Estimated Effort:** ~28 hours (3-4 Days)
