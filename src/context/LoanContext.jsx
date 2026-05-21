// src/context/LoanContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const LoanContext = createContext();

export const LoanProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [people, setPeople] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetches all core data from the backend. Called on mount and after major changes.
  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesData, peopleData, groupsData] = await Promise.all([
        api.fetchEntries(),
        api.fetchPeople(),
        api.fetchGroups(),
      ]);
      setEntries(entriesData);
      setPeople(peopleData);
      setGroups(groupsData);
    } catch (err) {
      setError('Failed to connect to backend. Make sure the Spring Boot server is running on port 8080.');
      console.error('[LoanContext]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // --- ENTRIES ---

  // Create entry; returns the saved entry from the backend.
  const addEntry = async (entryData) => {
    const created = await api.createEntry(entryData);
    setEntries(prev => [...prev, created]);
    return created;
  };

  // Updates text fields of an existing entry.
  const updateEntryById = async (id, entryData) => {
    const updated = await api.updateEntry(id, entryData);
    setEntries(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  // Deletes an entry permanently.
  const deleteEntryById = async (id) => {
    await api.deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // Re-fetches a single entry from the backend to reflect payment updates.
  const refreshEntry = async (id) => {
    const updated = await api.fetchEntry(id);
    setEntries(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  // --- PEOPLE ---

  const addPerson = async (personData) => {
    const created = await api.createPerson(personData);
    setPeople(prev => [...prev, created]);
    return created;
  };

  const updatePersonById = async (id, data) => {
    const updated = await api.updatePerson(id, data);
    setPeople(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deletePersonById = async (id) => {
    await api.deletePerson(id);
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  // --- GROUPS ---

  const addGroup = async (groupData) => {
    const created = await api.createGroup(groupData);
    setGroups(prev => [...prev, created]);
    return created;
  };

  const updateGroupById = async (id, data) => {
    const updated = await api.updateGroup(id, data);
    setGroups(prev => prev.map(g => g.id === id ? updated : g));
    return updated;
  };

  const deleteGroupById = async (id) => {
    await api.deleteGroup(id);
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  // The seeded "Me" person — used as the default lender.
  const mePerson = people.find(p => p.name === 'Me') || null;

  const value = {
    entries,
    people,
    groups,
    mePerson,
    loading,
    error,
    refreshAll,
    refreshEntry,
    addEntry,
    updateEntryById,
    deleteEntryById,
    addPerson,
    updatePersonById,
    deletePersonById,
    addGroup,
    updateGroupById,
    deleteGroupById,
  };

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
};

export const useLoanData = () => {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error('useLoanData must be used within a LoanProvider');
  return ctx;
};