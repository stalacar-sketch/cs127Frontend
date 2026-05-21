// src/pages/AllRecords.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { PAYMENT_STATUS } from '../constants/enums';

const getBorrowerName = (entry) => {
  if (entry?.borrowerPerson) return entry.borrowerPerson.name;
  if (entry?.borrowerGroup) return entry.borrowerGroup.groupName;
  return '—';
};

// Returns 'lent' | 'borrowed' | null based on whether Me is the lender or borrower.
const getDirection = (entry, meId) => {
  if (!entry || !meId) return null;
  if (String(entry.lender?.id) === String(meId)) return 'lent';
  if (String(entry.borrowerPerson?.id) === String(meId)) return 'borrowed';
  return null;
};

const getStatusBadge = (status) => {
  const map = {
    [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800',
    [PAYMENT_STATUS.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-800',
    [PAYMENT_STATUS.UNPAID]: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
    </span>
  );
};

export default function AllRecords() {
  const { entries, loading, mePerson } = useLoanData();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 mt-6 sm:mt-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold text-gray-800">All Financial Records</h2>
        <Link to="/create" className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm font-semibold">
          + New Entry
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 italic">Loading records…</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">
            No entries found. Click &ldquo;New Entry&rdquo; to start tracking.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4">Direction</th>
                <th className="p-4">Ref ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Borrower</th>
                <th className="p-4">Total</th>
                <th className="p-4">Remaining</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    {(() => {
                      const dir = getDirection(entry, mePerson?.id);
                      return dir === 'lent'
                        ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">💸 Lent</span>
                        : dir === 'borrowed'
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">📥 Borrowed</span>
                          : null;
                    })()}
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-400">{entry.referenceId}</td>
                  <td className="p-4 font-medium text-gray-800">{entry.entryName}</td>
                  <td className="p-4 text-gray-600">{entry.transactionType?.replace('_', ' ')}</td>
                  <td className="p-4 text-gray-800">{getBorrowerName(entry)}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    ₱ {parseFloat(entry.amountBorrowed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 font-semibold text-gray-800">
                    ₱ {parseFloat(entry.amountRemaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">{getStatusBadge(entry.status)}</td>
                  <td className="p-4">
                    <Link to={`/entry/${entry.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}