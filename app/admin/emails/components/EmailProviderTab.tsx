'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmailProviderTab() {
  // Provider config
  const [fromName, setFromName] = useState('GOYA');
  const [fromEmail, setFromEmail] = useState('hello@globalonlineyogaassociation.org');
  const [replyTo, setReplyTo] = useState('member@globalonlineyogaassociation.org');
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Test email
  const [testRecipient, setTestRecipient] = useState('');
  const [testTemplate, setTestTemplate] = useState('simple');
  const [templates, setTemplates] = useState<{ key: string; name: string }[]>([]);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    async function loadConfig() {
      setConfigLoading(true);
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['email_from_name', 'email_from_email', 'email_reply_to']);

      if (data) {
        const map: Record<string, string> = {};
        (data as Array<{ key: string; value: string }>).forEach(r => {
          map[r.key] = r.value ?? '';
        });
        if (map.email_from_name) setFromName(map.email_from_name);
        if (map.email_from_email) setFromEmail(map.email_from_email);
        if (map.email_reply_to) setReplyTo(map.email_reply_to);
      }
      setConfigLoading(false);
    }

    async function loadTemplates() {
      const { data } = await supabase
        .from('email_templates')
        .select('template_key, name')
        .order('name');
      if (data) {
        setTemplates(data.map((t) => ({ key: t.template_key, name: t.name })));
      }
    }

    loadConfig();
    loadTemplates();
  }, []);

  async function saveConfig() {
    setConfigSaving(true);
    setConfigSaved(false);

    const { data: { user } } = await supabase.auth.getUser();

    const rows = [
      { key: 'email_from_name', value: fromName },
      { key: 'email_from_email', value: fromEmail },
      { key: 'email_reply_to', value: replyTo },
    ];

    for (const row of rows) {
      await supabase
        .from('site_settings')
        .upsert(
          { ...row, updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
          { onConflict: 'key' },
        );
    }

    setConfigSaving(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  }

  async function handleSendTest() {
    if (!testRecipient.trim()) return;
    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testRecipient.trim(),
          templateKey: testTemplate === 'simple' ? undefined : testTemplate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: `Test email sent to ${testRecipient}` });
        setConnectionStatus('connected');
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test email' });
        setConnectionStatus('error');
      }
    } catch {
      setTestResult({ success: false, message: 'Network error' });
      setConnectionStatus('error');
    } finally {
      setTestSending(false);
    }
  }

  if (configLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Provider Configuration */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Provider Configuration</h3>
            <p className="text-sm text-slate-500 mt-0.5">Resend email delivery service</p>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Connected
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Error
              </span>
            )}
            {connectionStatus === 'unknown' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Not tested
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input
              type="password"
              value="••••••••••••"
              disabled
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              Managed via <code className="bg-slate-100 px-1 py-0.5 rounded">RESEND_API_KEY</code> environment variable
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Email</label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reply-To Email</label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveConfig}
              disabled={configSaving}
              className="text-sm px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {configSaving ? 'Saving...' : 'Save'}
            </button>
            {configSaved && (
              <span className="text-sm text-emerald-600">Settings saved</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Send Test Email */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Send Test Email</h3>
        <p className="text-sm text-slate-500 mb-4">Verify your email configuration is working correctly</p>

        <div className="grid gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient email</label>
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What to send</label>
            <select
              value={testTemplate}
              onChange={(e) => setTestTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="simple">Simple Test</option>
              <optgroup label="Templates">
                {templates.map((t) => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSendTest}
              disabled={testSending || !testRecipient.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {testSending ? 'Sending...' : 'Send Test'}
            </button>
            {testResult && (
              <span className={`text-sm ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
