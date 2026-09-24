const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchMeta() {
  const res = await fetch(`${API_BASE}/api/meta`);
  if (!res.ok) throw new Error('Failed to load fee data');
  return res.json();
}

export async function calculateFees(payload) {
  const res = await fetch(`${API_BASE}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Calculation failed');
  return data;
}
