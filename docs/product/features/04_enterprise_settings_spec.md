# Feature Specification: Enterprise Settings (v1.0)

**Status:** Draft (PM Phase)
**Owner:** Product Manager (Elite CRM)
**Areas:** Security, Governance, Finance
**Priority:** High (Enterprise Controls)

---

## 1. Executive Summary
Enterprise Settings provides the administrative backbone for security, transparency, and financial incentivization. This module includes granular Role-Based Access Control (RBAC), immutable system-wide Audit Logs, and a flexible Commission Calculator to ensure the CRM scales alongside complex business structures while maintaining strict data governance.

---

## 2. Feature: RBAC Matrix (Granular Permissions)

### Purpose
To ensure that users only have access to the data and actions necessary for their role, protecting company assets and sensitive lead information.

### Business Objective (Ref: KB_04#RBAC)
- Implement the "Least Privilege" principle.
- Reduce risk of internal data leakage (e.g., mass exports).

### User Story
As an Admin, I want to define exactly which roles can "Export Leads" or "Delete Notes", so I can restrict sensitive actions to senior personnel.

### Functional Specifications
- **Model:** Role (Admin, Manager, Agent) vs. Permission (View, Create, Edit, Delete, Export, Config).
- **Enforcement:** RLS (Row Level Security) at the database level and UI-level button disabling.
- **Scope:** Support Object-level (e.g., Deals) and Field-level (e.g., Commission Amount) security.

### UX requirements
- Grid-based Permission Matrix.
- Field-level "Locked" indicators.
- "Role Preview" mode for admins.

#### [UX/UI Elite Enhancement] (Ref: KB_11#RBAC)
- **Pattern: Interactive Permission Matrix.** Instead of a long list of checkboxes, use a high-density matrix where Admins can click-and-drag to select multiple permissions at once.
- **Visual Feedback:** When a permission is disabled, the associated UI elements (buttons, menu items) should not just be hidden, but shown in a "Disabled + Reason" state on hover (e.g., "Feature locked by Finance Policy").
- **Safety Pattern:** Implement a "Diff Before Save" for role changes, showing a summary: "Changing 'Manager' role will grant 5 new permissions and revoke 1."

### Acceptance Criteria (AC)
- [ ] AC1: Users without 'Export' permission cannot see or trigger the Export action.
- [ ] AC2: Field-level security hides sensitive fields (e.g., SSN, Bank Info) from unauthorized roles.
- [ ] AC3: Permission changes are applied immediately to the user session.
- [ ] AC4: Admins receive a "Risk Warning" if a permission set is too broad (e.g., allowing mass deletion).

---

## 3. Feature: Audit Logs (Immutable)

### Purpose
To provide a verifiable and tamper-proof trail of all critical system activities for compliance and forensic purposes.

### Business Objective (Ref: KB_18#Compliance)
- Meet Enterprise compliance standards (GDPR, ISO).
- Detect and investigate unauthorized access or data tampering.

### User Story
As a Security Officer, I want to see a log of every time a user logs in, exports data, or changes an agent's commission rate, so I can audit any suspicious activity.

### Functional Specifications
- **Events Logged:** Logins, Deletions, Exports, Permission changes, Financial adjustments.
- **Data Points:** Timestamp, User ID, Action, Target ID, Metadata (Old Value vs New Value).
- **Storage:** Use an append-only, immutable table that cannot be edited or deleted through the standard UI.

### UX requirements
- System-wide search in logs.
- "Time-travel" visualization (compare states).
- Export to CSV/PDF for compliance reports.

#### [UX/UI Elite Enhancement] (Ref: KB_18#Traceability)
- **Chronological Density:** Use a "High-Density Timeline" for logs, utilizing color-coded icons for event types (Security = Red, Financial = Green, Data = Blue).
- **Infinite Scroll + Skeleton:** Ensure log scrolling is fluid even with 100k+ entries using skeleton loading and windowing (virtual lists). (Ref: KB_14)
- **Contextual Drift:** When viewing a field change (e.g., Price update), show a "Side-by-Side Diff" with syntax highlighting (Red for removed, Green for added) to make changes immediately obvious.

### Acceptance Criteria (AC)
- [ ] AC1: All destructive actions (Delete/Bulk Update) are logged with a "Before & After" snapshot.
- [ ] AC2: Audit logs are accessible only to 'System Admin' or 'Security' roles.
- [ ] AC3: Logs are searchable by User, Date, and Object Type.
- [ ] AC4: Logs include the IP address and User Agent for security forensics.

---

## 4. Feature: Commission Calculator

### Purpose
To automate the calculation of agent incentives based on closed deals, reducing manual finance overhead and improving transparency.

### Business Objective (Ref: KB_09#RevOps)
- Incentivize high-performance behavior.
- Ensure accuracy and trust in commission payouts.

### User Story
As a Sales Rep, I want to see my "Pending Commission" update automatically whenever I close a deal, so I can track my monthly earnings in real-time.

### Functional Specifications
- **Rules Engine:** 
  - Percentage-based (e.g., 5% of Deal Value).
  - Tiered (e.g., 5% up to $10k, 8% after).
  - Fixed (e.g., $100 per lead).
- **Trigger:** Deal state moves to 'Won'.
- **Persistence:** Store calculated amounts in a `commissions` table linked to the deal and agent.

### UX requirements
- Real-time "Estimated Commission" widget for agents.
- "Manager Approval" workflow UI.
- Detailed "Math Breakdown" tooltip.

#### [UX/UI Elite Enhancement] (Ref: KB_08#Visualization)
- **Financial Transparency:** Provide a "Transparency Panel" for every commission entry, showing the exact formula used: `(Deal Value $10,000 * Tier 2 Rate 8%) = $800`.
- **Status Progression:** Use a "Progress Stepper" for commissions: `Calculated -> Under Review -> Approved -> Paid`.
- **Batch Actions:** Admins should be able to "Bulk Approve" all commissions for a specific month with a single click, following a "Summary Confirmation". (Ref: KB_11)

### Acceptance Criteria (AC)
- [ ] AC1: Calculation logic respects the predefined rules in the `commission_rules` settings.
- [ ] AC2: Commissions are updated in 'Pending' state until manually 'Approved' by a manager.
- [ ] AC3: Calculation history is preserved even if rules change later (Snapshotting).
- [ ] AC4: Agents receive a push notification when a commission moves to 'Approved'.

---

## 5. Performance & Resilience States (Ref: KB_14)
- **Optimistic RBAC:** Apply permission changes locally in the UI instantly, with a background sync and a "Permissions Revoked" banner if the session needs to refresh.
- **Bulk Log Processing:** When performing bulk edits, use a "Progress Circular" to show the log generation status, ensuring no data loss during mass updates.
- **Calculator Sensitivity:** The Commission Calculator should operate as an "Eventually Consistent" background worker to ensure no latency on the main 'Deal Close' action.

---

## 6. Risk Matrix
| Risk | Impact | Mitigation |
|---|---|---|
| Admin Lockout | Critical | Ensure at least two "Super Admins" exist and have a "Break Glass" recovery path. |
| Performance (Audit) | Medium | Use partitioning for the `audit_logs` table if volume exceeds 10M rows/year. |
| Commission Disputes | Medium | Provide a clear "Calculation Log" showing the math behind every commission entry. |
