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
});
