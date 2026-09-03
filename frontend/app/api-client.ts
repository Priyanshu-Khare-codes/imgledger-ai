// API client for the FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function searchImage(
  file: File,
  onProgress?: (step: number) => void
): Promise<import('./types').SearchResponse> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getRecord(
  recordId: string
): Promise<import('./types').RecordResponse> {
  const res = await fetch(`${API_BASE}/api/records/${recordId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function verifyRecord(
  recordId: string
): Promise<import('./types').VerifyResponse> {
  const res = await fetch(`${API_BASE}/api/verify/${recordId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; valid: boolean; chain: string }> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}
