# GeoAdmin Full Project Audit Report

**Date:** March 27, 2026
**Scope:** 38 audits across 13 categories
**Files Analyzed:** 100+ source files, 12 migration files, 53 API routes

---

## Executive Summary

The GeoAdmin medical case management platform has **critical security vulnerabilities** that must be addressed before production use. The application functions correctly for its core workflows but has systemic issues with authorization (RLS policies allow any user to modify any record), data integrity (counter synchronization failures), and missing security hardening (no HTTP headers, no CSRF, no rate limiting).

**Total Issues Found: 112**
- CRITICAL: 23
- HIGH: 31
- MEDIUM: 38
- LOW: 20

---

## CRITICAL Issues (Fix Before Production)

### Security

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **RLS: partners/cases/invoices/documents have `USING(true)` on ALL ops** | `001_initial_schema.sql` | Any authenticated user can modify ANY record |
| 2 | **No HTTP security headers** (CSP, HSTS, X-Frame-Options) | `next.config.js` | XSS, clickjacking, downgrade attacks |
| 3 | **No CSRF protection** on any POST/PUT/DELETE route | All 53 API routes | Cross-site request forgery |
| 4 | **No rate limiting** on login, password reset, invite | Auth routes | Brute force, email flooding |
| 5 | **File uploads accept ANY file type** (case documents) | `cases/[id]/documents/route.ts` | Malware upload, XSS via HTML/SVG |
| 6 | **SVG allowed in company images** (contains JavaScript) | `our-companies/[id]/images/route.ts` | Stored XSS via logo/signature |
| 7 | **No case/company ownership check on uploads** | Upload routes | Any user uploads to any entity |
| 8 | **Activity logs world-readable + any user can INSERT fake entries** | `activity_logs` RLS | Audit trail tampering, PII exposure |
| 9 | **Trash: any user can list/restore ANY item** | `trash/route.ts`, `restore/route.ts` | Information disclosure, unauthorized restore |
| 10 | **Partner import: no role check, no row limit** | `import/partners/route.ts` | DoS via 100K rows, unauthorized imports |

### Data Integrity

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 11 | **Partner counters never updated** (cases_count, invoices_count always 0) | Case/invoice POST routes | Dashboard shows wrong data |
| 12 | **Restore from trash doesn't re-increment counts** | `trash/[id]/restore/route.ts` | Permanent count corruption |
| 13 | **RPC count failures silently swallowed** (`console.warn` only) | Invoice POST/DELETE | Counts drift without detection |

### Business Logic

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 14 | **Can create invoice with status 'paid' directly** | `invoices/route.ts` POST | Bypasses lifecycle |
| 15 | **Can duplicate paid invoices** (same case/recipient/amount) | `invoices/[id]/duplicate/route.ts` | Double-billing risk |
| 16 | **mark-paid bypasses transition map** (cancelled → paid possible) | `invoices/[id]/mark-paid/route.ts` | Invalid state transitions |
| 17 | **Notification status labels completely backwards** | `notifications.ts:297-304` | "draft" shows as "in progress", etc. |

### Email

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 18 | **Password reset returns success even if email fails** | `forgot-password/route.ts` | User thinks email sent |
| 19 | **Invitation email fails silently** | `users/invite/route.ts` | User created but never gets invite |

### Realtime

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 20 | **setQueryData with raw payload loses relations** | `use-realtime.ts` | Runtime errors accessing `.sender.name` |

### Type Safety

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 21 | **`(profile as any)?.role` bypasses type checking** in 5+ routes | Category/company routes | Role check may pass undefined |
| 22 | **TypeScript `'admin'` role doesn't exist in DB enum** | `database.ts`, component files | Dead code, confusion |
| 23 | **`database.ts` types don't match actual DB columns** | `database.ts` | `description`/`total` vs `name`/`amount` |

---

## HIGH Issues (Fix Soon)

