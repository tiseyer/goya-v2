import { describe, it, expect } from 'vitest';

describe('Settings Inbox Page', () => {
  it('should be a client component', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/inbox/page.tsx', 'utf8');
    expect(source).toContain("'use client'");
  });

  it('should use useConnections hook (INBOX-01)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/inbox/page.tsx', 'utf8');
    expect(source).toContain('useConnections');
  });

  it('should filter for pending_received status (INBOX-01)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/inbox/page.tsx', 'utf8');
    expect(source).toContain("'pending_received'");
  });

  it('should wire acceptRequest and declineRequest (INBOX-02)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/inbox/page.tsx', 'utf8');
    expect(source).toContain('acceptRequest');
    expect(source).toContain('declineRequest');
  });

  it('should have filter options for all, peer, mentorship, faculty (INBOX-03)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/inbox/page.tsx', 'utf8');
    expect(source).toContain("'all'");
    expect(source).toContain("'peer'");
    expect(source).toContain("'mentorship'");
    expect(source).toContain("'faculty'");
  });

  it('should show empty state when no incoming requests', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/inbox/page.tsx', 'utf8');
    expect(source).toContain('No incoming requests');
  });
});
