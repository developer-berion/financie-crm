---
type: implementation_plan
feature: "Pipeline (Kanban) Improvements (UX/UI)"
status: "Draft"
owner: "sk_crm_web_uxui_expert_2026"
version: "1.0.0"
---

# UX/UI Detailed Implementation Guide: Pipeline (Kanban)

## Overview
This document translates the [Detailed PM Plan](../PM/DETAILED_PIPELINE_PLAN.md) into specific UX/UI directives, ensuring adherence to the **Elite Enterprise UX/UI Designer** skill requirements.

**Role Context:**
- **Primary User:** Sales Managers (Focus: Velocity, Revenue) & Agents (Focus: Moving Deals).
- **Mode:** `Mode 2: Record Page Design` (Card Density), `Mode 4: High-Frequency Userflows` (Drag & Drop), `Mode 7: RBAC/FLS + Safe Ops UX` (Lost Reason).
- **KB References:** `KB_02` (Card Design), `KB_04` (Modals), `KB_14` (Optimistic UI).

---

## 1. Stagnation Alerts (Visual Rot)

### 1.1 Visual Signal (KB_02 - Density)
**Goal:** Highlight stuck deals without cluttering the board with "Noise".

*   **The "Rotting" State (> 10 days in stage):**
    *   **Border:** Add a `border-l-4 border-red-500` (Left border is cleaner than full border for cards) OR a subtle `bg-red-50` tint. *Decision: Use Left Border + localized Warning Icon.*
    *   **Icon:** `AlertTriangle` (Lucide) in `text-red-500` size `14px`, placed next to the "Days in Stage" counter.
    *   **Tooltip:** Hovering the icon shows: "Estancado: 12 días en esta etapa. (Límite: 10)".

*   **Card Metadata:**
    *   Add a specific row for "Time in Stage".
    *   *Normal:* `text-gray-400 text-xs` -> "3d".
    *   *Stagnant:* `text-red-600 text-xs font-bold` -> "12d".

### 1.2 Interaction
*   **Filter:** Allow managers to toggle "Show Only Stagnant" to focus review meetings. (Future scope, but UI should support it).

---

## 2. Total Pipeline Value Headers

### 2.1 Hierarchy & Typography (KB_05 - Context)
**Goal:** Money is the most important number.

*   **Layout:**
    *   **Top (Primary):** Stage Name (`text-sm font-semibold text-gray-700 uppercase tracking-wider`).
    *   **Middle (Hero):** Total Value (`text-lg font-black text-emerald-700 tracking-tight`).
        *   *Format:* `$1.2M` or `$125k` (Compact currency).
    *   **Right/Badge:** Deal Count (`bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs`).

*   **Visual Enhancements:**
    *   **Progress Bar:** Keep the thin color bar at the bottom of the header, corresponding to the Stage Color (Blue -> Yellow -> Green).

### 2.2 Micro-Interactions (KB_14 - Optimistic)
*   **Drag Update:**
    *   When a card ($10k) is lifted: Source column total subtracts $10k (opacity 0.5?).
    *   When hovering Target: Target column total adds $10k (green flash?).
    *   *Constraint:* If strict optimistic math is hard, ensure it updates *instantly* on Drop.

---

## 3. Lost Reason Modal (Governance)

### 3.1 Interaction Flow (Mode 7 - Safe Ops)
**Goal:** Friction is intentional here. Make them think.

*   **Trigger:** Drop event on "Lost" column.
*   **Modal (KB_04):**
    *   **Title:** "¿Por qué se perdió este trato?"
    *   **Type:** Small/Medium Modal (not full screen).
    *   **Autofocus:** Focus on the "Reason" dropdown.
    *   **Content:**
        *   **Reason (Required):** Select (Price, Competitor, Ghosted, Not Qualified).
        *   **Competitor (Conditional):** If "Competitor" selected, show input "Overlapping text".
        *   **Notes (Optional):** Textarea.
    *   **Actions:**
        *   `Cancel` (Secondary): Reverts drug. Card flies back.
        *   `Confirm Lost` (Destructive/Primary): Red button. "Marcar como Perdido".

### 3.2 Feedback
*   **Success:** Toast "Lead marcado como Perdido. Razón: Precio."
*   **Undo:** "Deshacer" action in the toast moves it back to the previous stage and clears the reason.

---

## 4. Development Handoff Notes
1.  **Icons:** `AlertTriangle` (Rotting), `Ghost` (Lost Reason?).
2.  **Colors:**
    *   Use `text-emerald-700` for money, never plain green.
    *   Stagnation is `red-500`, not orange. urgency required.
3.  **Animation:** Use `framer-motion` or CSS transitions for the "Snap back" effect if the modal is cancelled.

---
**Prepared by:** Expert UX/UI Designer (Antigravity)
**Date:** 2026-02-19
