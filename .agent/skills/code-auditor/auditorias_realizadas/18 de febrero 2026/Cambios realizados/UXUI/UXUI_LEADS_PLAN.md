---
type: implementation_plan
feature: "Leads Module Improvements (UX/UI)"
status: "Draft"
owner: "sk_crm_web_uxui_expert_2026"
version: "1.0.0"
---

# UX/UI Detailed Implementation Guide: Leads Module

## Overview
This document translates the [Detailed PM Plan](../PM/DETAILED_LEADS_PLAN.md) into specific UX/UI directives, ensuring adherence to the **Elite Enterprise UX/UI Designer** skill requirements.

**Role Context:**
- **Primary User:** Sales Agents (Focus: High-Frequency Lists, Grading) & Managers (Focus: Neglect Detection).
- **Mode:** `Mode 3: Tables & List Views Design` (Density, Quick Actions) and `Mode 6: Forms & Data Quality Governance` (Hygiene).
- **KB References:** `KB_03` (Enterprise Lists), `KB_11` (Role Based UI), `KB_13` (Data Governance).

---

## 1. Unified Status Color Coding

### 1.1 Visual System (KB_11 - Consistency)
**Goal:** Reduce cognitive load. "Blue" must always mean "New" across Table, Kanban, and Detail.

*   **Color Semantics (Tailwind):**
    *   **New / Unassigned:** `bg-blue-50 text-blue-700 border-blue-200`. (Neutral-ish but active).
    *   **In Progress / Contacted:** `bg-amber-50 text-amber-700 border-amber-200`. (Warning/Attention needed).
    *   **Nurturing:** `bg-indigo-50 text-indigo-700 border-indigo-200`. (Cold but kept separate).
    *   **Won / Closed Won:** `bg-emerald-50 text-emerald-700 border-emerald-200`. (Success).
    *   **Lost / Disqualified:** `bg-slate-100 text-slate-500 border-slate-200`. (De-emphasized).

*   **Component Application:**
    *   **Table Pill:** Small, rounded-full, `text-xs font-bold px-2.5 py-0.5`.
    *   **Kanban Header:** Full-width top border `border-t-4` + Background tint `bg-opacity-30`.
    *   **Detail Badge:** Large, `text-sm font-bold px-3 py-1`, beside the Lead Name.

### 1.2 Accessibilty (KB_07)
*   **Contrast:** All text colors (e.g., `text-blue-700`) must pass WCAG AA (4.5:1) against their background (`bg-blue-50`).
*   **Shape:** Do not rely *only* on color. Ensure the **Text Label** is always present and legible.

---

## 2. Quick Filters (Pills)

### 2.1 Interaction Design (Mode 3 - List Views)
**Goal:** One-click segmentation for high-velocity work.

*   **Placement:** Immediately above the Table, below the main page header.
*   **Component:** `ScrollArea` (horizontal) with specific "Pill" buttons.

*   **Visual States:**
    *   **Default (Inactive):** `bg-white border border-gray-200 text-gray-600 hover:bg-gray-50`.
    *   **Active (Selected):** `bg-brand-primary text-white border-brand-primary shadow-sm`.
    *   **Count Badge:** Each pill should ideally show a count, e.g., "Nuevos (5)". *If performance allows.*

*   **List of Pills:**
    1.  **Todos** (Default)
    2.  **Nuevos** (Status = New) -> *Icon: Sparkles*
    3.  **Sin Leer** (Unread / No Interaction) -> *Icon: Bell*
    4.  **Alto Valor** (> $5k) -> *Icon: Banknote/TrendingUp*

### 2.2 Micro-Interactions
*   **Click:** Instant "Active" state toggle.
*   **Loading:** The table should show a "Shimmer/Skeleton" on the rows, not a full page spinner, to maintain context.

---

## 3. "Last Interaction" & Neglect Warning

### 3.1 Data Presentation (KB_13 - Data Hygiene)
**Goal:** Shame the user (gently) into actioning neglected leads.

*   **Column Design:**
    *   Header: "Último Contacto".
    *   Content: Relative time (`date-fns/formatDistanceToNow`).
    *   Format: "Hace 2h", "Hace 3d".

*   **Neglect Logic (The "Red" Flag):**
    *   **Rule:** If `> 7 days` AND Status is NOT "Won/Lost".
    *   **Visual:**
        *   Text: `text-red-700 font-bold`.
        *   Icon: Add a small `AlertCircle` icon (14px) to the left of the text.
        *   Tooltip: "Sin interacción por más de 7 días. ¡Actúa!".

*   **Sorting:**
    *   Default sort should probably be `Last Interaction (Asc)` (Oldest interaction first) for "Clean up" mode, or `Created (Desc)` for "Newest" mode. Provide the sort arrow.

### 3.2 Mobile Responsiveness (Mode 5 - Context)
*   **Phone View:**
    *   The table likely collapses to cards.
    *   The "Last Interaction" must remain visible, perhaps in the top-right corner of the mobile card:
        *   *Normal:* Gray timestamp.
        *   *Neglected:* Red badged timestamp `bg-red-50 text-red-700`.

---

## 4. Development Handoff Notes
1.  **Constants:** Ensure `STATUS_CONFIG` in `src/lib/constants.ts` includes both the colors AND the official display names.
2.  **Icons:** Use `Lucide` icons for the Quick Filters (`Sparkles`, `Bell`, `Banknote`).
3.  **Skeleton:** Ensure the `LeadTable` skeleton matches the new column structure.

---
**Prepared by:** Expert UX/UI Designer (Antigravity)
**Date:** 2026-02-19
