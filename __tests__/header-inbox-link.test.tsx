import { describe, it, expect } from 'vitest';

describe('Header Inbox Link (INBOX-04)', () => {
  it('should link to /settings/inbox not /messages', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/components/Header.tsx', 'utf8');
    expect(source).toContain('/settings/inbox');
    expect(source).not.toContain('href="/messages"');
  });

  it('should show "View all" not "View all messages"', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/components/Header.tsx', 'utf8');
    expect(source).toContain('View all');
    expect(source).not.toContain('View all messages');
  });
});
