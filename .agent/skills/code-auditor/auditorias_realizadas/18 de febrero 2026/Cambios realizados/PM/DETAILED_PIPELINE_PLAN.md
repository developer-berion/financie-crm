---
type: implementation_plan
feature: "Pipeline (Kanban) Improvements"
status: "Draft"
owner: "pm_crm_enterprise"
version: "1.0.0"
---

# Detailed Implementation Plan: Pipeline (Kanban) Improvements

## Overview
This plan details the "Pipeline (Kanban)" feature set from the [Basic Implementation Plan](./IMPLEMENTATION_PLAN_BASIC.md). The goal is to turn the Kanban board from a simple drag-and-drop interface into a tool for **Velocity** and **Revenue Management**.

**Core Objectives:**
1.  **Velocity:** Visually highlight deals that are stuck (Stagnation Alerts).
2.  **Revenue Focus:** Prioritize financial visibility in headers.
3.  **Governance:** Enforce data quality when deals are lost (Lost Reason).

---

## 1. Stagnation Alerts (Visual Rot)

### 1.1 Rationale & User Story
*   **Rationale:** A deal often sits in "Proposal" for weeks while the agent updates unrelated fields (email, phone), resetting the `updated_at` timestamp. This hides the fact that the *deal stage* hasn't progressed.
*   **User Story:** "As a Sales Manager, I want to instantly see which deals have been stuck in the same stage for more than 10 days, so I can intervene."

### 1.2 Detailed Acceptance Criteria
*   [ ] **Data Point:** Utilize a specific `stage_updated_at` timestamp, which only updates when `stage_id` changes.
*   [ ] **Visual Indicator:**
    *   **Border:** Solid Red Border (`border-red-400 border-2`) for stagnant cards.
    *   **Icon:** A small "Warning" icon or "Cobweb" icon in the card header.
    *   **Tooltip:** Hovering the indicator shows: "En esta etapa por X días".
*   [ ] **Threshold:** Configurable per stage? For now, global default > 10 days.

### 1.3 Technical Implementation
*   **Database:**
    *   `ALTER TABLE leads ADD COLUMN stage_updated_at TIMESTAMPTZ DEFAULT NOW();`
    *   **Trigger:** Update the `handleDragEnd` logic in `Pipeline.tsx` (or a DB trigger) to set `stage_updated_at = NOW()` *only* when `stage_id` changes.
    *   *Recommendation:* Use a DB Trigger `before update` on `leads`: `IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN NEW.stage_updated_at = NOW(); END IF;`
*   **Frontend type:** Update `Lead` in `types.ts` to include `stage_updated_at`.
*   **Component:** `src/components/pipeline/DealCard.tsx`
    *   Logic: `const daysInStage = differenceInDays(now, lead.stage_updated_at || lead.created_at);`
    *   Style: `clsx(daysInStage > 10 && "border-red-400 border-2")`.

---

## 2. Total Pipeline Value Headers

### 2.1 Rationale & User Story
*   **Rationale:** "10 Leads" in Negotiation could mean $10k or $10M. Quantity is vanity; Revenue is sanity.
*   **User Story:** "As a Manager, I want to see the Total Potential Value ($) at the top of every column, so I know where to focus my team's energy."

### 2.2 Detailed Acceptance Criteria
*   [ ] **Format:** The header must display: `[Stage Name] (Count) - $TotalValue`.
*   [ ] **Currency:** formatted (e.g., "$150k" or "$150,000").
*   [ ] **Dynamics:** As cards are dragged between columns, the totals must recalculate instantly (Client-side optimistic update).

### 2.3 Technical Implementation
*   **Component:** `src/components/pipeline/KanbanHeader.tsx`
*   **Logic:**
    *   The `leads.reduce` logic already exists.
    *   **Action:** prominence needs to be increased.
    *   Move the Total Value to the *primary* visual hierarchy (larger font, easier to read). Avoid "splitting" the header into top/bottom disjointed parts.
    *   Example Layout:
        ```
        [ Stage Name           (12) ]
        [ $ 1,250,000               ] <--- Big, bold, green if >0
        [ Progress Bar              ]
        ```

---

## 3. Lost Reason Modal (Governance)

### 3.1 Rationale & User Story
*   **Rationale:** Dragging a deal to "Lost" is too easy. We lose valuable market intelligence (Why did we lose? Price? Competitor?).
*   **User Story:** "As a Manager, I want to force agents to select a 'Loss Reason' when they move a deal to 'Closed Lost', so I can analyze our weaknesses."

### 3.2 Detailed Acceptance Criteria
*   [ ] **Trigger:** Moving a card to any stage containing "Perdido" (or specific ID) triggers a Modal.
*   [ ] **Blocking:** The drag operation is *conditional*. If the user cancels the modal, the card snaps back to the original column.
*   [ ] **Form:**
    *   **Reason:** Dropdown [Precio, Competencia, No Calificado, Sin Respuesta, Otro].
    *   **Notes:** Optional text area.
*   [ ] **Persistence:** Save reason to `leads.lost_reason` (new column) or `lead_events`.

### 3.3 Technical Implementation
*   **Database:**
    *   `ALTER TABLE leads ADD COLUMN lost_reason TEXT;`
*   **State Management (`Pipeline.tsx`):**
    *   `onDragEnd`: Detect if `targetStage` is "Lost".
    *   If "Lost":
        1.  Do *not* commit update yet.
        2.  Store `pendingMove` state ({ leadId, targetStageId }).
        3.  Open `LostReasonModal`.
*   **Component:** `src/components/pipeline/LostReasonModal.tsx`
    *   Props: `isOpen`, `onConfirm(reason, notes)`, `onCancel`.
*   **Flow:**
    *   Modal Confirm -> Commit DB update + Save Reason.
    *   Modal Cancel -> Clear `pendingMove` (Card returns naturally via dnd-kit auto-revert or state reset).

---

## 4. Risks & Verification

### 4.1 Risks
*   **User Frustration:** Forcing a modal can feel slowing.
    *   *Mitigation:* Keep the modal simple. 1 click to select reason, 1 click to save.
*   **Data Migration:** Old leads won't have `stage_updated_at`.
    *   *Mitigation:* Backfill `stage_updated_at = updated_at` (or `created_at`) for existing records to prevent the entire board from turning "Red" instantly.

### 4.2 Verification Plan
1.  **Stagnation:** Manually update a lead's `stage_updated_at` in DB to 11 days ago. Refresh. Verify Red Border.
2.  **Value Header:** Drag a $10k card from A to B. Verify A's total decreases by $10k and B's increases by $10k immediately.
3.  **Lost Modal:** Drag to "Lost". Cancel modal. Card should jump back. Drag again. Confirm "Price". Verify DB has "Price" in `lost_reason` and stage is "Lost".

---
**Prepared by:** Agent (Antigravity)
**Date:** 2026-02-19
