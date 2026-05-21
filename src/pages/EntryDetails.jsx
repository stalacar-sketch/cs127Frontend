// src/pages/EntryDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { TRANSACTION_TYPES, PAYMENT_STATUS, TRANSACTION_TYPE_LABELS } from '../constants/enums';
import { calculateProgressPercentage } from '../utils/calculations';
import InstallmentTracker from '../components/entries/InstallmentTracker';
import GroupAllocation from '../components/entries/GroupAllocation';
import * as api from '../services/api';

// Returns 'lent' if Me is the lender, 'borrowed' if Me is the borrower.
const getDirection = (entry, meId) => {
  if (!entry || !meId) return null;
  if (String(entry.lender?.id) === String(meId)) return 'lent';
  if (String(entry.borrowerPerson?.id) === String(meId)) return 'borrowed';
  return null;
};

const getBorrowerName = (entry) => {
  if (entry?.borrowerPerson) return entry.borrowerPerson.name;
  if (entry?.borrowerGroup) return entry.borrowerGroup.groupName;
  return '—';
};

const STATUS_COLORS = {
  [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-700',
  [PAYMENT_STATUS.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-700',
  [PAYMENT_STATUS.UNPAID]: 'bg-red-100 text-red-700',
};

export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entries, updateEntryById, deleteEntryById, refreshEntry, mePerson } = useLoanData();

  const entry = entries.find(e => String(e.id) === String(id));

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    payeeId: '',
    notes: '',
  });

  const [editData, setEditData] = useState({
    entryName: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (entry) {
      setEditData({
        entryName: entry.entryName,
        description: entry.description || '',
        notes: entry.notes || '',
      });
      if (entry.borrowerPerson && !paymentData.payeeId) {
        setPaymentData(prev => ({ ...prev, payeeId: entry.borrowerPerson.id }));
      }
    }
  }, [entry]);

  const loadPayments = async () => {
    if (!id) return;
    setPaymentsLoading(true);
    try {
      const data = await api.fetchPaymentsForEntry(id);
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, [id]);

  if (!entry) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Entry Not Found</h2>
        <Link to="/records" className="text-emerald-600 mt-4 inline-block hover:underline">← Back to Records</Link>
      </div>
    );
  }

  const borrowerName = getBorrowerName(entry);
  const lenderName = entry.lender?.name || '—';
  const isGroup = entry.transactionType === TRANSACTION_TYPES.GROUP_EXPENSE;
  const isInstallment = entry.transactionType === TRANSACTION_TYPES.INSTALLMENT_EXPENSE;
  const direction = getDirection(entry, mePerson?.id);
  const directionBadge = direction === 'lent'
    ? <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">💸 You Lent</span>
    : direction === 'borrowed'
      ? <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">📥 You Borrowed</span>
      : null;
  const progress = calculateProgressPercentage(parseFloat(entry.amountBorrowed), parseFloat(entry.amountRemaining));
  const payeeOptions = entry.borrowerPerson ? [entry.borrowerPerson] : (entry.borrowerGroup?.members || []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    setPageError('');
    try {
      await updateEntryById(entry.id, editData);
      setIsEditing(false);
    } catch (err) {
      setPageError('Failed to save: ' + err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPageError('');
    const amount = parseFloat(paymentData.paymentAmount);
    const remaining = parseFloat(entry.amountRemaining);
    if (amount <= 0 || amount > remaining) {
      setPageError(`Amount must be > 0 and ≤ ₱${remaining.toLocaleString()}`);
      return;
    }
    if (!paymentData.payeeId) { setPageError('Select a payee.'); return; }
    setSubmittingPayment(true);
    try {
      await api.submitPayment({
        entry: { id: entry.id },
        payee: { id: paymentData.payeeId },
        paymentDate: paymentData.paymentDate,
        paymentAmount: amount,
        notes: paymentData.notes || null,
      });
      await Promise.all([loadPayments(), refreshEntry(entry.id)]);
      setShowPaymentForm(false);
      setPaymentData(prev => ({ ...prev, paymentAmount: '', notes: '' }));
    } catch (err) {
      setPageError('Payment failed: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry permanently?')) return;
    try {
      await deleteEntryById(entry.id);
      navigate('/records');
    } catch (err) {
      setPageError('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 mt-4 sm:mt-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Link to="/records" className="text-gray-500 hover:text-emerald-600 text-sm">← Back to Records</Link>
        <div className="space-x-3">
          <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-emerald-700 hover:underline">
            {isEditing ? 'Cancel' : 'Edit Entry'}
          </button>
          <button onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:text-red-800">Delete</button>
        </div>
      </div>

      {pageError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{pageError}</div>}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Edit Entry</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entry Name *</label>
              <input required value={editData.entryName} onChange={e => setEditData({ ...editData, entryName: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2" rows="3" />
            </div>
            <button type="submit" disabled={submittingEdit}
              className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {submittingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="border-b pb-4 mb-4 flex flex-wrap justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{entry.entryName}</h2>
              <p className="text-sm text-gray-400 font-mono mt-1">Ref: {entry.referenceId}</p>
              {directionBadge && <div className="mt-2">{directionBadge}</div>}
              {entry.description && <p className="text-gray-600 mt-2">{entry.description}</p>}
              {entry.notes && <p className="text-sm text-gray-500 italic mt-1">Notes: {entry.notes}</p>}
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-600'}`}>
                {entry.status?.replace('_', ' ')}
              </span>
              <p className="text-sm text-gray-500 mt-2">{TRANSACTION_TYPE_LABELS[entry.transactionType] || entry.transactionType}</p>
              {entry.dateFullyPaid && <p className="text-xs text-green-600 font-bold mt-1">Paid on: {entry.dateFullyPaid}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div><p className="text-xs text-gray-500 uppercase">Borrower</p><p className="font-semibold text-sm">{borrowerName}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Lender</p><p className="font-semibold text-sm">{lenderName}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Date</p><p className="font-semibold text-sm">{entry.dateBorrowed || '—'}</p></div>
          <div className="col-span-1">
            <p className="text-xs text-gray-500 uppercase">Type</p>
            <p className="font-semibold text-sm">{TRANSACTION_TYPE_LABELS[entry.transactionType] || entry.transactionType}</p>
          </div>
          <div><p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="font-bold text-lg">₱ {parseFloat(entry.amountBorrowed).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Remaining</p>
            <p className={`font-bold text-lg ${parseFloat(entry.amountRemaining) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₱ {parseFloat(entry.amountRemaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p></div>
        </div>

        {progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span><span className="font-bold text-emerald-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {isInstallment && <InstallmentTracker entry={entry} onAddPayment={() => setShowPaymentForm(true)} />}
      {isGroup && <GroupAllocation entry={entry} />}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h3 className="text-xl font-bold text-gray-800">Payment History</h3>
          {parseFloat(entry.amountRemaining) > 0 && (
            <button onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm">
              {showPaymentForm ? 'Cancel' : '+ Log Payment'}
            </button>
          )}
        </div>

        {showPaymentForm && (
          <form onSubmit={handlePaymentSubmit} className="bg-green-50 p-4 rounded-lg border border-emerald-100 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input required type="date" value={paymentData.paymentDate}
                  onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input required type="number" step="0.01" min="0.01" max={entry.amountRemaining}
                  value={paymentData.paymentAmount}
                  onChange={e => setPaymentData({ ...paymentData, paymentAmount: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payee *</label>
                <select required value={paymentData.payeeId}
                  onChange={e => setPaymentData({ ...paymentData, payeeId: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2">
                  <option value="">— Select payee —</option>
                  {payeeOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input type="text" value={paymentData.notes}
                onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2" />
            </div>
            <button type="submit" disabled={submittingPayment}
              className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {submittingPayment ? 'Saving…' : 'Save Payment'}
            </button>
          </form>
        )}

        {paymentsLoading ? (
          <p className="text-gray-400 italic text-sm">Loading payments…</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-500 italic">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wide">
                  <th className="p-3">Date</th><th className="p-3">Payee</th>
                  <th className="p-3">Amount</th><th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-gray-50">
                    <td className="p-3">{pay.paymentDate}</td>
                    <td className="p-3">{pay.payee?.name || '—'}</td>
                    <td className="p-3 font-semibold text-green-600">
                      + ₱ {parseFloat(pay.paymentAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-gray-500">{pay.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}