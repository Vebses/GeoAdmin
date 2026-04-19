# GeoAdmin Operations Runbook

Internal playbook for keeping GeoAdmin healthy and recoverable.
Audience: whoever is on-call for the system.

---

## 1. Backup & Recovery

### 1.1 What is backed up automatically

| Layer | Mechanism | Retention |
|-------|-----------|-----------|
| Postgres database | Supabase automated backups | 7 days (Pro) / 30 days (Team) — **verify in dashboard** |
| Point-in-Time Recovery | Supabase PITR (if enabled) | Up to 7 days, restores to any second |
| Auth users | Supabase manages | Same as DB |
| Storage files (`geoadmin-files`, `avatars`) | **NOT automatically backed up** — see 1.2 |

### 1.2 What you must back up yourself

**Storage bucket `geoadmin-files`** — patient documents and company logos live here. Supabase does not replicate bucket contents. Lose a Supabase region → lose every file.

**Action required — set up storage replication:**

```bash
# One-off: rclone config with Supabase S3-compatible credentials
rclone config

# Daily sync (put in cron or GitHub Actions):
rclone sync supabase:geoadmin-files s3:geoadmin-backup-prod/files/$(date +%Y-%m-%d) \
  --min-age 0 --transfers 16 --checkers 16
```

Target: external S3 bucket with object-lock retention of 90 days.

### 1.3 Enable Point-in-Time Recovery

1. Supabase Dashboard → Database → Backups
2. Enable "Point-in-time recovery" (requires Pro+ plan)
3. Verify daily that the "Latest restore point" is <24h old

### 1.4 Logical backup (belt-and-braces)

Run nightly from a GitHub Action or cron:

```bash
pg_dump "$DATABASE_URL" \
  --no-owner --no-acl --schema=public --schema=auth \
  --file=backup-$(date +%Y%m%d).sql

# Encrypt + upload
age -r "$AGE_PUBLIC_KEY" backup-*.sql > backup.sql.age
aws s3 cp backup.sql.age s3://geoadmin-backup-prod/pg/$(date +%Y/%m)/
rm backup-*.sql backup.sql.age
```

Retention: keep 90 daily, 12 monthly, 7 yearly.

### 1.5 Quarterly restore drill

Every 3 months:

1. Spin up an empty Supabase project (`geoadmin-restore-drill`)
2. Restore latest logical backup: `psql "$RESTORE_URL" -f backup.sql`
3. Restore storage bucket: `rclone copy s3:geoadmin-backup-prod/files/latest supabase:geoadmin-files`
4. Point a staging Vercel preview at this project and verify:
   - Login works
   - An existing case loads with its documents
   - Partner stats compute correctly
   - Invoices show historic data
5. Delete the drill project
6. Record date of successful drill in this file under §1.6

### 1.6 Drill log

| Date | Performed by | Outcome | Notes |
|------|--------------|---------|-------|
| _pending first drill_ | — | — | — |

---

## 2. Monitoring & Alerting

### 2.1 Minimum viable monitoring stack

| Concern | Tool | Alert target |
|---------|------|--------------|
| Frontend/API errors | Sentry (free tier) | Slack #alerts |
| DB slow queries | Supabase Observability → Logs | Weekly review |
| Uptime | Better Stack / UptimeRobot | SMS on-call |
| Cron cleanup status | Vercel Cron logs | Email if 2 consecutive failures |
| Storage quota | Supabase Dashboard alerts | Email at 80% |
| Auth anomalies | Log aggregation on failed logins | Slack on >10/min |

### 2.2 Key SLOs

| Metric | Target | Escalation trigger |
|--------|--------|-------------------|
| Login success rate | ≥99.5% | <98% for 10 min |
| API p95 latency | <500ms | >1500ms for 15 min |
| Error rate (5xx) | <0.5% | >2% for 5 min |
| Cleanup cron success | 100% | Any failure |

### 2.3 Custom alerts to set up in Supabase

```sql
-- Dashboard query: daily report of suspicious auth activity
SELECT
  date_trunc('hour', created_at) AS hour,
  COUNT(*) FILTER (WHERE action = 'login') AS logins,
  COUNT(*) FILTER (WHERE action = 'password_changed') AS pw_changes,
  COUNT(DISTINCT ip_address) AS unique_ips
FROM public.activity_logs
WHERE created_at > now() - interval '7 days'
GROUP BY 1
ORDER BY 1 DESC;

-- Dashboard query: rate limiter heatmap (identify brute force attempts)
SELECT key, SUM(count) AS total_hits, MAX(window_start) AS latest
FROM public.rate_limit_hits
WHERE window_start > now() - interval '24 hours'
GROUP BY key
HAVING SUM(count) > 50
ORDER BY total_hits DESC;

-- Dashboard query: stuck trash cleanup
SELECT
  COUNT(*) FILTER (WHERE deleted_at < now() - interval '31 days') AS stale_cases,
  (SELECT COUNT(*) FROM public.invoices WHERE deleted_at < now() - interval '31 days') AS stale_invoices
FROM public.cases
WHERE deleted_at IS NOT NULL;
-- Expected: 0 or very small. If >0 consistently, cron isn't running.
```

