const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `API returned non-JSON (${res.status}). Check VITE_API_URL is set to your server.`
    );
  }
}

export async function fetchMeta() {
  const res = await fetch(`${API_BASE}/api/meta`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || 'Failed to load fee data');
  return data;
}

export async function calculateFees(payload) {
  const res = await fetch(`${API_BASE}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || 'Calculation failed');
  return data;
}
