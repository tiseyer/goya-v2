'use client';

import { useState, useEffect } from 'react';
import type { Flow, FlowResponseStatus } from '@/lib/flows/types';

interface UserFlowRow {
  id: string;
  flowId: string;
  flowName: string;
  flowStatus: Flow['status'];
  status: FlowResponseStatus;
  startedAt: string | null;
  completedAt: string | null;
}

interface FlowOption {
  id: string;
  name: string;
}

function formatDate(value: string | null): string {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: FlowResponseStatus }) {
  const classes: Record<FlowResponseStatus, string> = {
    in_progress: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    skipped: 'bg-slate-100 text-slate-600',
    dismissed: 'bg-red-100 text-red-700',
  };
  const labels: Record<FlowResponseStatus, string> = {
    in_progress: 'In Progress',
    completed: 'Completed',
    skipped: 'Skipped',
    dismissed: 'Dismissed',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function UserFlowsSection({ userId }: { userId: string }) {
  const [rows, setRows] = useState<UserFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flowOptions, setFlowOptions] = useState<FlowOption[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [markComplete, setMarkComplete] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  async function loadFlows() {
    const res = await fetch(`/api/admin/flows/user-flows?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFlows();
    // Fetch active flows for the assign dropdown
    fetch('/api/admin/flows?status=active')
      .then(r => r.ok ? r.json() : [])
      .then((data: Flow[]) => {
        setFlowOptions(data.map(f => ({ id: f.id, name: f.name })));
        if (data.length > 0) setSelectedFlowId(data[0].id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleReset(responseId: string) {
    const res = await fetch(`/api/admin/flows/user-flows/${responseId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setRows(prev => prev.filter(r => r.id !== responseId));
    }
    setConfirmResetId(null);
  }

  async function handleMarkComplete(responseId: string) {
    const res = await fetch(`/api/admin/flows/user-flows/${responseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    if (res.ok) {
      setRows(prev =>
        prev.map(r =>
          r.id === responseId
            ? { ...r, status: 'completed', completedAt: new Date().toISOString() }
            : r
        )
      );
    }
  }

  async function handleAssign() {
    if (!selectedFlowId) return;
    setAssigning(true);
    const res = await fetch('/api/admin/flows/user-flows/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, flowId: selectedFlowId, markComplete }),
    });
    setAssigning(false);
    if (res.ok) {
      await loadFlows();
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500 py-4">Loading flows...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Flow interactions table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1B3A5C]">Flow Interactions</h2>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">No flow interactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Flow</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Started</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Completed</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-[#1B3A5C] font-medium">{row.flowName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(row.startedAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(row.completedAt)}</td>
                    <td className="px-4 py-3">
                      {confirmResetId === row.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">Reset will show this flow again on next login. Continue?</span>
                          <button
                            onClick={() => handleReset(row.id)}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmResetId(null)}
                            className="text-xs px-2 py-1 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirmResetId(row.id)}
                            className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Reset
                          </button>
                          {row.status === 'in_progress' && (
                            <button
                              onClick={() => handleMarkComplete(row.id)}
                              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Force Assign section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#1B3A5C] mb-4">Force Assign Flow</h2>

        {flowOptions.length === 0 ? (
          <p className="text-sm text-slate-500">No active flows available to assign.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide block mb-1">
                Flow
              </label>
              <select
                value={selectedFlowId}
                onChange={e => setSelectedFlowId(e.target.value)}
                className="w-full sm:w-72 border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1B3A5C] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {flowOptions.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="mark-complete"
                type="checkbox"
                checked={markComplete}
                onChange={e => setMarkComplete(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="mark-complete" className="text-sm text-[#1B3A5C]">
                Mark as completed immediately
              </label>
            </div>

            <button
              onClick={handleAssign}
              disabled={assigning || !selectedFlowId}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {assigning ? 'Assigning...' : 'Assign Flow'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
