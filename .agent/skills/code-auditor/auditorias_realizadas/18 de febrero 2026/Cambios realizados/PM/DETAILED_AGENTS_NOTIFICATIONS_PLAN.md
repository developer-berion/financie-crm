---
type: implementation_plan
feature: "Agents & System Notifications (AdminOps)"
status: "Draft"
owner: "pm_crm_enterprise"
version: "1.0.0"
---

# Detailed Implementation Plan: Agents & System Notifications

## Overview
This plan details the "Agents & System Notifications" feature set from the [Basic Implementation Plan](./IMPLEMENTATION_PLAN_BASIC.md). The goal is to improve **Governance** (who can do what) and **Usability** (system feedback).

**Core Objectives:**
1.  **Security:** Visual distinction between Admins and Regular Agents.
2.  **Feedback:** Immediate feedback on actions (Success/Error toasts).

---

## 1. Clear Role Badges & Status

### 1.1 Rationale & User Story
*   **Rationale:** Currently, the Sidebar hardcodes "Admin". In reality, we have different roles. It's dangerous if a standard user thinks they are an Admin or vice versa.
*   **User Story:** "As an Admin, when I look at the sidebar or the Agents list, I want to clearly see who has 'Admin' privileges vs 'Agent' privileges."

### 1.2 Detailed Acceptance Criteria
*   [ ] **Sidebar:** The current user's role is displayed dynamically under their email.
    *   **Admin:** "Administrator" (Gold/Red text).
    *   **Agent:** "Sales Agent" (Gray text).
*   [ ] **Agent List (`/agentes`):**
    *   Admins get a `[ADMIN]` badge next to their name.
    *   Inactive agents get a `[INACTIVE]` badge and are grayed out.
*   [ ] **Toggle Status:** Admins can toggle other users between `Active` and `Inactive` (preventing login).

### 1.3 Technical Implementation
*   **Database:**
    *   Ensure `public.profiles` has columns: `role` ('admin', 'agent') and `is_active` (boolean).
*   **Context (`AuthContext.tsx`):**
    *   Fetch `profile` on login.
    *   Expose `profile` object alongside `user`.
    *   *Correction:* If `AuthContext` only exposes `user` (Supabase Auth User), we need a `useProfile` hook or enrich the context.
*   **Components:**
    *   `src/components/Layout.tsx`: Replace hardcoded "Admin" with `{profile?.role}`.
    *   `src/pages/Agentes.tsx`: Add badges to the table/list.

---

## 2. System Toaster (Feedback Loop)

### 2.1 Rationale & User Story
*   **Rationale:** Users often ask "Did that save?" or click save 3 times because there's no feedback.
*   **User Story:** "As a User, whenever I perform a write action (Create, Update, Delete), I want a clear popup telling me if it succeeded or why it failed."

### 2.2 Detailed Acceptance Criteria
*   [ ] **Consistent UI:** Use `sonner` (already installed).
*   [ ] **Scenarios:**
    *   **Lead Created:** Green checkmark "Lead creado exitosamente".
    *   **Lead Updated:** "Cambios guardados".
    *   **Error:** Red X "Error al guardar: [Detalle]".
    *   **Network Error:** "Sin conexión, reintentando..." (if possible, or just error).
*   [ ] **Placement:** Top-right (Desktop), Top-center (Mobile).

### 2.3 Technical Implementation
*   **Global Handler:** Refactor `src/App.tsx` global error boundary (already present) to catch unhandled promise rejections more gracefully.
*   **Feature Integration:**
    *   `Leads.tsx`, `LeadDetail.tsx`, `Pipeline.tsx`: Verify all `try/catch` blocks use `toast.success()` and `toast.error()`.
    *   *Audit:* Check `Pipeline.tsx` (Plan 3 added toasts). Check `LeadDetail` (needs audit).

---

## 3. Risks & Verification

### 3.1 Risks
*   **Lockout:** If we implement `is_active` check on login incorrectly, we might lock out the main admin.
    *   *Mitigation:* Manual DB access to restore if needed. Ensure logic is `if (profile.is_active === false) throw Error`.
*   **Role Spoofing:** Frontend-only checks are insecure.
    *   *Mitigation:* Row Level Security (RLS) policies on Supabase must enforce that only Admins can write to `profiles` or delete data.

### 3.2 Verification Plan
1.  **Role Test:** Log in as Agent. Check Sidebar says "Agent". Try to access `/agentes` (should be restricted? or read-only?).
2.  **Toast Test:** Disconnect internet. Try to save a lead. Verify Error Toast appears. Reconnect. Save. Verify Success Toast.
3.  **Active Toggle:** Admin A toggles Agent B to "Inactive". Agent B tries to log in. Should fail.

---
**Prepared by:** Agent (Antigravity)
**Date:** 2026-02-19
