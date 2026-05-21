const API_BASE = 'http://localhost:8080/api';

/** Generic fetch wrapper — throws a descriptive error on non-OK responses. */
const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  if (res.status === 204) return null; // No Content
  return res.json();
};

const json = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// --- ENTRIES ---
export const fetchEntries = () => apiFetch(`${API_BASE}/entries`);
export const fetchEntry = (id) => apiFetch(`${API_BASE}/entries/${id}`);
export const createEntry = (data) => apiFetch(`${API_BASE}/entries`, json('POST', data));
export const updateEntry = (id, data) => apiFetch(`${API_BASE}/entries/${id}`, json('PUT', data));
export const deleteEntry = (id) => apiFetch(`${API_BASE}/entries/${id}`, { method: 'DELETE' });

// --- PAYMENTS ---
export const fetchPaymentsForEntry = (entryId) => apiFetch(`${API_BASE}/payments/entry/${entryId}`);
export const submitPayment = (data) => apiFetch(`${API_BASE}/payments`, json('POST', data));

// --- PEOPLE ---
export const fetchPeople = () => apiFetch(`${API_BASE}/people`);
export const createPerson = (data) => apiFetch(`${API_BASE}/people`, json('POST', data));
export const updatePerson = (id, data) => apiFetch(`${API_BASE}/people/${id}`, json('PUT', data));
export const deletePerson = (id) => apiFetch(`${API_BASE}/people/${id}`, { method: 'DELETE' });

// --- GROUPS ---
export const fetchGroups = () => apiFetch(`${API_BASE}/groups`);
export const createGroup = (data) => apiFetch(`${API_BASE}/groups`, json('POST', data));
export const updateGroup = (id, data) => apiFetch(`${API_BASE}/groups/${id}`, json('PUT', data));
export const deleteGroup = (id) => apiFetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' });

// --- INSTALLMENTS ---
export const fetchInstallment = (entryId) => apiFetch(`${API_BASE}/installments/entry/${entryId}`);
export const saveInstallment = (entryId, data) =>
  apiFetch(`${API_BASE}/installments/entry/${entryId}`, json('POST', data));
export const updateInstallment = (id, data) =>
  apiFetch(`${API_BASE}/installments/${id}`, json('PUT', data));

// --- PAYMENT ALLOCATIONS ---
export const fetchAllocations = (entryId) => apiFetch(`${API_BASE}/allocations/entry/${entryId}`);
export const saveAllocations = (entryId, allocations) =>
  apiFetch(`${API_BASE}/allocations/entry/${entryId}`, json('POST', allocations));