'use client';

import { useState, useTransition } from 'react';
import { refundOrder, cancelSubscription, resendInvoice, getInvoicePdfUrl } from './actions';

type Props = {
  stripeId: string;
  orderType: 'one_time' | 'recurring';
};

export default function OrderActions({ stripeId, orderType }: Props) {
  const [isPending, startTransition] = useTransition();
  const [partialAmount, setPartialAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function handleFullRefund() {
    startTransition(async () => {
      const result = await refundOrder(stripeId);
      if (result.success) {
        showMessage('success', 'Full refund issued successfully.');
      } else {
        showMessage('error', result.error ?? 'Refund failed.');
      }
    });
  }

  function handlePartialRefund() {
    const cents = Math.round(parseFloat(partialAmount) * 100);
    if (!cents || isNaN(cents) || cents <= 0) {
      showMessage('error', 'Please enter a valid refund amount.');
      return;
    }
    startTransition(async () => {
      const result = await refundOrder(stripeId, cents);
      if (result.success) {
        showMessage('success', `Partial refund of $${partialAmount} issued.`);
        setPartialAmount('');
      } else {
        showMessage('error', result.error ?? 'Refund failed.');
      }
    });
  }

  function handleScheduleCancel() {
    startTransition(async () => {
      const result = await cancelSubscription(stripeId, 'schedule');
      if (result.success) {
        showMessage('success', 'Subscription scheduled to cancel at period end.');
      } else {
        showMessage('error', result.error ?? 'Failed to schedule cancellation.');
      }
    });
  }

  function handleImmediateCancel() {
    if (!confirm('This will immediately cancel the subscription. Continue?')) return;
    startTransition(async () => {
      const result = await cancelSubscription(stripeId, 'immediate');
      if (result.success) {
        showMessage('success', 'Subscription canceled immediately.');
      } else {
        showMessage('error', result.error ?? 'Failed to cancel subscription.');
      }
    });
  }

  function handleResendInvoice() {
    startTransition(async () => {
      const result = await resendInvoice(stripeId);
      if (result.success) {
        showMessage('success', 'Invoice resent to customer.');
      } else {
        showMessage('error', result.error ?? 'Failed to resend invoice.');
      }
    });
  }

  function handleDownloadPdf() {
    startTransition(async () => {
      const url = await getInvoicePdfUrl(stripeId);
      if (url) {
        window.open(url, '_blank');
      } else {
        showMessage('error', 'No PDF available for this order.');
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <h2 className="font-semibold text-lg text-[#1B3A5C] mb-4">Actions</h2>

      {message && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Refund section */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[#374151] mb-2">Refund</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleFullRefund}
            disabled={isPending}
            className="h-9 px-4 text-sm font-medium text-white bg-[#1B3A5C] rounded-lg hover:bg-[#1B3A5C]/90 transition-colors disabled:opacity-50 w-full"
          >
            {isPending ? 'Processing...' : 'Issue Full Refund'}
          </button>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                className="w-full h-9 pl-7 pr-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30"
              />
            </div>
            <button
              onClick={handlePartialRefund}
              disabled={isPending || !partialAmount}
              className="h-9 px-4 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Partial Refund
            </button>
          </div>
        </div>
      </div>

      {/* Cancel subscription (only for recurring) */}
      {orderType === 'recurring' && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[#374151] mb-2">Cancel Subscription</h3>
          <div className="flex gap-2">
            <button
              onClick={handleScheduleCancel}
              disabled={isPending}
              className="flex-1 h-9 px-4 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Schedule Cancellation
            </button>
            <button
              onClick={handleImmediateCancel}
              disabled={isPending}
              className="flex-1 h-9 px-4 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Suspend Immediately
            </button>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Schedule: cancels at period end. Suspend: cancels now.
          </p>
        </div>
      )}

      {/* Invoice section */}
      <div>
        <h3 className="text-sm font-semibold text-[#374151] mb-2">Invoice</h3>
        <div className="flex gap-2">
          <button
            onClick={handleResendInvoice}
            disabled={isPending}
            className="flex-1 h-9 px-4 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Resend Invoice
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isPending}
            className="flex-1 h-9 px-4 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
