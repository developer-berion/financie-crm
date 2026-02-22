---
type: implementation_plan
feature: "Agents & System Notifications (UX/UI)"
status: "Draft"
owner: "sk_crm_web_uxui_expert_2026"
version: "1.0.0"
---

# UX/UI Detailed Implementation Guide: Agents & Notifications

## Overview
This document translates the [Detailed PM Plan](../PM/DETAILED_AGENTS_NOTIFICATIONS_PLAN.md) into specific UX/UI directives, ensuring adherence to the **Elite Enterprise UX/UI Designer** skill requirements.

**Role Context:**
- **Primary User:** Admins (Focus: Governance, Audit) & All Users (Focus: System Trust).
- **Mode:** `Mode 7: RBAC/FLS + Safe Ops UX` (Permissions) and `Mode 10: Performance/Resilience State Model` (Feedback).
- **KB References:** `KB_11` (Safe Ops), `KB_14` (Resilience), `KB_07` (A11y).

---

## 1. Clear Role Badges & Status

### 1.1 Visual Hierarchy (KB_11 - Consistency)
**Goal:** Prevent privilege confusion. An Admin user should *feel* different from a Standard user.

*   **Sidebar Profile Section:**
    *   **Layout:**
        *   Top line: Email (`text-sm font-medium text-white truncate`).
        *   Bottom line: Role Label (`text-xs uppercase tracking-wider`).
    *   **Role Styling:**
        *   **Administrator:** `text-amber-400 font-bold` (Gold). Icon: `ShieldAlert` (12px).
        *   **Agent / Standard:** `text-brand-text/50` (Gray/Blue). Icon: `User` (12px).

*   **Agent Management List (`/agentes`):**
    *   **Badge Component:**
        *   `[ADMIN]`: `bg-amber-100 text-amber-800 border-amber-200`.
        *   `[AGENT]`: `bg-slate-100 text-slate-600 border-slate-200`.
    *   **Row Styling (Inactive):**
        *   If `is_active === false`, the entire row should have `opacity-50` and `grayscale`.
        *   Badge changes to `[INACTIVE]` (`bg-red-100 text-red-800`).

### 1.2 Interactions (Safe Ops)
*   **Toggle Active/Inactive:**
    *   **Trigger:** A "Toggle Switch" component in the table row.
    *   **Confirmation (Destructive):**
        *   *Action:* Clicking "Deactivate" on an Admin.
        *   *Response:* Modal "Cannot deactivate yourself" OR "Are you sure? This blocks login immediately."

---

## 2. System Toaster (Feedback Loop)

### 2.1 Component Specifications (KB_14 - Resilience)
**Goal:** "System Trust". Users must know if their data is safe.

*   **Library:** `Sooner` (Preferred over `React-Hot-Toast` for performance/animations).
*   **Position:** `top-right` (Desktop), `top-center` (Mobile).

*   **Toast Types:**
    *   **Success:**
        *   *Icon:* `CheckCircle2` (Green).
        *   *Text:* Concise. "Guardado."
        *   *Duration:* 2000ms.
    *   **Error:**
        *   *Icon:* `XCircle` (Red).
        *   *Text:* "Error: [Short Reason]".
        *   *Action:* "Reintentar" button (if network error).
        *   *Duration:* 5000ms (Give time to read).
    *   **Loading (Optimistic):**
        *   *Icon:* `Loader2` (Spinning).
        *   *Text:* "Guardando..."
        *   *Behavior:* Replaced by Success/Error.

### 2.2 Global Error Boundary
*   **Unhandled Errors:** If the app crashes (White Screen of Death), the `ErrorBoundary` UI must be friendly:
    *   *Image:* Broken Robot / Spilled Coffee.
    *   *Text:* "Algo salió mal."
    *   *Action:* "Recargar Página" button (primary).

---

## 3. Accessibility Check (KB_07)

*   **Color Blindness:**
    *   Don't rely just on Red/Green for Status.
    *   Use Icons: `Check` for Active, `Ban` for Inactive.
    *   Text Labels must be explicit.

*   **Screen Readers:**
    *   The Toaster region must have `role="status"` or `aria-live="polite"`.
    *   The "Active/Inactive" toggle must announce state changes: "User John Doe is now Inactive."

---

## 4. Development Handoff Notes
1.  **Icons:** `ShieldAlert` (Admin), `User` (Agent), `CheckCircle2`, `XCircle`.
2.  **Z-Index:** Ensure Toasts (`z-50`) appear *above* Modals (`z-40`) and Sidebar (`z-30`).
3.  **Theme:** Ensure Toast colors match the app theme provided in `constants.ts`.

---
**Prepared by:** Expert UX/UI Designer (Antigravity)
**Date:** 2026-02-19
