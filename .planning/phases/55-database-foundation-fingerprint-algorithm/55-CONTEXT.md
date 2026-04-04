# Phase 55: Database Foundation + Fingerprint Algorithm - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The database tables and the fingerprint algorithm are locked in — every downstream phase can query device trust without worrying about schema changes or hash instability.

Requirements: DB-01, DB-02, DB-03, FP-01, FP-02, FP-03, FP-04

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, research findings, and codebase conventions to guide decisions.

Key research findings to honor:
- Exclude userAgent from fingerprint hash (browser updates cause re-verification storms)
- Use screen dimensions + color depth + timezone + language for fingerprint
- Hash OTP codes before DB storage (SHA-256)
- device_verification_codes needs attempt_count and invalidated columns
- Use profile_id (not user_id) to match existing FK convention
- checkTrustedDevice must enforce 90-day rolling window via last_used_at
- Cookie: goya_device_fp, SameSite=Lax, 365 days, httpOnly=false

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
