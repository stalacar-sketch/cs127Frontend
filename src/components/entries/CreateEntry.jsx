// src/components/entries/CreateEntry.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoanData } from '../../context/LoanContext';
import { calculateInstallmentAmount } from '../../utils/calculations';
import * as api from '../../services/api';
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  PAYMENT_FREQUENCY,
  PAYMENT_FREQUENCY_LABELS,
} from '../../constants/enums';

// borrower label from entry
export const getBorrowerName = (entry) => {
  if (entry?.borrowerPerson) return entry.borrowerPerson.name;
  if (entry?.borrowerGroup) return entry.borrowerGroup.groupName;
  return '—';
};

// Derives a direction label from an entry, given the "Me" person's ID.
export const getDirection = (entry, meId) => {
  if (!entry || !meId) return null;
  if (String(entry.lender?.id) === String(meId)) return 'lent';
  if (String(entry.borrowerPerson?.id) === String(meId)) return 'borrowed';
  return null;
};

export default function CreateEntry() {
  const navigate = useNavigate();
  const { addEntry, people, groups, mePerson } = useLoanData();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // People selectable as "the other party" (not Me)
  const otherPeople = people.filter(p => p.name !== 'Me');

  const [formData, setFormData] = useState({
    direction: 'lent',          // 'lent' | 'borrowed'
    entryName: '',
    description: '',
    transactionType: TRANSACTION_TYPES.STRAIGHT_EXPENSE,
    dateBorrowed: new Date().toISOString().split('T')[0],
    borrowerType: 'person',     // 'person' | 'group' (only relevant when direction='lent')
    otherPartyId: '',           // ID of the borrower (lent) or lender (borrowed)
    amountBorrowed: '',
    notes: '',
  });

  const [installmentData, setInstallmentData] = useState({
    startDate: '',
    paymentFrequency: PAYMENT_FREQUENCY.MONTHLY,
    paymentTerms: '',
    notes: '',
  });

  const isLent = formData.direction === 'lent';
  const isBorrowed = formData.direction === 'borrowed';
  const isInstallment = formData.transactionType === TRANSACTION_TYPES.INSTALLMENT_EXPENSE;
  const isGroup = formData.transactionType === TRANSACTION_TYPES.GROUP_EXPENSE;

  // Cannot select group borrower for installment; cannot do group expense when borrowing
  const canSelectGroup = isLent && !isInstallment;

  // Transaction type options vary by direction
  const availableTypes = isBorrowed
    ? [TRANSACTION_TYPES.STRAIGHT_EXPENSE, TRANSACTION_TYPES.INSTALLMENT_EXPENSE]
    : Object.values(TRANSACTION_TYPES);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'direction') {
        // Reset borrower selection and force person-only when borrowing
        updated.otherPartyId = '';
        updated.borrowerType = 'person';
        if (value === 'borrowed' && prev.transactionType === TRANSACTION_TYPES.GROUP_EXPENSE) {
          updated.transactionType = TRANSACTION_TYPES.STRAIGHT_EXPENSE;
        }
      }
      if (name === 'transactionType') {
        // Installment forces individual borrower
        if (value === TRANSACTION_TYPES.INSTALLMENT_EXPENSE) {
          updated.borrowerType = 'person';
          updated.otherPartyId = '';
        }
        // Group expense only when lending
        if (value === TRANSACTION_TYPES.GROUP_EXPENSE) {
          updated.borrowerType = 'group';
          updated.otherPartyId = '';
        }
      }
      if (name === 'borrowerType') updated.otherPartyId = '';
      return updated;
    });
  };

  const handleInstallmentChange = (e) => {
    const { name, value } = e.target;
    setInstallmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!mePerson) {
      setFormError('Backend not ready — "Me" person not found. Is the server running?');
      return;
    }
    if (!formData.otherPartyId) {
      setFormError(isLent ? 'Please select a borrower.' : 'Please select the lender (who you borrowed from).');
      return;
    }

    setSubmitting(true);
    try {
      let payload;

      if (isLent) {
        // Me is the LENDER
        payload = {
          entryName: formData.entryName,
          description: formData.description || null,
          transactionType: formData.transactionType,
          dateBorrowed: formData.dateBorrowed || null,
          amountBorrowed: parseFloat(formData.amountBorrowed),
          notes: formData.notes || null,
          lender: { id: mePerson.id },
          borrowerPerson: formData.borrowerType === 'person' ? { id: formData.otherPartyId } : null,
          borrowerGroup: formData.borrowerType === 'group' ? { id: formData.otherPartyId } : null,
        };
      } else {
        // Me is the BORROWER — the other party is the LENDER
        payload = {
          entryName: formData.entryName,
          description: formData.description || null,
          transactionType: formData.transactionType,
          dateBorrowed: formData.dateBorrowed || null,
          amountBorrowed: parseFloat(formData.amountBorrowed),
          notes: formData.notes || null,
          lender: { id: formData.otherPartyId },
          borrowerPerson: { id: mePerson.id },
          borrowerGroup: null,
        };
      }

      const created = await addEntry(payload);

      // Save installment details if applicable
      if (isInstallment && installmentData.paymentTerms) {
        await api.saveInstallment(created.id, {
          startDate: installmentData.startDate,
          paymentFrequency: installmentData.paymentFrequency,
          paymentTerms: parseInt(installmentData.paymentTerms, 10),
          notes: installmentData.notes || null,
        });
      }

      navigate(`/entry/${created.id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to create entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const computedPerTerm =
    isInstallment && formData.amountBorrowed && installmentData.paymentTerms
      ? calculateInstallmentAmount(
        parseFloat(formData.amountBorrowed),
        parseInt(installmentData.paymentTerms, 10)
      )
      : null;

  // Label helpers
  const otherPartyLabel = isLent ? 'Select Borrower' : 'Select Lender (who you borrowed from)';
  const meRoleLabel = isLent ? 'Lender (You)' : 'Borrower (You)';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white shadow-md rounded-xl mt-6 sm:mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Loan Entry</h2>

      {/* Direction Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => handleChange({ target: { name: 'direction', value: 'lent' } })}
          className={`py-3 rounded-lg font-semibold text-sm transition ${isLent ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
          💸 I Lent Money
        </button>
        <button
          type="button"
          onClick={() => handleChange({ target: { name: 'direction', value: 'borrowed' } })}
          className={`py-3 rounded-lg font-semibold text-sm transition ${isBorrowed ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
          📥 I Borrowed Money
        </button>
      </div>

      {/* Direction context banner */}
      <div className={`text-xs rounded-lg px-4 py-2 mb-6 font-medium ${isLent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
        {isLent
          ? '✅ You are the lender. Someone borrowed money from you.'
          : '📥 You are the borrower. You borrowed money from someone else.'}
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Entry Name *</label>
            <input
              required name="entryName" value={formData.entryName}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g. Dinner at Antonio's"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction Type *</label>
            <select
              name="transactionType" value={formData.transactionType}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            >
              {availableTypes.map(val => (
                <option key={val} value={val}>
                  {TRANSACTION_TYPE_LABELS[val] || val}
                </option>
              ))}
            </select>
            {isBorrowed && (
              <p className="text-xs text-gray-400 mt-1">Group Expense not available when borrowing.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (₱) *</label>
            <input
              required type="number" step="0.01" min="0.01"
              name="amountBorrowed" value={formData.amountBorrowed}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date" name="dateBorrowed" value={formData.dateBorrowed}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          {/* Me's role — read-only display */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{meRoleLabel}</label>
            <input
              readOnly value="Me (You)"
              className="mt-1 w-full border border-gray-200 rounded-md p-2 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              name="description" value={formData.description}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Reason or item"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input
              name="notes" value={formData.notes}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Any additional info"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Receipt / Proof</label>
            <input type="file" accept="image/*" className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white" />
          </div>
        </div>

        {/* Other Party Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          {/* Only show borrower type toggle when lending (not borrowing) */}
          {isLent && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Borrower Type</label>
              <select
                name="borrowerType" value={formData.borrowerType}
                onChange={handleChange}
                disabled={!canSelectGroup}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100"
              >
                <option value="person">Individual Person</option>
                {canSelectGroup && <option value="group">Group of People</option>}
              </select>
            </div>
          )}

          <div className={isLent ? '' : 'sm:col-span-2'}>
            <label className="block text-sm font-medium text-gray-700">{otherPartyLabel} *</label>
            {isLent && formData.borrowerType === 'group' ? (
              <select
                required name="otherPartyId" value={formData.otherPartyId}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">— Select a group —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
              </select>
            ) : (
              <select
                required name="otherPartyId" value={formData.otherPartyId}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">— Select a person —</option>
                {otherPeople.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {otherPeople.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No contacts yet — add them on the People &amp; Groups page first.
              </p>
            )}
          </div>
        </div>

        {/* Installment Details */}
        {isInstallment && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
            <h3 className="font-semibold text-blue-800">Installment Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  required type="date" name="startDate"
                  value={installmentData.startDate}
                  onChange={handleInstallmentChange}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency *</label>
                <select
                  name="paymentFrequency" value={installmentData.paymentFrequency}
                  onChange={handleInstallmentChange}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                >
                  {Object.entries(PAYMENT_FREQUENCY).map(([key, val]) => (
                    <option key={key} value={val}>{PAYMENT_FREQUENCY_LABELS[key]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Terms *</label>
                <input
                  required type="number" min="1" name="paymentTerms"
                  value={installmentData.paymentTerms}
                  onChange={handleInstallmentChange}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>
            {computedPerTerm !== null && (
              <p className="text-sm text-blue-700">
                <strong>Computed per term:</strong>{' '}
                ₱{computedPerTerm.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !mePerson}
          className={`w-full text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${isLent ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {submitting ? 'Creating…' : isLent ? '💸 Create Lending Entry' : '📥 Create Borrowing Entry'}
        </button>
      </form>
    </div>
  );
}