// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { LoanProvider } from './context/LoanContext';
import { Menu, X } from 'lucide-react';
import logo from './assets/MoneyCheck$Logo.png';

import Home from './pages/Home';
import PeopleGroups from './pages/PeopleGroups';
import CreateEntry from './components/entries/CreateEntry';
import AllRecords from './pages/AllRecords';
import EntryDetails from './pages/EntryDetails';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/records', label: 'All Records' },
  { to: '/create', label: 'New Entry' },
  { to: '/people', label: 'People & Groups' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `transition font-medium ${isActive ? 'text-white underline underline-offset-4' : 'text-emerald-200 hover:text-white'}`;

  return (
    <nav className="bg-emerald-950 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="MoneyCheck$ Logo" className="h-10 w-auto" />
          <span className="font-light text-lg tracking-wide hidden sm:inline">| Loan Tracker</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-6 text-sm">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>{label}</NavLink>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-emerald-200 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-emerald-900 px-4 pb-4 space-y-2">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `block py-2 px-3 rounded transition font-medium ${isActive ? 'bg-emerald-700 text-white' : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <LoanProvider>
      <Router>
        <div className="min-h-screen bg-teal-800 flex flex-col">
          <Navbar />
          <main className="flex-1 pb-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/records" element={<AllRecords />} />
              <Route path="/create" element={<CreateEntry />} />
              <Route path="/people" element={<PeopleGroups />} />
              <Route path="/entry/:id" element={<EntryDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LoanProvider>
  );
}