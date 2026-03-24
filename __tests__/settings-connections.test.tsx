import { describe, it, expect } from 'vitest';

describe('Settings Connections Page', () => {
  it('should be a client component', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain("'use client'");
  });

  it('should use useConnections hook', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain('useConnections');
  });

  it('should have My Connections tab filtering peer connections (CONN-01)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain("'My Connections'");
    expect(source).toContain("'peer'");
  });

  it('should define all required tabs', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain("'My Connections'");
    expect(source).toContain("'My Mentors'");
    expect(source).toContain("'My Mentees'");
    expect(source).toContain("'My Faculty'");
    expect(source).toContain("'My Schools'");
  });

  it('should have Principal Teacher tab for school owners', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain("'Principal Teacher'");
    expect(source).toContain('isSchoolOwner');
  });

  it('should show status badges for connections (CONN-02)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain('Badge');
    expect(source).toContain('conn.status');
  });

  it('should call removeConnection for accepted connections (CONN-03)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain('removeConnection');
    // Remove button only for accepted
    expect(source).toContain("conn.status === 'accepted'");
  });

  it('should filter mentors by type mentorship and role receiver', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain("'mentorship'");
    expect(source).toContain("'receiver'");
  });

  it('should check school ownership via schools table', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/settings/connections/page.tsx', 'utf8');
    expect(source).toContain("from('schools')");
    expect(source).toContain("'owner_id'");
  });
});
