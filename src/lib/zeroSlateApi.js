const ZERO_SLATE_API_URL = (import.meta.env.VITE_ZERO_SLATE_API_URL || 'https://zeroslate.kr').replace(/\/$/, '');

async function readResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'ZeroSlate 요청에 실패했습니다.';
    throw new Error(message);
  }
  return payload;
}

export async function exchangeSuiteCode(code) {
  if (!code) return false;

  const response = await fetch(`${ZERO_SLATE_API_URL}/api/auth/suite/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const payload = await readResponse(response);
  return payload;
}

async function requestEntries(accessToken, options = {}) {
  const response = await fetch(`${ZERO_SLATE_API_URL}/api/suite/log/entries`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  return readResponse(response);
}

export function fetchZeroLogEntries(accessToken) {
  return requestEntries(accessToken);
}

export function createZeroLogEntry(accessToken, entry) {
  return requestEntries(accessToken, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function fetchZeroSlatePlan(accessToken) {
  const response = await fetch(`${ZERO_SLATE_API_URL}/api/entitlements`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return readResponse(response);
}
