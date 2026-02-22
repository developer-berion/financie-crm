---
type: implementation_plan
feature: "Dashboard Improvements"
status: "Draft"
owner: "pm_crm_enterprise"
version: "1.0.0"
---

# Detailed Implementation Plan: Dashboard Improvements

## Overview
This plan details the "Dashboard Improvements" feature set from the [Basic Implementation Plan](./IMPLEMENTATION_PLAN_BASIC.md). The goal is to transform the Dashboard from a static "read-only" view into an actionable "Command Center" for Sales Agents and Managers.

**Core Objectives:**
1.  **Actionability:** Every number must be clickable (Drill-down).
2.  **Context:** Data must be filterable by time ranges.
3.  **Focus:** Agents need a clear "My Day" view to prevent overwhelm.

---

## 1. Clickable KPIs (Drill-down)

### 1.1 Rational & User Story
*   **Rationale:** Users currently see "5 New Leads" but have to navigate manually to the Leads page and apply filters to find them. This friction increases "Time-to-Task" and risks lead neglect.
*   **User Story:** "As a Sales Agent, when I see a high number of 'New Leads', I want to click that card and land immediately on the Leads List filtered by 'Status = New', so I can start calling."

### 1.2 Detailed Acceptance Criteria
*   [ ] **Visual Feedback:** Determine if the card is interactive. If it has a link, the cursor must change to `pointer` on hover.
*   [ ] **Navigation - Total Leads:** Clicking the "Total Leads" card redirects to `/leads`.
*   [ ] **Navigation - Leads Today:** Clicking "Leads Nuevos (Hoy)" redirects to `/leads?status=new&created_at=today`.
*   [ ] **Navigation - Appointments:** Clicking "Citas (Hoy)" redirects to `/calendar?view=day&date=today` (or list view filtered).
*   [ ] **Navigation - Tasks:** Clicking "Tareas Pendientes" redirects to `/tasks?status=pending`.
*   [ ] **State Persistence:** The target page (`Leads.tsx`, etc.) must read the URL query parameters and apply the initial filter state correctly.

### 1.3 Technical Implementation
*   **Component:** `src/components/dashboard/StatCard.tsx`
    *   **Props:** Add `to?: string` (optional URL path).
    *   **Logic:** Wrap the content in a `<Link to={to}>` if the prop exists. Use `clsx/cn` to add `hover:ring-2 hover:ring-brand-primary/50 cursor-pointer` styles.
*   **Component:** `src/pages/Leads.tsx` (and others)
    *   **Logic:** Use `useSearchParams` hook.
    *   **Effect:** `useEffect` on mount to parse params like `status=new` and `created_at=today` and update the local filter state accordingly.

---

## 2. Global Date Filter

### 2.1 Rational & User Story
*   **Rationale:** The current dashboard is hardcoded to "Today/All Time" mix. Managers need to answer "How did we do last week?".
*   **User Story:** "As a Manager, I want to select 'This Month' from a dropdown so that all KPIs and charts reflect that specific period."

### 2.2 Detailed Acceptance Criteria
*   [ ] **UI Controls:** A dropdown menu in the Dashboard Header with options:
    *   Today (Hoy)
    *   Yesterday (Ayer)
    *   This Week (Esta Semana - Monday to Sunday)
    *   This Month (Este Mes - 1st to Today)
    *   Last Month (Mes Pasado - 1st to End of prev month)
*   [ ] **Default State:** Defaults to "This Month" (to show progress).
*   [ ] **Data Refresh:** Selecting an option triggers a re-fetch of:
    *   KPI Cards (Totals conform to range).
    *   Pipeline Funnel (Leads created/modified in range).
    *   Charts/Activity Feed (Filtered by range).
*   **Note:** "Pending Tasks" usually implies "All time pending", so this specific card might ignore the date filter (Global Pending), or strictly show "Tasks due in this range". *Decision: Tasks KPI remains "All Pending" for operational safety.*

### 2.3 Technical Implementation
*   **State Management:**
    *   Lift state in `src/pages/Dashboard.tsx`.
    *   `const [dateRange, setDateRange] = useState<DateRange>('this_month')`.
*   **Helper Functions:**
    *   Create `src/lib/date-utils.ts` -> `getDateRangeQuery(range: string): { start: string, end: string }`.
*   **Supabase Queries:**
    *   Update `fetchDashboardData` to accept `startDate, endDate`.
    *   Modify queries: `.gte('created_at', startDate).lte('created_at', endDate)`.

---

## 3. "My Day" Widget (Focus Mode)

### 3.1 Rational & User Story
*   **Rationale:** The Activity Feed is noisy (history). Agents need a "To-Do List" (future/present).
*   **User Story:** "As an Agent, I want a dedicated widget showing only today's calls and overdue tasks, so I don't get distracted by general noise."

### 3.2 Detailed Acceptance Criteria
*   [ ] **Content - Tasks:** Show tasks where `due_date <= today` AND `status != 'completed'`. sort by `due_date` asc (Overdue first).
*   [ ] **Content - Appointments:** Show appointments where `start_time` is Today.
*   [ ] **Action:** Each item has a "Mark Complete" or "View Lead" action.
*   [ ] **Empty State:** Friendly message "All caught up! 🎉" when empty.
*   [ ] **Visuals:** Distinct icons for Call, Meeting, Email tasks.

### 3.3 Technical Implementation
*   **New Component:** `src/components/dashboard/MyDayWidget.tsx`.
*   **Data Fetching:**
    *   Fetch `tasks`: `supabase.from('tasks').select('*').lte('due_date', todayIso).neq('status', 'completed')`.
    *   Fetch `appointments`: `supabase.from('appointments').select('*').gte('start_time', todayStart).lt('start_time', todayEnd)`.
*   **Integration:** Replace or place alongside `ActivityFeed` in `Dashboard.tsx`.

---

## 4. Risks & Verification

### 4.1 Risks
*   **Performance:** Fetching filtered data might slow down if indexes are missing on `created_at`.
    *   *Mitigation:* Verify Supabase indexes on `leads(created_at)`, `tasks(due_date)`.
*   **Confusion:** Users might think "Total Leads" with a filter "Today" means "Total DB Leads".
    *   *Mitigation:* Change label dynamically? e.g., "Total Leads (This Month)". Or keep "Total Leads" as absolute universe and only filter the "New/Won" cards.
    *   *Decision:* The "Total Leads" card should reflect the filter. If filter is "Today", it shows leads created today.

### 4.2 Verification Plan (Manual QA)
1.  **Link Test:** Click every card. Verify URL params. Verify back button works.
2.  **Date Test:** Create a lead with date `2023-01-01`. Select "This Month" (Should NOT appear). Select "All Time" (Should appear).
3.  **Task Test:** Create a task due "Tomorrow". Verify it does NOT appear in "My Day". Create a task due "Yesterday". Verify it DOES appear (Overdue).

---
**Prepared by:** Agent (Antigravity)
**Date:** 2026-02-19
