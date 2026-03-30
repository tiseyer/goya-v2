# Deferred Items — Phase 10

## Out-of-scope issues discovered during execution

### Pre-existing TypeScript error in ConsentGatedScripts.tsx

- **File:** `app/components/ConsentGatedScripts.tsx:32`
- **Error:** `Conversion of type 'Window & typeof globalThis' to type 'Record<string, unknown>' may be a mistake`
- **Status:** Pre-existing; file is untracked in git. Not caused by plan 10-02 changes.
- **Fix:** Cast `window as unknown as Record<string, unknown>` instead of direct cast.
- **Priority:** Low — untracked file, does not affect secrets management functionality.
