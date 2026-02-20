# Implementation Plan: Basic Product Improvements (Phase 1)

**Version:** 2.0 (Detailed) **Role:** Product Manager Enterprise (pm_crm_enterprise) **Focus:** Operational Hygiene, Usability, and "Quick Wins". **Goal:** Reduce click fatigue (Time-to-Task) and increase Visibility (No "Black Holes" for leads).

---

## 1. Dashboard Improvements

### 1.1 Clickable KPIs (Drill-down)

**Rationale:** A KPI without drill-down is a vanity metric. If I see "5 New Leads", I need to action them immediately (Speed-to-Lead). **User Story:** "As a Sales Agent, when I click on the 'New Leads' card, I want to be taken directly to the Lead List filtered by 'Status = New', so I can start dialing." **Acceptance Criteria:**

* [ ] Clicking "Total Leads" -> redirects to `/leads` (All).
* [ ] Clicking "Leads Nuevos (Hoy)" -> redirects to `/leads?status=new&created_at=today`.
* [ ] Cursor changes to pointer on hover. **Tech Specs:**

* **Component:**

  src/pages/Dashboard.tsx
* **Action:** Wrap `MetricCard` in `Link` or `useNavigate`.
* **Route:** Ensure

  Leads.tsx parses query params (`useSearchParams`) to set initial filter state.

### 1.2 Global Date Filter

**Rationale:** Context is key. "5 Leads" means nothing if I don't know if it's today or this year. **User Story:** "As a Manager, I want to toggle the entire dashboard between 'Today', 'This Week', and 'This Month' to understand current performance vs trends." **Acceptance Criteria:**

* [ ] Dropdown in Dashboard Header: [Today, Yesterday, This Week, This Month, Last Month].
* [ ] Default selection: "This Month".
* [ ] All KPI cards and Charts reload data based on selected range. **Tech Specs:**

* **State:** Lift state to `DashboardContext` or local state in `Dashboard.tsx`.
* **Query:** Update Supabase queries to accept `startDate` and `endDate` parameters.
* **Ref:** `KB_08#Metrics` (Contextual Analytics).

### 1.3 "My Day" Widget (Focus Mode)

**Rationale:** Agents get overwhelmed. They need a single list of "What do I do RIGHT NOW?" to prevent paralysis. **User Story:** "As an Agent, I want a widget showing only Overdue Tasks and Today's Appointments, so I don't miss commitments." **Acceptance Criteria:**

* [ ] Display list of Tasks where `due_date <= today` AND `status != 'completed'`.
* [ ] Display list of Appointments (`lead_events` type='meeting') where `start_time` is Today.
* [ ] "Mark Complete" button directly in the widget. **Tech Specs:**

* **New Component:** `src/components/dashboard/MyDayWidget.tsx`.
* **Query:** `from('tasks').select('*').lte('due_date', today)`.

---

## 2. Leads Module

### 2.1 Unified Status Color Coding

**Rationale:** Cognitive load reduction. "Green" must always mean "Won" and "Red" always "Lost" across the entire app. **User Story:** "As a user, I want the status 'New' to be Blue in the Table, Kanban, and Detail View, so I can scan quickly." **Acceptance Criteria:**

* [ ] Define single source of truth for colors.
* [ ] Apply to Lead Table Status Pill.
* [ ] Apply to Kanban Column Headers.
* [ ] Apply to Lead Detail Header Badge. **Tech Specs:**

* **File:** `src/lib/constants.ts` -> `export const STATUS_COLORS = { 'new': 'bg-blue-500', ... }`.
* **Ref:** `KB_11#RoleBasedUI` (Consistency).

### 2.2 Quick Filters (Pills)

**Rationale:** Dropdowns are slow (2 clicks). Common actions should be 1 click. **User Story:** "As an Agent, I want one-click buttons for 'Unread' and 'High Value' leads above the table." **Acceptance Criteria:**

* [ ] Row of pill buttons above the table: [All, New, Unread, High Value (>5k)].
* [ ] Active pill highlights visually.
* [ ] "High Value" logic: `deal_value > 5000` (configurable). **Tech Specs:**

