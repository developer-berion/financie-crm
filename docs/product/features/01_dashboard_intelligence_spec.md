# Feature Specification: Dashboard Intelligence (v1.0)

**Status:** Draft
**Owner:** Product Manager (Elite CRM)
**Areas:** Dashboard, Analytics, RevOps
**Priority:** High (Enterprise Growth)

---

## 1. Executive Summary
This feature set aims to transform the CRM from a simple data repository into a **System of Intelligence**. By implementing funnel leakage analysis, agent efficiency tracking, and weighted forecasting, we provide management with the tools to optimize revenue and identify operational bottlenecks in real-time.

---

## 2. Feature: Pipeline Leakage Metrics

### Purpose
To identify exactly where leads are dropping off in the sales process to improve conversion rates and ROI.

### Business Objective (Ref: KB_08#FunnelAnalytics)
- Reduce "Speed to Lead" friction.
- Maximize the throughput of the lead lifecycle.

### User Story
As a Sales Manager, I want to see a chart showing the percentage of leads that move from one stage to the next, so I can identify which stage has the highest "leakage" (drop-off).

### Functional Specifications
- **Data Points:** Lead count per stage, conversion rate (CR) between contiguous stages, and average time spent in stage.
- **Logic:** 
  - `ConversionRate = (Leads entering Stage B / Leads entering Stage A) * 100`.
  - `DropOffRate = 100 - ConversionRate`.
- **Filters:** Date range, Agent/Team, Lead Source.

### UX requirements
- Visual Funnel Chart (Sankey or Funnel layout).
- Tooltips showing absolute numbers vs percentages.
- Highlighting of the "Red Flag" stage (lowest CR).

#### [UX/UI Elite Enhancement] (Ref: KB_11#ProgressiveDisclosure)
- **Pattern:** Use a "Sankey Diagram" for high-density flow visualization to show not just linear leakage but where leads go if they don't move forward (e.g., "Disqualified", "Nurture").
- **Interaction:** Implement "Drill-down on Click". Clicking a stage should filter the main Leads table below to show the specific records in that stage bottleneck.
- **Micro-animation:** Smooth transition (tweening) when changing filters (Source, Date) to visualize how the funnel "shrinks" or "grows".

### Acceptance Criteria (AC)
- [ ] AC1: The chart correctly displays conversion % between stages based on historical lead movement.
- [ ] AC2: Filtering by "Lead Source" accurately updates the funnel data.
- [ ] AC3: Data is refreshed in real-time or near real-time (cache < 1h).
- [ ] AC4: Clicking a funnel segment applies a "Contextual Filter" to the associated list view.

---

## 3. Feature: Agent Performance Leaderboard (Efficiency Focus)

### Purpose
To move beyond "volume-based" ranking and reward agents who are most efficient at converting leads into revenue.

### Business Objective (Ref: KB_08#SalesEfficiency)
- Motivate agents based on quality and ROI, not just quantity of activity.
- Identify "High Performers" for mentorship programs.

### User Story
As a Sales Leader, I want to rank my agents by their "Won Rate" and "Lead-to-Deal Efficiency", so I can reward the most productive team members fairly.

### Functional Specifications
- **Key Metric:** `EfficiencyScore = (Won Deals / Total Leads Assigned) * 100`.
- **Secondary Metrics:** Total Revenue Won, Avg. Time to Close.
- **Data Source:** `leads` table and `lead_events`.

### UX requirements
- Interactive table/list.
- Dynamic sorting by "Efficiency %", "Total Revenue", or "Speed".
- Profile icons/names of agents.

#### [UX/UI Elite Enhancement] (Ref: KB_02#Density)
- **Layout:** Use a "Compact High-Density Card" for the top 3 agents, with the rest in a standard enterprise grid.
- **Visual Cues:** Use "Trend Indicators" (small green/red arrows) next to the Efficiency Score to compare with the previous period (W0W/MoM).
- **Gamification:** Subtle "Gold/Silver/Bronze" border treatment for the top 3 to drive healthy competition without clutter.

### Acceptance Criteria (AC)
- [ ] AC1: Leaderboard accurately calculates Won Rate based on the `status = 'won'` or similar filter.
- [ ] AC2: Admin can toggle between metrics (Revenue vs Efficiency).
- [ ] AC3: Only active agents are displayed.
- [ ] AC4: Trend indicators correctly reflect period-over-period delta.

---

## 4. Feature: Weighted Revenue Forecast

### Purpose
To provide a realistic prediction of future revenue by factoring in the probability of closing based on the current stage of the deal.

### Business Objective (Ref: KB_09#Forecast)
- Improve financial planning and resource allocation.
- Manage investor/stakeholder expectations with data-backed forecasts.

### User Story
As a CEO, I want to see the "Expected Value" of my pipeline for the next 30/60/90 days, so I can plan company investments.

### Functional Specifications
- **Probability Matrix:**
  - New: 5%
  - Contact 1: 15%
  - Presentation: 40%
  - Proposal: 70%
  - Negotiation: 90%
- **Logic:** `WeightedValue = Sum(DealValue * StageProbability)`.
- **Timeframe:** Uses `expected_close_date` or `created_at + avg_cycle_time`.

### UX requirements
- Bar chart showing "Forecasted vs Real" revenue.
- Aggregate "Weighted Pipeline Total" prominently displayed as a KPI.

#### [UX/UI Elite Enhancement] (Ref: KB_04#SafeOps)
- **"What-If" Simulator:** Implement a temporary "Override" slider for the CEO to simulate: "What if our Proposal conversion jumps 10%?". This should update the forecast visually without committing to the DB.
- **Color Logic:** Use "Revenue Heat" colors (e.g., Deep Ember to Emerald) to represent the distance to the monthly quota.
- **Empty States:** If no data exists for the selected timeframe, show an actionable state: "No deals closing this month. [View Pipeline] to adjust dates." (Ref: KB_13)

### Acceptance Criteria (AC)
- [ ] AC1: The total weighted value matches the SQL calculation `SUM(value * probability)`.
- [ ] AC2: Changing a stage probability in settings (if applicable) updates the forecast global values.
- [ ] AC3: Forecast respects the selected currency (USD).
- [ ] AC4: Simulator mode does not trigger write operations to the `pipelines` table.

---

## 5. Global UI/UX Performance States (Ref: KB_14)
To ensure elite responsiveness and resilience:
- **Skeleton Screens:** Use CSS-animated skeletons that mirror the layout of the Funnel and Leaderboard during initial fetch.
- **Optimistic UI:** When an admin updates a Stage Probability, update the Forecast totals instantly in the UI before receiving the 200 OK from the API.
- **Error Handling:** If a chart fails to load, show a "Partial Failure" state with a clear "Retry" button rather than a blank card.

---

## 6. Technical Implementation Details (For Development)
- **Database:** Supabase/PostgreSQL.
- **Logic Layer:** Edge Functions or specialized SQL Views for performance.
- **Frontend:** React with Recharts/D3 for visualizations.

---

## 6. Risk Matrix
| Risk | Impact | Mitigation |
|---|---|---|
| Inaccurate Data | High | Implement strict state gates and audit logs to ensure lead status history is accurate. |
| Performance | Medium | Use materialized views for heavy aggregations if needed. |
