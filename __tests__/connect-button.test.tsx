import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConnectButton from '@/app/components/ConnectButton';
import type { ConnRecord } from '@/app/context/ConnectionsContext';

// ─── Mock next/navigation ─────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ─── Mock ConnectionsContext ──────────────────────────────────────────────────

const mockGetStatus = vi.fn<[], ReturnType<import('@/app/context/ConnectionsContext').ConnectionsContextType['getStatus']>>(() => null);
const mockSendRequest = vi.fn();
const mockAcceptRequest = vi.fn();
const mockDeclineRequest = vi.fn();
const mockConnections: Record<string, ConnRecord> = {};

vi.mock('@/app/context/ConnectionsContext', () => ({
  useConnections: () => ({
    getStatus: mockGetStatus,
    sendRequest: mockSendRequest,
    acceptRequest: mockAcceptRequest,
    declineRequest: mockDeclineRequest,
    connections: mockConnections,
  }),
}));

// ─── Helper ──────────────────────────────────────────────────────────────────

interface ConnectButtonProps {
  memberId?: string;
  memberName?: string;
  memberPhoto?: string;
  firstName?: string;
  viewerRole?: string | null;
  profileRole?: string;
  isOwnProfile?: boolean;
  isOwnSchool?: boolean;
}

function renderButton(props: ConnectButtonProps = {}) {
  const defaults: Required<ConnectButtonProps> = {
    memberId: 'test-id',
    memberName: 'Test User',
    memberPhoto: '',
    firstName: 'Test',
    viewerRole: 'teacher',
    profileRole: 'teacher',
    isOwnProfile: false,
    isOwnSchool: false,
  };
  return render(<ConnectButton {...defaults} {...props} />);
}

// ─── Reset mocks before each test ────────────────────────────────────────────

beforeEach(() => {
  mockGetStatus.mockReturnValue(null);
  Object.keys(mockConnections).forEach(k => delete mockConnections[k]);
});

// ─── Existing tests (must remain passing) ────────────────────────────────────

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

// ─── Role-aware CTA rendering ────────────────────────────────────────────────

describe('role-aware CTA rendering', () => {
  it('renders "Request Mentorship" for student viewing teacher', () => {
    renderButton({ viewerRole: 'student', profileRole: 'teacher' });
    expect(screen.getByText('Request Mentorship')).toBeInTheDocument();
  });

  it('renders "Apply as Faculty" for teacher viewing school', () => {
    renderButton({ viewerRole: 'teacher', profileRole: 'school' });
    expect(screen.getByText('Apply as Faculty')).toBeInTheDocument();
  });

  it('renders "Apply as Faculty" for wellness_practitioner viewing school', () => {
    renderButton({ viewerRole: 'wellness_practitioner', profileRole: 'school' });
    expect(screen.getByText('Apply as Faculty')).toBeInTheDocument();
  });

  it('renders "Manage School" when isOwnSchool=true', () => {
    renderButton({ viewerRole: 'teacher', profileRole: 'school', isOwnSchool: true });
    expect(screen.getByText('Manage School')).toBeInTheDocument();
  });

  it('renders "Connect with Test" for teacher viewing teacher (default peer)', () => {
    renderButton({ viewerRole: 'teacher', profileRole: 'teacher' });
    expect(screen.getByText('Connect with Test')).toBeInTheDocument();
  });

  it('renders null when isOwnProfile=true', () => {
    const { container } = renderButton({ isOwnProfile: true });
    expect(container.innerHTML).toBe('');
  });
});

// ─── Pending-sent type-aware labels ──────────────────────────────────────────

describe('pending-sent type-aware labels', () => {
  it('shows "Request Sent" for pending_sent with type=peer', () => {
    mockGetStatus.mockReturnValue('pending_sent');
    mockConnections['test-id'] = {
      connectionId: 'conn-1',
      status: 'pending_sent',
      memberId: 'test-id',
      memberName: 'Test User',
      memberPhoto: '',
      role: 'requester',
      type: 'peer',
    };
    renderButton();
    expect(screen.getByText('Request Sent')).toBeInTheDocument();
  });

  it('shows "Mentorship Requested" for pending_sent with type=mentorship', () => {
    mockGetStatus.mockReturnValue('pending_sent');
    mockConnections['test-id'] = {
      connectionId: 'conn-2',
      status: 'pending_sent',
      memberId: 'test-id',
      memberName: 'Test User',
      memberPhoto: '',
      role: 'requester',
      type: 'mentorship',
    };
    renderButton();
    expect(screen.getByText('Mentorship Requested')).toBeInTheDocument();
  });

  it('shows "Application Sent" for pending_sent with type=faculty', () => {
    mockGetStatus.mockReturnValue('pending_sent');
    mockConnections['test-id'] = {
      connectionId: 'conn-3',
      status: 'pending_sent',
      memberId: 'test-id',
      memberName: 'Test User',
      memberPhoto: '',
      role: 'requester',
      type: 'faculty',
    };
    renderButton();
    expect(screen.getByText('Application Sent')).toBeInTheDocument();
  });
});

// ─── Pending received ─────────────────────────────────────────────────────────

describe('pending_received state', () => {
  beforeEach(() => {
    mockGetStatus.mockReturnValue('pending_received');
    mockConnections['test-id'] = {
      connectionId: 'conn-recv',
      status: 'pending_received',
      memberId: 'test-id',
      memberName: 'Test User',
      memberPhoto: '',
      role: 'receiver',
      type: 'peer',
    };
  });

  it('shows helper text "Test wants to connect"', () => {
    renderButton();
    expect(screen.getByText('Test wants to connect')).toBeInTheDocument();
  });

  it('shows Accept Request button', () => {
    renderButton();
    expect(screen.getByText('Accept Request')).toBeInTheDocument();
  });

  it('shows Decline button', () => {
    renderButton();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  it('calls acceptRequest when Accept is clicked', () => {
    renderButton();
    fireEvent.click(screen.getByText('Accept Request'));
    expect(mockAcceptRequest).toHaveBeenCalledWith('conn-recv', 'test-id');
  });

  it('calls declineRequest when Decline is clicked', () => {
    renderButton();
    fireEvent.click(screen.getByText('Decline'));
    expect(mockDeclineRequest).toHaveBeenCalledWith('conn-recv', 'test-id');
  });
});

// ─── Accepted state ──────────────────────────────────────────────────────────

describe('accepted state', () => {
  beforeEach(() => {
    mockGetStatus.mockReturnValue('accepted');
    mockConnections['test-id'] = {
      connectionId: 'conn-acc',
      status: 'accepted',
      memberId: 'test-id',
      memberName: 'Test User',
      memberPhoto: '',
      role: 'requester',
      type: 'peer',
    };
  });

  it('shows "Connected" label', () => {
    renderButton();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows "Message" button', () => {
    renderButton();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });
});
