import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { fetchAllScans, CAPTAIN_API_BASE } from '@/lib/api/captain-api';

// Mock global fetch
const mockFetch = mock(() => Promise.resolve(new Response('{}', { status: 200 })));

beforeEach(() => {
  globalThis.fetch = mockFetch as any;
  mockFetch.mockClear();
});

describe('fetchAllScans', () => {
  test('fires 7 parallel fetch calls', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    );

    await fetchAllScans();

    expect(mockFetch).toHaveBeenCalledTimes(7);
  });

  test('returns null for failed endpoints without throwing', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('financial-meaning')) {
        return Promise.resolve(new Response(JSON.stringify({ greeting: 'Hello', verdict: 'OK', status: 'healthy' }), { status: 200 }));
      }
      return Promise.resolve(new Response('Server Error', { status: 500 }));
    });

    const result = await fetchAllScans();

    expect(result.financialMeaning).not.toBeNull();
    expect(result.subscriptions).toBeNull();
    expect(result.budgetOverruns).toBeNull();
  });

  test('calls deployed API Gateway directly (no localhost proxy)', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response('{}', { status: 200 }))
    );

    await fetchAllScans();

    const calls = mockFetch.mock.calls;
    for (const call of calls) {
      const url = call[0] as string;
      expect(url.startsWith(CAPTAIN_API_BASE)).toBe(true);
      expect(url).not.toContain('localhost');
    }
  });
});
