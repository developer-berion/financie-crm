---
type: implementation_plan
feature: "Leads Module Improvements"
status: "Draft"
owner: "pm_crm_enterprise"
version: "1.0.0"
---

# Detailed Implementation Plan: Leads Module Improvements

## Overview
This plan details the "Leads Module" feature set from the [Basic Implementation Plan](./IMPLEMENTATION_PLAN_BASIC.md). The goal is to improve data visibility, consistency, and "Speed-to-Lead" for agents handling high volumes of data.

**Core Objectives:**
1.  **Consistency:** Unified color coding for statuses across the entire app.
2.  **Efficiency:** One-click filtering for common operational lists.
3.  **Retention:** Visual indicators for neglected leads to prevent churn.

---

## 1. Unified Status Color Coding

### 1.1 Rationale & User Story
*   **Rationale:** Currently, status colors (badges/borders) are hardcoded in `LeadTable.tsx` using `if/else` logic. This is brittle and inconsistent if we add a Kanban board or Detail view.
*   **User Story:** "As a User, I want 'New' leads to always look the same (e.g., Blue) whether I am in the Table, Kanban, or Lead Detail, so my brain recognizes the status instantly without reading text."

### 1.2 Detailed Acceptance Criteria
*   [ ] **Single Source of Truth:** A centralized constant object maps Status Names (normalized) to Color Styles (Tailwind classes).
*   [ ] **Coverage:**
    *   `src/components/LeadTable.tsx` uses this constant for Row Borders and Status Pills.
    *   `src/components/KanbanBoard.tsx` (if exists or future) uses this for Column Headers.
    *   `src/components/LeadDetailHeader.tsx` uses this for the main status badge.
*   **Colors defined:**
    *   New/Unassigned: Blue
    *   Contacted (1-3): Yellow/Orange range
    *   Won/Sale: Emerald/Green
    *   Lost/Discarded: Gray/Slate
    *   Nurturing: Indigo/Purple

### 1.3 Technical Implementation
*   **New File:** `src/lib/constants.ts`
    ```typescript
    export const STATUS_CONFIG: Record<string, { color: string, bg: string, border: string }> = {
      'new': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
      'won': { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
      // ... default fallback included
    };
    export const getStatusColor = (status: string) => { ... } // Helper to normalize input
    ```
*   **Refactor:**
    *   Modify `LeadTable.tsx` to remove `getStageBadgeStyle` and `getRowBorderColor` local functions.
    *   Import `getStatusColor` from constants.

---

## 2. Quick Filters (Pills)

### 2.1 Rationale & User Story
*   **Rationale:** Selecting filters from a dropdown takes 3+ clicks. Operational views (Unread, New) are accessed dozens of times a day.
*   **User Story:** "As an Agent, I want a row of 'Pill' buttons above the lead list so I can switch between 'All', 'New', 'Unread', and 'High Value' leads with a single click."

### 2.2 Detailed Acceptance Criteria
*   [ ] **UI Component:** A horizontal scrollable list of pills above the Table.
*   [ ] **States:**
    *   **Inactive:** Gray border, gray text.
    *   **Active:** Primary color background, white text.
*   **Filter Logic:**
    *   **Todos (All):** Clears specific filters.
    *   **Nuevos (New):** `status = 'new'` (or stage name equivalent).
    *   **Sin Leer (Unread):** `is_read = false` (requires `is_read` column check/add).
    *   **Alto Valor (>5k):** `estimated_value > 5000`.
*   [ ] **Interaction:** Clicking a pill updates the Supabase query parameters immediately.

### 2.3 Technical Implementation
*   **Component:** `src/components/LeadFilters.tsx` (Enhance or create new `QuickFilterBar.tsx`).
*   **State:**
    *   Parent Page (`Leads.tsx`) manages `activeFilter` string state.
    *   Passes `currentFilter` and `onFilterChange` to the component.
*   **Database:**
    *   Check for `is_read` column on `leads`. If missing, add migration or use alternative logic (e.g., `last_interaction_at IS NULL`). *Decision: Use 'New' status as proxy for unread if column absent, or add it.*

---

## 3. "Last Interaction" & Neglect Warning

### 3.1 Rationale & User Story
*   **Rationale:** A lead created 3 months ago but called *yesterday* is "Alive". A lead created yesterday but ignored is "Rotting". Creation date is insufficient.
*   **User Story:** "As a Manager, I want to see a column 'Last Touch' showing the time since the last event (Call, Manual Note, Meeting), so I can spot leads that are being ignored."

### 3.2 Detailed Acceptance Criteria
*   [ ] **Data Field:** New column/value available: `last_interaction_at`.
*   [ ] **Visuals - Table:**
    *   New Column "Último Contacto".
    *   Displays relative time: "2h", "1d", "3d".
*   [ ] **Logic - Neglect:**
    *   If `last_interaction_at` > 7 days ago (configurable), text turns **Red** and bold.
    *   If `last_interaction_at` is NULL (never touched), treats as "Since Creation".
*   [ ] **Sorting:** Users can sort by this column to find the "Most Neglected" (Oldest interaction first).

### 3.3 Technical Implementation
*   **Database Schema:**
    *   `ALTER TABLE leads ADD COLUMN last_interaction_at TIMESTAMPTZ;`
    *   **Trigger:** Create a Postgres Trigger on `lead_events`:
        ```sql
        CREATE TRIGGER update_lead_interaction
        AFTER INSERT ON lead_events
        FOR EACH ROW EXECUTE FUNCTION update_last_interaction_timestamp();
        ```
*   **Backfill:**
    *   One-time query to populate `last_interaction_at` from `MAX(created_at)` of existing `lead_events`.
*   **Frontend:**
    *   Update `Lead` interface in `types.ts`.
    *   Add column to `LeadTable.tsx`.
    *   Use `date-fns` -> `formatDistanceToNow` for display.

---

## 4. Risks & Verification

### 4.1 Risks
*   **Performance:** Trigger overhead on high-volume event inserts.
    *   *Mitigation:* The trigger is simple (update by ID). Minimal impact expected for <1M rows.
*   **Data Integrity:** "System" events (e.g., automated syncing) might update `last_interaction_at` falsely making a lead look "worked" when no human touched it.
    *   *Mitigation:* Filter the trigger to only fire on specific `event_type`s (call, meeting, note) and exclude 'system_sync' if necessary. *Phase 1: Include all events.*

### 4.2 Verification Plan
1.  **Color Test:** Change a lead's stage. Verify the color updates instantly in the table.
2.  **Filter Test:** Click "Alto Valor". Verify only leads >$5k appear.
3.  **Interaction Test:** Add a manual note to a lead. Verify `last_interaction_at` updates to "Just now". Wait 1 minute. Verify "1m ago".

---
**Prepared by:** Agent (Antigravity)
**Date:** 2026-02-19
