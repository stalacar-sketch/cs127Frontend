// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLoanData } from '../context/LoanContext';
import { Wallet, TrendingUp, Users, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import { PAYMENT_STATUS } from '../constants/enums';
import logo from '../assets/MoneyCheck$Logo.png';

// Derives a display name for the borrower from a backend entry object.
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

export default function Home() {
  const { entries, people, groups, loading, error } = useLoanData();

  // Dashboard metrics
  const totalOutstanding = entries.reduce((sum, e) => sum + parseFloat(e.amountRemaining || 0), 0);
  const totalCollected = entries.reduce((sum, e) =>
    sum + (parseFloat(e.amountBorrowed || 0) - parseFloat(e.amountRemaining || 0)), 0);
  const activeLoans = entries.filter(e => parseFloat(e.amountRemaining) > 0).length;
  const recentEntries = [...entries].reverse().slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 mt-20">
        <div className="text-center text-gray-500">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Connecting to backend…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 mt-4 sm:mt-6 space-y-8">

      {/* Backend error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-teal-950 to-emerald-800 rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="MoneyCheck$ logo" className="h-14 w-auto" />
          <p className="text-emerald-100 text-sm sm:text-base">Checking your transactions, made comfy and easy.</p>
        </div>
        <Link
          to="/create"
          className="bg-white text-emerald-900 font-bold px-6 py-3 rounded-lg shadow hover:bg-emerald-50 transition whitespace-nowrap"
        >
          + New Entry
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg flex-shrink-0"><TrendingUp size={28} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Outstanding</p>
            <p className="text-2xl font-bold text-gray-800">
              ₱ {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg flex-shrink-0"><Wallet size={28} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Collected</p>
            <p className="text-2xl font-bold text-gray-800">
              ₱ {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0"><Users size={28} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Active Entities</p>
            <p className="text-2xl font-bold text-gray-800">
              {activeLoans} Loans · {people.filter(p => p.name !== 'Me').length} Contacts
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Activity size={20} className="text-emerald-600" /> Recent Entries
            </h2>
            <Link to="/records" className="text-sm text-emerald-700 hover:underline flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed">
              No entries yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map(entry => (
                <Link
                  key={entry.id}
                  to={`/entry/${entry.id}`}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{entry.entryName}</p>
                    <p className="text-sm text-gray-500">{getBorrowerName(entry)} · {entry.transactionType?.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      ₱ {parseFloat(entry.amountBorrowed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-600'}`}>
                      {entry.status?.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { to: '/create', label: 'Create New Loan' },
              { to: '/people', label: 'Manage People & Groups' },
              { to: '/records', label: 'View All Records' },
            ].map(({ to, label }) => (
              <Link
                key={to} to={to}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition group"
              >
                <span className="font-medium">{label}</span>
                <ArrowRight size={18} className="text-gray-400 group-hover:text-emerald-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}