# Feature Specification: Pipeline Governance (v1.0)

**Status:** Draft (PM Phase)
**Owner:** Product Manager (Elite CRM)
**Areas:** Sales Ops, Compliance, Automation
**Priority:** High (Process Integrity)

---

## 1. Executive Summary
Pipeline Governance ensures that the sales process is followed with mathematical precision. By implementing mandatory "Stage Gates", allowing for multiple specialized pipelines, and automating status transitions, we reduce human error, improve data quality, and provide a clear structure for team scaling.

---

## 2. Feature: Validation Rules (Stage Gates)

### Purpose
To prevent deals from progressing without the necessary data or documentation, ensuring high-quality forecasts.

### Business Objective (Ref: KB_06#AutomationRules)
- Enforce business process compliance.
- Eliminate "Gaps" in deal data before moving to critical stages.

### User Story
As a Sales Manager, I want to prevent an agent from moving a deal to "Won" if the "Contract Signed" checkbox isn't checked and the "Contract PDF" isn't uploaded.

### Functional Specifications
- **Logic:** `beforeUpdate` trigger on the Lead object.
- **Rules Configuration:**
  - Stage: **Won** -> Required: `contract_signed == true`, `contract_url != null`.
  - Stage: **Proposal** -> Required: `deal_value > 0`.
- **Error Handling:** Block the movement and show a specific error message explaining what is missing.

### UX requirements
- Inline error messages on the deal card during drag-and-drop.
- Modal "Checklist" that appears if fields are missing.
- "Locked" icons on stages that cannot be entered yet.

#### [UX/UI Elite Enhancement] (Ref: KB_11#SafeOps)
- **Pattern: "Ghost Drop" Feedback.** If an agent tries to drop a lead into a gated stage without requirements, use a "Denied" animation (shake and return to source) with a persistent side-panel showing the missing fields.
- **Visual Gatekeepers:** In the Kanban view, show a small "Lock" icon on stage headers. Hovering over the lock displays a "Requirement Tooltip".
- **Dynamic Field Injection:** In the "Stage Gate Modal", allow agents to fill the missing fields directly without leaving the Kanban context.

### Acceptance Criteria (AC)
- [ ] AC1: Drag-and-drop or manual stage update is blocked if rules are not met.
- [ ] AC2: System displays a clear error message: "Missing required fields: [Field Name]".
- [ ] AC3: Admins can bypass gates via a specific permission (Ref: KB_04#RBAC).
- [ ] AC4: Missing fields can be completed via an inline drawer/modal without losing context.

---

## 3. Feature: Multiple Pipelines

### Purpose
To support different sales cycles (e.g., "Agency Sales", "Corporate Travel", "Inbound Leads") that require different stages and logic.

### Business Objective (Ref: KB_12#LifecycleObjects)
- Optimize the CRM for different business lines.
- Segment reporting and forecasting by business unit.

### User Story
As a RevOps Director, I want to have a separate pipeline for "Renewals" with different stages than my "New Sales" pipeline, so I can track their distinct lifecycles accurately.

### Functional Specifications
- **Data Model:** 
  - `pipelines` table: `id`, `name`, `is_default`.
  - `pipeline_stages` table: `id`, `pipeline_id`, `name`, `order`, `probability`.
  - `leads` table: add `pipeline_id` foreign key.
- **UI:** A switcher in the Kanban and List views to toggle between pipelines.

### UX requirements
- High-level "Pipeline Selector" in the top navigation bar.
- Theme/Color differentiation between pipelines (optional but recommended).
- Shared components (Leads) but isolated logic (Stages).

#### [UX/UI Elite Enhancement] (Ref: KB_01#Navigation)
- **Workspace Switching:** Implement a "Pipeline Switcher" that functions like a workspace selector. Switching pipelines should update not just the columns, but the available "Quick Actions" and "Saved Views" for that specific business process.
- **Breadcrumb Navigation:** Use breadcrumbs to indicate context (e.g., `Renewals Pipeline > Active Deals`) to prevent agents from getting lost in multiple business lines.
- **Search Scope:** Global search results should indicate which pipeline a lead belongs to using a "Badge" component. (Ref: KB_12)

### Acceptance Criteria (AC)
- [ ] AC1: User can create and name multiple pipelines.
- [ ] AC2: Each pipeline can have a customized set of stages and probabilities.
- [ ] AC3: Leads are correctly filtered and displayed based on the active pipeline view.
- [ ] AC4: Navigation context is preserved when switching (e.g., if sorting by value, preserve sort state).

---

## 4. Feature: Stage Automation (Auto-Triggers)

### Purpose
To automate repetitive administrative tasks that occur during stage transitions.

### Business Objective (Ref: KB_06#Workflows)
- Increase operational velocity.
- Reduce "Admin Work" for sales agents.

### User Story
As a Sales Rep, I want the system to automatically send a "Welcome Email" and create an "Onboarding Task" when I move a lead to "Won", so I don't forget the next steps.

### Functional Specifications
- **Triggers:** `onStageEnter`, `onStageExit`.
- **Pre-defined Actions:**
  - Send Email Template (via Brevo integration).
  - Create Follow-up Task/Meeting.
  - Update secondary fields (e.g., `closing_date = today`).
- **Audit:** All automated actions must be logged in the lead timeline.

### UX requirements
- "Automation Running" indicators (spinners/toasts).
- Success/Failure notifications in the Notification Center.
- Timeline (Lead Events) entries with "System" attribution.

#### [UX/UI Elite Enhancement] (Ref: KB_09#HumanInTheLoop)
- **Transparency Pattern:** When a lead status change triggers an email, show a "Draft Sent" toast with an "Undo" or "View Email" action for 5 seconds.
- **Event Visualization:** Automated tasks should be visually distinct in the `lead_events` timeline (e.g., a "Robot" icon) to distinguish from human log actions. (Ref: KB_02)
- **State Feedback:** If an automation fails (e.g., email bounce), use a "Critical Alert" badge on the lead card in Kanban to grab immediate attention.

### Acceptance Criteria (AC)
- [ ] AC1: Moving a lead to 'Won' triggers the email/task creation successfully.
- [ ] AC2: Errors in automation are reported to the Lead Owner.
- [ ] AC3: Automation can be toggled On/Off by Admins.
- [ ] AC4: All system actions cite the specific automation rule in the audit log.

---

## 5. Global UI/UX Performance States (Ref: KB_14)
- **Transaction Safety:** Stage changes and their associated automations must be atomic. If an email fails, the stage change should be reversible (via Toast Undo).
- **Concurrency UX:** If two agents try to change the same deal stage simultaneously, show a "Conflict Resolution" modal: "Lead state has changed. Refetching columns...".
- **Silent Automations:** Non-critical background tasks (e.g., updating `closing_date`) should be silent but logged, to avoid notification fatigue.

---

## 6. Risk Matrix
| Risk | Impact | Mitigation |
|---|---|---|
| Process Friction | High | Combine Stage Gates with "Dynamic Layouts" (Spec 02) so agents see the requirements before they try to move the deal. |
| Configuration Complexity | Medium | Use a "Wizard" or visual stage editor for Admins. |
| Loop Infinitos (Automation) | High | Implement "Recursion Protection" in automation triggers. |
