// src/components/entries/InstallmentTracker.jsx
import React from 'react';
import { calculateProgressPercentage } from '../../utils/calculations';
import { INSTALLMENT_STATUS, PAYMENT_FREQUENCY_LABELS } from '../../constants/enums';

/**
 * Receives the parent entry (for amounts/status) and the separately-fetched
 * installmentDetail object (for schedule fields).
 */
export default function InstallmentTracker({ entry, installmentDetail, onAddPayment }) {
  // installmentDetail is fetched separately by EntryDetails from /api/installments/entry/{id}
  const details = installmentDetail || {};

  const progress = calculateProgressPercentage(
    parseFloat(entry.amountBorrowed),
    parseFloat(entry.amountRemaining)
  );

  // Prefer the backend-computed status; fall back to client-side derivation
  let currentStatus = details.currentStatus || details.status;
  if (!currentStatus) {
    const today = new Date().toISOString().split('T')[0];
    if (details.startDate && today < details.startDate) {
      currentStatus = INSTALLMENT_STATUS.NOT_STARTED;
    } else if (parseFloat(entry.amountRemaining) <= 0) {
      currentStatus = INSTALLMENT_STATUS.PAID;
    } else {
      currentStatus = INSTALLMENT_STATUS.UNPAID;
    }
  }

  const statusColors = {
    [INSTALLMENT_STATUS.PAID]: 'bg-green-100 text-green-700',
    [INSTALLMENT_STATUS.NOT_STARTED]: 'bg-gray-100 text-gray-600',
    [INSTALLMENT_STATUS.UNPAID]: 'bg-yellow-100 text-yellow-700',
    [INSTALLMENT_STATUS.DELINQUENT]: 'bg-red-100 text-red-700',
    [INSTALLMENT_STATUS.SKIPPED]: 'bg-orange-100 text-orange-700',
  };

  const handleSkipTerm = () => {
    if (window.confirm('Mark the current term as SKIPPED?')) {
      alert('Term marked as SKIPPED.');
    }
  };

  const freqKey = details.paymentFrequency;
  const freqLabel = freqKey
    ? (PAYMENT_FREQUENCY_LABELS[freqKey] || freqKey)
    : '—';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-xl font-bold text-gray-800">Installment Tracker</h3>
        <div className="space-x-2">
          <button
            onClick={handleSkipTerm}
            className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded border border-orange-200 transition text-sm font-semibold"
          >
            Skip Term
          </button>
          <button
            onClick={onAddPayment}
            className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition text-sm font-semibold"
          >
            + Add Payment
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-semibold text-gray-700">Payment Progress</span>
          <span className="font-bold text-emerald-600">{progress}% Paid</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      {Object.keys(details).length === 0 ? (
        <p className="text-sm text-gray-400 italic">No installment schedule found for this entry.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg border">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full mt-1 uppercase ${statusColors[currentStatus] || 'bg-gray-100 text-gray-600'}`}>
              {currentStatus?.replace(/_/g, ' ') || '—'}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
            <p className="font-semibold text-gray-800">{details.startDate || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
            <p className="font-semibold text-gray-800">{freqLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Terms</p>
            <p className="font-semibold text-gray-800">{details.paymentTerms ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Per Term</p>
            <p className="font-bold text-emerald-700">
              {details.paymentAmountPerTerm
                ? `₱ ${parseFloat(details.paymentAmountPerTerm).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}