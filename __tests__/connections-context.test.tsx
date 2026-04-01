import { describe, it, expect } from 'vitest';

describe('ConnectionsContext (Supabase)', () => {
  it('should not reference localStorage', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).not.toContain('localStorage');
  });

  it('should use supabase client', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain("from('connections')");
  });

  it('should use memberId field not memberSlug', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain('memberId');
    expect(source).not.toContain('memberSlug');
  });

  it('should include bidirectional duplicate check in sendRequest', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain('maybeSingle');
  });

  it('should preserve notifications realtime subscription', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain('postgres_changes');
  });

  it('should join profiles for member names on initial load', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain('profiles!connections_requester_id_fkey');
    expect(source).toContain('profiles!connections_recipient_id_fkey');
    expect(source).toContain('full_name');
    expect(source).toContain('avatar_url');
  });

  it('should have removeConnection that calls supabase delete', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain('removeConnection');
    expect(source).toContain('.delete()');
  });

  it('should expose removeConnection in context provider value', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    // Check it appears in the Provider value object
    const providerMatch = source.match(/Provider value=\{\{[\s\S]*?removeConnection[\s\S]*?\}\}/);
    expect(providerMatch).not.toBeNull();
  });

  it('should expose removeConnection in ConnectionsContextType interface', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/context/ConnectionsContext.tsx', 'utf8');
    expect(source).toContain('removeConnection: (connectionId: string, otherUserId: string) => Promise<void>');
  });
});