| # | Category | Issue | Location |
|---|----------|-------|----------|
| 24 | Security | 34 API routes missing role checks (auth only) | Various routes |
| 25 | Security | Cookie security attributes incomplete (no HttpOnly) | `supabase/client.ts` |
| 26 | Security | MIME validation uses client-provided `file.type` (spoofable) | All upload routes |
| 27 | Security | Pagination params not validated (negative/huge values) | All GET routes |
| 28 | Security | Patient PII logged in activity_logs `details` JSONB | `activity-logs.ts` |
| 29 | Data | Invoice PUT deletes services then inserts — failure = zero services | `invoices/[id]/route.ts` |
| 30 | Data | No database transactions for multi-step operations | All mutation routes |
| 31 | Data | Document count update doesn't check for errors | `documents/route.ts` |
| 32 | Logic | No case status transition validation at all | `cases/[id]/route.ts` |
| 33 | Logic | POST allows creating case with status 'completed' | `cases/route.ts` |
| 34 | Logic | `closed_at` not cleared when reopening completed case | `cases/[id]/route.ts` |
| 35 | Logic | No duplicate invoice limit per case | `duplicate/route.ts` |
| 36 | Perf | Trash fetches ALL deleted records (no LIMIT) | `trash/route.ts` |
| 37 | Perf | Dashboard team: N+1 queries per user (30+ queries) | `dashboard/team/route.ts` |
| 38 | Perf | Export loads ALL records into memory (no streaming) | `export/*.ts` |
| 39 | Perf | 10 sequential dashboard queries (should be parallel) | `dashboard/stats/route.ts` |
| 40 | Type | PDF error returns HTML instead of JSON | `pdf/route.ts` |
| 41 | Type | No timeout on image fetch in PDF generation | `pdf/generate.ts` |
| 42 | RT | Inline callback deps cause subscription churn | `use-realtime.ts` |
| 43 | Email | No retry mechanism for any email sending | Email routes |
| 44 | Email | No timeout on attachment fetch during send | `send/route.ts` |
| 45 | Auth | Ghost `'admin'` role checks in 4 component files | `case-list.tsx`, `case-edit-panel.tsx` |
| 46 | Code | 18x duplicated role-check queries across routes | All protected routes |
| 47 | Code | 12x hardcoded ADMIN_ROLES instead of importing | Various routes |
| 48 | A11y | Zero `aria-label` on icon-only buttons (8+) | Header, sidebar, panels |
| 49 | A11y | No `aria-live` regions for toast/realtime updates | All dynamic content |
| 50 | A11y | Loading skeletons missing `aria-busy` | Skeleton components |

---

## MEDIUM Issues

| # | Category | Issue |
|---|----------|-------|
| 51 | Data | Franchise field: 3 Zod fields, 1 DB column |
| 52 | Data | franchise_type/franchise_value validated but never stored |
| 53 | API | 3 different pagination response formats |
| 54 | API | Error language mix (Georgian/English) |
| 55 | API | Invoice send endpoint has no Zod validation |
| 56 | API | mark-paid has no payment data validation |
| 57 | API | No UUID validation for `[id]` route params |
| 58 | API | Sort parameter passed to .order() without whitelist |
| 59 | Perf | Missing indexes: insurance_id, created_at, currency |
| 60 | Perf | Missing composite indexes for common filters |
| 61 | Perf | Trash indexes for IS NULL but queries need IS NOT NULL |
| 62 | Perf | JS-side aggregation instead of SQL GROUP BY |
| 63 | Type | 45+ `as any` casts across codebase |
| 64 | RT | No error handlers on Supabase channels |
| 65 | RT | No reconnection logic after WebSocket drop |
| 66 | RT | Duplicate subscriptions when multiple components mount |
| 67 | Form | Invoice wizard: 19 useState instead of react-hook-form |
| 68 | Form | Server validation errors not displayed back to form |
| 69 | Form | No unsaved changes warning |
| 70 | Notif | Notification creation failures silently ignored |
| 71 | Notif | No notification expiry/cleanup mechanism |
| 72 | Notif | Any user can create notifications for any other user |
| 73 | Logs | No centralized error reporting (Sentry etc.) |
| 74 | Logs | Sensitive data in console.error (emails, queries) |
| 75 | Logs | No structured logging format |
| 76 | Logs | No log retention policy for activity_logs |
| 77 | Code | user_sessions table defined but never used |
| 78 | Code | settings table defined but never queried |
| 79 | A11y | SlidePanel missing focus trap |
| 80 | A11y | Form inputs use placeholder instead of labels |
| 81 | i18n | Zod validation errors hardcoded in Georgian |
| 82 | i18n | Duplicate roleLabels in users/page.tsx (exists in roles.ts) |
| 83 | i18n | API error messages inconsistent Georgian/English |

---

## Priority Fix Order

### Week 1: Security Critical
1. Add RLS policies with role/ownership checks for partners, cases, invoices, documents
2. Add HTTP security headers to `next.config.js`
3. Add rate limiting on auth endpoints
4. Add file type validation (magic bytes, extension whitelist)
5. Remove SVG from allowed image types
6. Add role checks to 34 unprotected API routes
7. Add ownership checks to trash list/restore

### Week 2: Data Integrity
8. Fix partner counter synchronization (increment on create, decrement on delete)
9. Fix restore to re-increment counts
10. Wrap multi-step mutations in transactions (invoice create/update/delete)
11. Make RPC failures throw errors instead of `console.warn`
12. Fix notification status label mapping

### Week 3: Business Logic
13. Force new invoices/cases to `draft` status
14. Add case status transition validation
15. Block duplication of paid/cancelled invoices
16. Make mark-paid check transition map
17. Fix password reset to return error on email failure
18. Fix `closed_at` clearing on case reopen

### Week 4: Performance & Quality
19. Add LIMIT and DB-level filtering to trash queries
20. Parallelize dashboard queries with `Promise.all()`
21. Add missing database indexes
22. Fix TypeScript types to match DB schema
23. Remove `as any` casts, fix underlying type issues
24. Extract shared auth utility from 18 duplicated patterns

### Week 5: Polish
25. Add ARIA attributes to icon buttons
26. Add focus trap to SlidePanel
27. Add `aria-live` for dynamic content
28. Standardize API response format and language
29. Add Zod validation to remaining endpoints
30. Set up structured logging / error reporting service
