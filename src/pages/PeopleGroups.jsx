// src/pages/PeopleGroups.jsx
import React, { useState } from 'react';
import { useLoanData } from '../context/LoanContext';

export default function PeopleGroups() {
  const { people, groups, addPerson, addGroup, deletePersonById, deleteGroupById } = useLoanData();
  const [activeTab, setActiveTab] = useState('people');

  // People form state
  const [newPersonName, setNewPersonName] = useState('');
  const [personError, setPersonError] = useState('');
  const [personSaving, setPersonSaving] = useState(false);

  // Group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupError, setGroupError] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);

  // Filter out the seeded "Me" person from the displayed contact list
  const displayablePeople = people.filter(p => p.name !== 'Me');

  // --- Handlers ---

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    setPersonSaving(true);
    setPersonError('');
    try {
      await addPerson({ name: newPersonName.trim() });
      setNewPersonName('');
    } catch (err) {
      setPersonError('Failed to add person: ' + err.message);
    } finally {
      setPersonSaving(false);
    }
  };

  const handleDeletePerson = async (id) => {
    if (!window.confirm('Remove this contact? This may affect existing entries.')) return;
    try {
      await deletePersonById(id);
    } catch (err) {
      setPersonError('Failed to delete: ' + err.message);
    }
  };

  const handleToggleMember = (personId) => {
    setSelectedMembers(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      setGroupError('Please provide a group name and select at least one member.');
      return;
    }
    setGroupSaving(true);
    setGroupError('');
    try {
      // Backend expects { groupName, memberIds }
      await addGroup({ groupName: newGroupName.trim(), memberIds: selectedMembers });
      setNewGroupName('');
      setSelectedMembers([]);
    } catch (err) {
      setGroupError('Failed to create group: ' + err.message);
    } finally {
      setGroupSaving(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Remove this group? This may affect existing entries.')) return;
    try {
      await deleteGroupById(id);
    } catch (err) {
      setGroupError('Failed to delete group: ' + err.message);
    }
  };

  const tabClass = (tab) =>
    `py-2 px-6 font-semibold transition-colors ${
      activeTab === tab
        ? 'border-b-2 border-emerald-600 text-emerald-600'
        : 'text-gray-500 hover:text-emerald-500'
    }`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-6 sm:mt-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">People &amp; Groups</h2>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button className={tabClass('people')} onClick={() => setActiveTab('people')}>
          Individuals ({displayablePeople.length})
        </button>
        <button className={tabClass('groups')} onClick={() => setActiveTab('groups')}>
          Groups ({groups.length})
        </button>
      </div>

      {/* PEOPLE TAB */}
      {activeTab === 'people' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Add New Contact</h3>
            {personError && <p className="text-red-600 text-sm mb-2">{personError}</p>}
            <form onSubmit={handleAddPerson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text" required value={newPersonName}
                  onChange={e => setNewPersonName(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  placeholder="e.g. Eugene Krabs"
                />
              </div>
              <button
                type="submit" disabled={personSaving}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 w-full transition disabled:opacity-50"
              >
                {personSaving ? 'Adding…' : 'Add Person'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Saved Contacts</h3>
            {displayablePeople.length === 0 ? (
              <p className="text-gray-500 italic">No contacts added yet.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {displayablePeople.map(person => (
                  <li key={person.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                    <span className="font-medium text-gray-800">{person.name}</span>
                    <button
                      onClick={() => handleDeletePerson(person.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* GROUPS TAB */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Create New Group</h3>
            {groupError && <p className="text-red-600 text-sm mb-2">{groupError}</p>}
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                <input
                  type="text" required value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  placeholder="e.g. CMSC127 Support Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
                {displayablePeople.length === 0 ? (
                  <p className="text-sm text-amber-600 italic">Add contacts first.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50">
                    {displayablePeople.map(person => (
                      <label key={person.id} className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-gray-100 rounded">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(person.id)}
                          onChange={() => handleToggleMember(person.id)}
                          className="rounded text-emerald-600 h-4 w-4"
                        />
                        <span className="text-gray-700">{person.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={displayablePeople.length === 0 || groupSaving}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 w-full transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {groupSaving ? 'Creating…' : 'Create Group'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Saved Groups</h3>
            {groups.length === 0 ? (
              <p className="text-gray-500 italic">No groups created yet.</p>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {groups.map(group => (
                  <li key={group.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800">{group.groupName}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {group.members?.length ?? 0} member{group.members?.length !== 1 ? 's' : ''}:{' '}
                          {group.members?.map(m => m.name).join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-semibold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}