---

## 3. Incident Response

### 3.1 Suspected account compromise

1. Immediately deactivate the account:
   ```sql
   UPDATE public.users SET is_active = false WHERE id = '<user_id>';
   ```
2. Revoke all sessions for that user:
   ```sql
   DELETE FROM public.user_sessions WHERE user_id = '<user_id>';
   ```
3. Review their activity:
   ```sql
   SELECT * FROM public.activity_logs WHERE user_id = '<user_id>'
   ORDER BY created_at DESC LIMIT 500;
   ```
4. If data was modified: restore from PITR to 15 min before compromise, diff the deltas, replay legitimate changes.

### 3.2 Data loss (accidental deletion)

1. **Stop writes** — do not let more changes accumulate: `UPDATE public.users SET is_active = false WHERE role <> 'super_admin'` (soft-lock everyone but admins).
2. Determine the exact timestamp of the bad change from `activity_logs`.
3. Use Supabase PITR to restore the DB to just before the incident.
4. Verify storage files still exist (they live separately — check rclone backup if needed).
5. Re-enable users, document the incident, and blameless-postmortem.

### 3.3 Leaked secret (CRON_SECRET, SERVICE_ROLE_KEY)

1. Rotate immediately:
   - `SERVICE_ROLE_KEY` — Supabase Dashboard → Settings → API → Roll keys (breaks all running servers for ~30s)
   - `CRON_SECRET` — generate new, update Vercel env var, redeploy
2. Check `activity_logs` and `rate_limit_hits` for any suspicious usage while the key was valid.
3. Rotate any other secrets this key could have unlocked (DB passwords, etc).

### 3.4 DDoS / brute force

1. Check rate limiter stats (§2.3 query).
2. If a specific IP: add to Vercel/Cloudflare block list.
3. If distributed: enable Cloudflare "I'm under attack" mode, raise auth rate limits temporarily.

---

## 4. Secrets Rotation Schedule

| Secret | Rotation cadence | How | Blast radius |
|--------|-----------------|-----|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | 90 days | Dashboard → API → Roll keys | Full DB access — high |
| `CRON_SECRET` | 90 days | Regenerate + update Vercel env | Only cleanup trigger — low |
| `RESEND_API_KEY` | 90 days | Resend dashboard → create new → swap | Email sending — medium |
| Admin user passwords | 180 days | Force via UI | Account takeover |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | On demand (not routine) | Dashboard → API → Roll | Breaks all clients |

Document each rotation in a shared password manager with the previous value, rotation date, and rotator's name.

---

## 5. Deploy Checklist

Before merging anything that touches security:

- [ ] Migrations include both forward and (documented) rollback steps
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] New env vars documented in `.env.example`
- [ ] RLS policies tested as non-admin user
- [ ] No `console.log` of sensitive data (tokens, passwords, PII)
- [ ] New endpoints have rate limiting where appropriate
- [ ] New DB functions have `SECURITY DEFINER` only if actually needed
- [ ] PR description lists any new attack surface

---

## 6. Environment Separation (recommended, not done yet)

Currently everything runs against one Supabase project. To reduce blast radius:

1. Create `geoadmin-staging` Supabase project
2. Apply the same migrations to both
3. Vercel: preview deploys → staging DB, production → prod DB
4. All destructive SQL must be tested in staging first
5. Never run unreviewed SQL on prod

---

## 7. Compliance Checklist (Medical Data)

Georgian Law on Personal Data Protection + GDPR-adjacent considerations:

- [ ] Data Processing Agreement signed with Supabase
- [ ] DPA signed with Resend
- [ ] DPA signed with Vercel
- [ ] Privacy policy published on public site
- [ ] User can export own data (`/api/users/me/export` — NOT YET IMPLEMENTED)
- [ ] User can request erasure (follow up with business logic)
- [ ] `activity_logs` retention is ≥2 years (currently unbounded; add retention policy)
- [ ] All PII encrypted at rest (Supabase default) ✅
- [ ] All traffic over TLS 1.2+ ✅
- [ ] Documented breach notification process (§3)
- [ ] Access reviews: monthly audit of `users WHERE role IN ('super_admin','manager')`

---

## 8. Emergency Contacts

| Role | Person | Contact |
|------|--------|---------|
| Primary on-call | _TBD_ | _TBD_ |
| Secondary on-call | _TBD_ | _TBD_ |
| Supabase support | https://supabase.com/dashboard/support | Priority (Pro+ plan) |
| Resend support | https://resend.com/support | Email |
| Security disclosure | security@geoadmin.ge | _set up this mailbox_ |

---

**Last updated:** 2026-04-19
**Owner:** Engineering lead
