# Requirements: GOYA v2 — Mattea AI Quick Answer in Global Search

**Defined:** 2026-04-03
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.21 Requirements

### Intent Detection

- [ ] **INTENT-01**: isQuestion() returns true for English question words (how, what, when, etc.)
- [ ] **INTENT-02**: isQuestion() returns true for German question words (wie, was, wann, etc.)
- [ ] **INTENT-03**: isQuestion() returns true for queries with question marks
- [ ] **INTENT-04**: isQuestion() returns true for long queries (5+ words)
- [ ] **INTENT-05**: isQuestion() returns false for names and short keywords

### Mattea API

- [ ] **API-01**: POST /api/search/mattea-hint accepts { question } and returns { answer }
- [ ] **API-02**: Uses existing Mattea/OpenAI infrastructure with system prompt
- [ ] **API-03**: Max 150 tokens, non-streaming completion
- [ ] **API-04**: 3-second timeout returns { answer: null } on failure
- [ ] **API-05**: In-memory cache (60s TTL) for repeated questions

### UI Component

- [ ] **UI-01**: MattеaSearchHint renders at top of search results for questions
- [ ] **UI-02**: Shows Sparkles icon, "Mattea · AI Answer" header, answer text
- [ ] **UI-03**: Loading skeleton with pulse animation while fetching
- [ ] **UI-04**: "Continue this conversation →" link to /settings/help?q=
- [ ] **UI-05**: Language-aware link text (English/German detection)
- [ ] **UI-06**: Does not render if answer is null/failed

### Search Integration

- [ ] **SEARCH-01**: Mattea hint fetch runs in parallel with normal search
- [ ] **SEARCH-02**: Hint appears only when isQuestion() returns true
- [ ] **SEARCH-03**: Hint clears when query changes to non-question
- [ ] **SEARCH-04**: Keyboard navigation includes hint as index 0

### Help Handoff

- [ ] **HELP-01**: /settings/help reads ?q= search param on mount
- [ ] **HELP-02**: Pre-fills chat input and auto-submits after 500ms delay

## Out of Scope

| Feature | Reason |
|---------|--------|
| Streaming AI response in search | Keep it simple — non-streaming for quick hint |
| Multi-turn conversation in search | Full chat is at /settings/help |
| AI answer for non-questions | Intent detection gates this |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTENT-01 | Phase 1 | Pending |
| INTENT-02 | Phase 1 | Pending |
| INTENT-03 | Phase 1 | Pending |
| INTENT-04 | Phase 1 | Pending |
| INTENT-05 | Phase 1 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 2 | Pending |
| API-05 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| SEARCH-01 | Phase 4 | Pending |
| SEARCH-02 | Phase 4 | Pending |
| SEARCH-03 | Phase 4 | Pending |
| SEARCH-04 | Phase 4 | Pending |
| HELP-01 | Phase 5 | Pending |
| HELP-02 | Phase 5 | Pending |

**Coverage:**
- v1.21 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
