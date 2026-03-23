import { describe, it, expect } from 'vitest';

describe('ConnectButton', () => {
  it('should document memberId as UUID', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/components/ConnectButton.tsx', 'utf8');
    expect(source).toContain('UUID');
  });

  it('should not reference slug-based member ID', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('app/components/ConnectButton.tsx', 'utf8');
    expect(source).not.toMatch(/memberId:\s*string;\s*\/\/\s*slug/);
  });
});
