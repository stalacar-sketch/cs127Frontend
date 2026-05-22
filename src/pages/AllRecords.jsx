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
    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase whitespace-nowrap ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
    </span>
  );
};

// Common cell classes: padding + no-wrap prevents columns from squishing
const TH = 'p-4 whitespace-nowrap';
const TD = 'p-4 whitespace-nowrap';

export default function AllRecords() {
  const { entries, loading, mePerson } = useLoanData();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-6 sm:mt-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold text-white">All Financial Records</h2>
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
                <th className={TH}>Direction</th>
                <th className={TH}>Ref ID</th>
                <th className={TH}>Name</th>
                <th className={TH}>Type</th>
                <th className={TH}>Borrower</th>
                <th className={TH}>Total</th>
                <th className={TH}>Remaining</th>
                <th className={TH}>Status</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map(entry => {
                const dir = getDirection(entry, mePerson?.id);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className={TD}>
                      {dir === 'lent'
                        ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">💸 Lent</span>
                        : dir === 'borrowed'
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">📥 Borrowed</span>
                          : null}
                    </td>
                    <td className={`${TD} font-mono text-xs text-gray-400`}>{entry.referenceId}</td>
                    <td className={`${TD} font-medium text-gray-800`}>{entry.entryName}</td>
                    <td className={`${TD} text-gray-600`}>{entry.transactionType?.replace(/_/g, ' ')}</td>
                    <td className={`${TD} text-gray-800`}>{getBorrowerName(entry)}</td>
                    <td className={`${TD} font-semibold text-gray-800`}>
                      ₱ {parseFloat(entry.amountBorrowed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`${TD} font-semibold text-gray-800`}>
                      ₱ {parseFloat(entry.amountRemaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={TD}>{getStatusBadge(entry.status)}</td>
                    <td className={TD}>
                      <Link to={`/entry/${entry.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}