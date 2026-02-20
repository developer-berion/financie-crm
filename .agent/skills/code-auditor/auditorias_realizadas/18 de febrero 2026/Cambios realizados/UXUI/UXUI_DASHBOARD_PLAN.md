---
type: implementation_plan
feature: "Dashboard Improvements (UX/UI)"
status: "Draft"
owner: "sk_crm_web_uxui_expert_2026"
version: "1.0.0"
---

# UX/UI Detailed Implementation Guide: Dashboard Improvements

## Overview
This document translates the [Detailed PM Plan](../PM/DETAILED_DASHBOARD_PLAN.md) into specific UX/UI directives, ensuring adherence to the **Elite Enterprise UX/UI Designer** skill requirements.

**Role Context:**
- **Primary User:** Sales Agents (Focus: Speed-to-Lead, Focus Management) & Managers (Focus: Context/Trends).
- **Mode:** `Mode 11: Metrics & Instrumentation` (Dashboards) and `Mode 4: High-Frequency Userflows` (Task Actioning).
- **KB References:** `KB_08` (Metrics), `KB_14` (Performance States), `KB_05` (Context-Aware).

---

## 1. Clickable KPIs (Drill-down)

### 1.1 Interaction Design
**Goal:** Transform static metrics into actionable navigation points.

*   **Visual Affordance (KB_07 - A11y):**
    *   **Hover State:** When hovering over the `StatCard`, apply `shadow-md` and a subtle `scale-105` or `ring-2 ring-brand-primary/20`.
    *   **Cursor:** Must be `cursor-pointer`.
    *   **Focus Ring:** Keyboard tabbing must highlight the card.

*   **Navigation Pattern (KB_01 - Navigation):**
    *   **Destination:** Must open in the *same tab* (SPA navigation) to preserve app state, unless "Open in New Tab" (Ctrl+Click) is used.
    *   **Feedback:** Show a top-loader (e.g., NProgress) or skeleton on the destination page immediately.

*   **Mapping Table:**
    | Card Title | Target URL | params | Micro-Interaction |
    | :--- | :--- | :--- | :--- |
    | **Total Leads** | `/leads` | `?view=all` | Slide right transition |
    | **Leads Nuevos** | `/leads` | `?status=new&created=today` | Slide right transition |
    | **Citas (Hoy)** | `/calendar` | `?view=agenda&date=today` | Fade in transition |
    | **Tareas** | `/tasks` | `?status=pending&sort=due_date` | Slide up transition |

### 1.2 Component Specs (`StatCard.tsx`)
*   **Touch Target:** The entire card surface is the link, not just the text. ~200x120px minimum.
*   **Iconography:** Maintain the `Lucide` icons but ensure consistent stroke width (`1.5px` or `2px`) for a polished look.

---

## 2. Global Date Filter

### 2.1 Information Architecture (KB_05 - Context)
**Goal:** Provide temporal context without cluttering the UI.

*   **Placement:** Top-Right of the Dashboard Header, aligned with the Page Title ("Dashboard").
*   **Component Type:** `Select` (Dropdown) or `SegmentedControl` (if < 4 options). Since we have 5 options, use a **Dropdown**.

*   **Options & Labels:**
    *   `today`: "Hoy" (Default for Agents?) -> *PM says "This Month" default for Managers. Let's make it Role-Aware if possible, else "This Month" is safe.*
    *   `yesterday`: "Ayer"
    *   `this_week`: "Esta Semana"
    *   `this_month`: "Este Mes"
    *   `last_month`: "Mes Pasado"

### 2.2 States & Feedback (KB_14 - Performance)
*   **Loading State:** When a new date is selected:
    *   Do **NOT** blank out the whole page.
    *   Apply `opacity-50` and `animate-pulse` to the *values* inside cards and charts.
    *   Keep the structure stable (minimize Cumulative Layout Shift - CLS).
*   **Empty State:** If "Yesterday" has 0 leads:
    *   Show `0` (not `-` or null).
    *   Charts should show a flat line or "No data for this period" placeholder.

---

## 3. "My Day" Widget (Focus Mode)

### 3.1 Layout & Hierarchy (KB_02 - Density)
**Goal:** High-density, actionable list for immediate tasks.

*   **Position:** Top-Left of the main content area (below KPIs), taking 50-60% width on Desktop.
*   **Header:** "Mi Agenda de Hoy" + Badge (Count).

*   **List Item Design (Compact):**
    *   **Left:** Icon (Call/Meeting/Email) color-coded.
    *   **Middle:**
        *   Line 1: Lead Name (Bold, Link to Detail).
        *   Line 2: Task Snippet / Time (e.g., "14:00 - Demo Call").
    *   **Right:** Primary Action (e.g., "Check" circle for tasks, "Join" button for meetings).

*   **Typography:**
    *   Lead Name: `text-sm font-semibold text-gray-900`.
    *   Meta: `text-xs text-gray-500`.
    *   Overdue: `text-red-600 font-medium`.

### 3.2 Interactions (Mode 4 - High Frequency)
*   **Mark Complete:**
    *   Clicking the checkmark should apply an **Optimistic UI** update (cross out instantly, fade out after 1s). `KB_14`
    *   Undo Toast: "Tarea completada. [Deshacer]" appears for 3s.
*   **Empty State (Celebratory):**
    *   When the list is clear, show a "Mission Accomplished" illustration (SVG) with a motivating message. "Todo listo por hoy viaja seguro! 🚀".

---

## 4. Accessibility & Responsiveness Check (KB_07)

### 4.1 Mobile (Sales Agent in Field)
*   **KPIs:** Stack vertically (1 col) or 2x2 grid. Touch targets > 44px.
*   **My Day:** Must be the *first* visible widget after KPIs.
*   **Date Filter:** Native `<select>` on mobile for better OS handling, or a full-width bottom sheet.

### 4.2 Accessibility
*   **Contrast:** Ensure "Red" text for overdue tasks is `text-red-700` (4.5:1 on white), not `text-red-500`.
*   **Screen Readers:**
    *   KPI Card: `aria-label="Total leads: 15. Click to view all leads."`
    *   Date Filter: `aria-label="Filter dashboard range, currently showing This Month"`.

---

## 5. Development Handoff Notes
1.  **Icons:** Use `lucide-react`.
2.  **Colors:** Strictly use `tailwind.config.js` tokens (`brand-primary`, `text-error`). No arbitrary hex codes.
3.  **Loading:** Use the existing `Skeleton` component for the "My Day" widget while fetching.

---
**Prepared by:** Expert UX/UI Designer (Antigravity)
**Date:** 2026-02-19
