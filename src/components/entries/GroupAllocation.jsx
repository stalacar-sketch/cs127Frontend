// src/components/entries/GroupAllocation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { divideEqually } from '../../utils/calculations';
import * as api from '../../services/api';

export default function GroupAllocation({ entry }) {
  const [activeTab, setActiveTab] = useState('equal');
  const [allocations, setAllocations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Members now come directly from the entry's borrowerGroup (backend now includes them)
  const members = entry?.borrowerGroup?.members || [];

  const applyEqualSplit = useCallback(() => {
    setActiveTab('equal');
    const equalSplit = divideEqually(parseFloat(entry.amountBorrowed), members);
    setAllocations(equalSplit.map(a => ({
      payee: { id: a.id, name: a.name },
      description: `Share for ${a.name}`,
      amount: a.allocatedAmount,
      percentage: a.percentage,
    })));
  }, [entry.amountBorrowed, members]);

  // Re-fetch allocations whenever a payment changes entry.amountRemaining
  // so the status column stays up to date without a page refresh.
  useEffect(() => {
    api.fetchAllocations(entry.id)
      .then(data => {
        if (data && data.length > 0) {
          setAllocations(data);
        } else if (members.length > 0) {
          applyEqualSplit();
        }
      })
      .catch(() => {
        if (members.length > 0) applyEqualSplit();
      });
  }, [entry.id, entry.amountRemaining]); // re-runs after every payment

  const handleDivideEqually = () => applyEqualSplit();

  const handleDivideByPercent = () => {
    setActiveTab('percent');
    setAllocations(members.map(m => ({
      payee: { id: m.id, name: m.name },
      description: `Share for ${m.name}`,
      amount: 0,
      percentage: 0,
    })));
  };

  const handleDivideByAmount = () => {
    setActiveTab('amount');
    setAllocations(members.map(m => ({
      payee: { id: m.id, name: m.name },
      description: `Share for ${m.name}`,
      amount: 0,
      percentage: 0,
    })));
  };

  const updateAllocation = (index, field, value) => {
    const total = parseFloat(entry.amountBorrowed);
    setAllocations(prev => prev.map((a, i) => {
      if (i !== index) return a;
      if (field === 'amount') {
        const amt = parseFloat(value) || 0;
        return { ...a, amount: amt, percentage: total > 0 ? Number(((amt / total) * 100).toFixed(2)) : 0 };
      }
      if (field === 'percentage') {
        const pct = parseFloat(value) || 0;
        return { ...a, percentage: pct, amount: Number(((pct / 100) * total).toFixed(2)) };
      }
      return { ...a, [field]: value };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = allocations.map(a => ({
        payee: { id: a.payee?.id || a.id },
        description: a.description,
        amount: a.amount,
        notes: null,
      }));
      const saved = await api.saveAllocations(entry.id, payload);
      setAllocations(saved);
    } catch (err) {
      setError('Failed to save allocations: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!members.length) return null;

  const btnClass = (tab) =>
    `px-4 py-2 text-sm font-semibold rounded-md transition ${
      activeTab === tab
        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  const statusBadge = (status) => {
    if (!status) return <span className="text-gray-400">—</span>;
    const colors = {
      PAID: 'bg-green-100 text-green-700',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
      UNPAID: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase whitespace-nowrap ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Group Payment Allocation</h3>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={handleDivideEqually} className={btnClass('equal')}>Divide Equally</button>
        <button onClick={handleDivideByPercent} className={btnClass('percent')}>By Percentage</button>
        <button onClick={handleDivideByAmount} className={btnClass('amount')}>By Amount</button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wide">
              <th className="p-3 whitespace-nowrap">Member</th>
              <th className="p-3 whitespace-nowrap">Amount (₱)</th>
              <th className="p-3 whitespace-nowrap">Percentage</th>
              <th className="p-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allocations.map((alloc, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                  {alloc.payee?.name || alloc.name}
                </td>
                <td className="p-3">
                  {activeTab === 'equal' ? (
                    <span className="font-semibold">
                      ₱ {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <input
                      type="number" step="0.01" min="0"
                      value={alloc.amount}
                      onChange={e => updateAllocation(i, 'amount', e.target.value)}
                      disabled={activeTab !== 'amount'}
                      className="border rounded px-2 py-1 w-28 disabled:bg-gray-50"
                    />
                  )}
                </td>
                <td className="p-3">
                  {activeTab === 'equal' ? (
                    <span className="text-gray-500">{alloc.percentage ?? alloc.percentageOfTotal}%</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number" step="0.01" min="0" max="100"
                        value={alloc.percentage ?? alloc.percentageOfTotal ?? 0}
                        onChange={e => updateAllocation(i, 'percentage', e.target.value)}
                        disabled={activeTab !== 'percent'}
                        className="border rounded px-2 py-1 w-20 disabled:bg-gray-50"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  )}
                </td>
                <td className="p-3">{statusBadge(alloc.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave} disabled={saving}
        className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Allocations'}
      </button>
    </div>
  );
}