* **Component:**

  src/components/LeadTable.tsx.
* **Logic:** Quick filters append/replace current Supabase filter criteria.

### 2.3 "Last Interaction" & Neglect Warning

**Rationale:** Churn prevention. Leads rot when ignored. **User Story:** "As a Manager, I want to see 'Days Since Last Touch' and sort by it, to find neglected leads." **Acceptance Criteria:**

* [ ] New Column: "Last Touch".
* [ ] Value: `Today - MAX(lead_events.created_at)`.
* [ ] Formatting: "2h ago", "3d ago".
* [ ] Color: Red text if > 7 days. **Tech Specs:**

* **DB:** Create SQL function or use Edge Function to compute this efficiently (avoid N+1).
* **Ref:** `KB_13#DataHygiene`.

---

## 3. Pipeline (Kanban)

### 3.1 Stagnation Alerts (Visual Rot)

**Rationale:** Velocity is everything. If a deal sits in "Proposal" for 30 days, it's likely dead. **User Story:** "As a user, I want deals stagnant for >10 days to have a red border, prompting me to act or close them." **Acceptance Criteria:**

* [ ] Configurable threshold (default 10 days).
* [ ] Visual indicator: Red border or "Stagnant" icon on the card.
* [ ] Tooltip: "In this stage for X days". **Tech Specs:**

* **Logic:** `daysInStage = today - lead.stage_updated_at`.
* **Ref:** `KB_12#Lifecycle` (Drift Prevention).

### 3.2 Total Pipeline Value Headers

**Rationale:** Revenue visibility. "Contact" stage might have 100 leads but $0 value. I need to focus on $$$. **User Story:** "As a Manager, I want to see the total sum of deal values at the top of each column." **Acceptance Criteria:**

* [ ] Header displays: "Stage Name (Count) - $Total".
* [ ] Formatted currency (e.g., "$150,000").
* [ ] Updates dynamically when filters change. **Tech Specs:**

* **Calculation:** Client-side aggregation of fetched leads per column.

### 3.3 Lost Reason Modal (Governance)

**Rationale:** You can't fix what you don't measure. "Closed Lost" without a reason is useless data. **User Story:** "As a Manager, I want to force agents to select a reason when losing a deal." **Acceptance Criteria:**

* [ ] Dragging to "Closed Lost" triggers Modal.
* [ ] Dropdown: [Price, Competitor, Ghosted, Not Qualified, Other].
* [ ] Optional "Notes" text area.
* [ ] Block status change if modal is cancelled. **Tech Specs:**

* **Component:** `LostReasonModal.tsx`.
* **Storage:** Metadata field in `leads` table or separate `lead_loss_reasons` table.
* **Ref:** `KB_13#DataQuality` (Completeness).

---

## 4. Agents & System Notifications

### 4.1 Clear Role Badges & Status

**Rationale:** Security. It must be obvious who is an Admin. **User Story:** "As an Admin, I want to see clearly who has elevated privileges." **Acceptance Criteria:**

* [ ] "ADMIN" badge (Red/Gold) next to user name in Agent list.
* [ ] "Active/Inactive" toggle. Inactive prevents login immediately. **Tech Specs:**

* **DB:** `profiles.role` enum ('admin', 'agent'). `profiles.is_active` boolean.
* **Ref:** `KB_04#RBAC`.

### 4.2 System Toaster (Feedback Loop)

**Rationale:** Usability. Users need confirmation that their action (Save, Delete, Sync) worked. **User Story:** "As a user, I want a popup notification when I save a lead or if an error occurs." **Acceptance Criteria:**

* [ ] Success: Green toast "Lead Saved".
* [ ] Error: Red toast "Failed to save: [Reason]". **Tech Specs:**

* **Lib:** `react-hot-toast` (Lightweight, customizable).
* **Placement:** Top-right or Bottom-right.

---

**Total Estimated Effort:** ~28 hours **Priority Order:** Dashboard Drill-down -> Pipeline Stagnation -> Lost Reason Governance.
