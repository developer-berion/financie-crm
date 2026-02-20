# Feature Specification: Smart Leads (v1.0)

**Status:** Draft (PM Phase)
**Owner:** Product Manager (Elite CRM)
**Areas:** Lead Management, AI, Data Quality
**Priority:** High (Operational Efficiency)

---

## 1. Executive Summary
"Smart Leads" is a suite of intelligent tools designed to automate lead qualification, ensure data integrity, and provide agents with the most relevant information based on the current context of the deal. By implementing dynamic layouts, autonomous duplicate detection, and behavioral scoring, we minimize administrative overhead and maximize sales focus.

---

## 2. Feature: Dynamic Layouts (Stage-Specific UI)

### Purpose
To reduce cognitive load on agents by showing only the fields and components relevant to the lead's current stage.

### Business Objective (Ref: KB_01#JTBD)
- Increase "Time to Task" efficiency.
- Ensure compliance by making "Stage Gates" fields mandatory and visible only when needed.

### User Story
As a Sales Rep, I want the lead detail page to change automatically when I move a lead from "New" to "Proposal", so I only see the fields required for that phase (e.g., Proposal PDF, Discount field).

### Functional Specifications
- **Logic:** Conditional rendering based on `lead.status`.
- **View States:**
  - **Early Stage (New/Contact):** Focus on Bio, Source, and Discovery Notes.
  - **Mid Stage (Presentation/Proposal):** Focus on Requirements, Value Proposition, and Quote details.
  - **Late Stage (Negotiation/Closing):** Focus on Contract, Legal, and Billing information.

### UX requirements
- Conditional rendering of tabs and fields based on `lead.status`.
- "Pinned Fields" section at the top for critical stage metadata.
- Transition effects when the layout shifts.

#### [UX/UI Elite Enhancement] (Ref: KB_02#RecordPage)
- **Pattern:** Use a "Sticky Top Header" for the top 5-7 Key Fields (Amount, Expected Close, Priority) that remains visible regardless of the current stage view.
- **Density:** Automatically switch between "High Density" (table-like) for technical negotiation stages and "Clean/Focused" for early discovery stages.
- **Navigation:** Implement a "Horizontal Stage Tracker" (Chevron path) that acts as both a progress indicator and a direct navigation tool to trigger layout changes.

### Acceptance Criteria (AC)
- [ ] AC1: Switching a lead stage updates the UI components without a full page refresh.
- [ ] AC2: Required fields for the next stage are highlighted/pinned when the stage changes.
- [ ] AC3: Layout dimensions are preserved during transitions (Skeleton screens prevent layout shift).

---

## 3. Feature: Anti-Duplicate Engine

### Purpose
To maintain a "Golden Record" and prevent fragmented customer data that leads to double work and poor customer experience.

### Business Objective (Ref: KB_13#Deduplication)
- Maintain Data Hygiene > 95%.
- Prevent "Collision" between agents (two agents calling the same person).

### User Story
As an Admin, I want the system to warn me if a lead with a similar name, email, or phone already exists, so I can merge them instead of creating a duplicate.

### Functional Specifications
- **Matching Logic:** 
  - Exact match: Email OR Phone.
  - Fuzzy match (80%+): Name + Company OR Name + City.
- **Trigger:** On "Create" and "Update" (Blur event on core fields).
- **Resolution:** Provide a "Compare & Merge" interface.

### UX requirements
- Toast alert on field blur if a duplicate is found.
- "Compare & Merge" overlay window.
- Visual highlighting of matching fields.

#### [UX/UI Elite Enhancement] (Ref: KB_11#SafeOps)
- **"Diff Before Merge" Pattern:** Show a side-by-side comparison (Mine vs. Existing) with radio buttons for the agent to select the "Survivor" value for each specific field.
- **Async Feedback:** Perform deduplication checks in the background as the user types, using a "Status Indicator" (Searching/Clean/Conflict) in the sidebar.
- **Action Hierarchy:** If a high-confidence match is found, replace the "Create" button with "View Existing & Merge" to prevent data pollution.

### Acceptance Criteria (AC)
- [ ] AC1: system detects exact duplicates instantly and blocks creation.
- [ ] AC2: Fuzzy matches trigger a "Potential Duplicate" warning with a link to the existing record.
- [ ] AC3: Audit log records whenever two records are merged.
- [ ] AC4: Conflict resolution modal allows field-by-field survivorship selection.

---

## 4. Feature: Smart Lead Scoring

### Purpose
To automatically prioritize leads based on their likelihood to convert, utilizing behavioral and demographic signals.

### Business Objective (Ref: KB_08#LeadScoring)
- Improve Sales Velocity by focusing on "Hot" leads.
- Automate the "MQL to SQL" transition.

### User Story
As a Sales Rep, I want my lead list to be sorted by a "Score" that reflects how engaged the lead is, so I know who to call first every morning.

### Functional Specifications
- **Scoring Model:**
  - **Demographic (+):** Company size, Industry match, Job Title.
  - **Behavioral (+):** Email opens, Link clicks, Website visits.
  - **Negative (-):** Bounced email, Unsubscribe, Inactivity > 30 days.
- **Output:** A numerical score (0-100) and a "Temperature" badge (Cold, Warm, Hot).

### UX requirements
- Numerical badge on lead avatar/row.
- Color coding (Red-Yellow-Green) for temperature.
- Tooltip explaining the "Why" behind the score.

#### [UX/UI Elite Enhancement] (Ref: KB_09#AIAssist)
- **Explainable Scoring:** On hover, show an "Insights Panel" generated by AI: "Score 85 (+10 for Email Open, +5 for Industry Match)".
- **Visual Priority:** Use "Pulse Animations" or distinct border treatments for leads with a score > 90 to ensure they are the first thing an agent sees.
- **Quick Action:** Add a "Next Best Action" shortcut next to the score (e.g., "Schedule Call" if score jumped > 20 points recently).

### Acceptance Criteria (AC)
- [ ] AC1: Score updates automatically based on background events (webhooks/emails).
- [ ] AC2: Lead list supports sorting by `lead_score`.
- [ ] AC3: Score decay: Score decreases by 5% for every week of no activity.
- [ ] AC4: Explainability tooltip is present and reflects real-time point distribution.

---

## 5. Global UI/UX Performance States (Ref: KB_14)
- **Background Validation:** Deduplication checks must be non-blocking. Show a "Verifying Data Integrity..." micro-state in the header.
- **Graceful Degradation:** If the Scoring service is down, hide the Score badges rather than showing a 0 or an Error state to prevent user confusion.
- **Optimistic Merge:** When a merge is confirmed, hide the duplicate record instantly in the list view while the backend processes the join.

---

## 6. Risk Matrix
| Risk | Impact | Mitigation |
|---|---|---|
| User Confusion | Medium | Use "Progressive Disclosure" to explain why the layout changed or why a score is high. |
| Over-filtering | Low | Ensure agents can always access "Hidden" fields via an "All Fields" tab. |
| False Positives (Dupes) | Medium | Allow agents to mark a "False Positive" to stop the warning for specific pairs. |
