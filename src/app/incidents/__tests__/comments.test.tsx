/**
 * Unit tests for the Comments section of IncidentsClient.
 *
 * Strategy: render the full IncidentsClient inside a fresh QueryClientProvider,
 * mock `fetch` globally with a regex-based dispatcher so URL patterns don't
 * accidentally overlap (e.g. /api/incidents matches /api/incidents/1/comments),
 * then assert on observable DOM behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import IncidentsClient from '../incidents-client';

// --------------- Test utilities ---------------

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchInterval: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
      <Toaster />
    </QueryClientProvider>
  );
}

// --------------- Mock data ---------------

const MOCK_INCIDENTS_RESPONSE = {
  data: [
    {
      id: 1,
      title: 'Perte de signal site Marseille Nord',
      status: 'open',
      siteCode: 'MRS-N01',
      createdAt: '2026-04-24T14:00:00Z',
      assignedTo: null,
      commentCount: 2,
    },
  ],
  total: 1,
  currentPage: 1,
  filteredCount: 1,
};

const MOCK_COMMENTS_RESPONSE = {
  data: [
    { id: 101, author: 'tech@company.com', message: 'Signal check done.', createdAt: '2026-04-24T15:00:00Z' },
    { id: 102, author: 'ops@company.com', message: 'Awaiting hardware team.', createdAt: '2026-04-24T16:00:00Z' },
  ],
  total: 2,
  currentPage: 1,
  filteredCount: 2,
};

/**
 * Build a fetch mock that dispatches by regex patterns evaluated in order.
 * More-specific patterns must come before less-specific ones.
 */
function buildFetchMock(
  routes: Array<{ pattern: RegExp; method?: string; handler: (url: string, init?: RequestInit) => Response }>
) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    for (const route of routes) {
      const methodMatches = !route.method || route.method.toUpperCase() === method;
      if (methodMatches && route.pattern.test(url)) {
        return Promise.resolve(route.handler(url, init));
      }
    }
    // Fallback — should not happen in well-written tests
    console.warn(`[fetchMock] Unhandled request: ${method} ${url}`);
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;
}

/** Default happy-path routes — comments endpoint must come BEFORE incidents */
function defaultRoutes() {
  return buildFetchMock([
    {
      // POST comment
      pattern: /\/api\/incidents\/\d+\/comments/,
      method: 'POST',
      handler: () =>
        new Response(JSON.stringify({ id: 999 }), { status: 201 }),
    },
    {
      // GET comments
      pattern: /\/api\/incidents\/\d+\/comments/,
      handler: () =>
        new Response(JSON.stringify(MOCK_COMMENTS_RESPONSE), { status: 200 }),
    },
    {
      // GET incidents list
      pattern: /\/api\/incidents/,
      handler: () =>
        new Response(JSON.stringify(MOCK_INCIDENTS_RESPONSE), { status: 200 }),
    },
  ]);
}

// --------------- Tests ---------------

describe('Comments section', () => {
  beforeEach(() => {
    global.fetch = defaultRoutes();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1 — Render incidents list

  it('renders the incidents list on load', async () => {
    renderWithProviders(<IncidentsClient />);
    expect(
      await screen.findByText('Perte de signal site Marseille Nord')
    ).toBeInTheDocument();
  });

  // 2 — Open modal and render comments

  it('renders comments after opening an incident', async () => {
    renderWithProviders(<IncidentsClient />);

    const row = await screen.findByText('Perte de signal site Marseille Nord');
    await userEvent.click(row);

    expect(await screen.findByText('Signal check done.')).toBeInTheDocument();
    expect(await screen.findByText('Awaiting hardware team.')).toBeInTheDocument();
  });

  // 3 — Send button disabled when textarea is empty

  it('disables the Send button when the textarea is empty', async () => {
    renderWithProviders(<IncidentsClient />);

    const row = await screen.findByText('Perte de signal site Marseille Nord');
    await userEvent.click(row);

    // Wait for modal to finish loading comments
    await screen.findByText('Signal check done.');

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  // 4 — Send button enabled when textarea has text

  it('enables the Send button when the textarea has content', async () => {
    renderWithProviders(<IncidentsClient />);

    const row = await screen.findByText('Perte de signal site Marseille Nord');
    await userEvent.click(row);

    await screen.findByText('Signal check done.');

    const textarea = screen.getByPlaceholderText(/write a comment/i);
    await userEvent.type(textarea, 'Hello');

    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });

  // 5 — POST is called when submitting a comment

  it('calls POST /api/incidents/:id/comments when submitting', async () => {
    const postSpy = vi.fn(() =>
      new Response(JSON.stringify({ id: 999 }), { status: 201 })
    );

    global.fetch = buildFetchMock([
      {
        pattern: /\/api\/incidents\/\d+\/comments/,
        method: 'POST',
        handler: postSpy,
      },
      {
        pattern: /\/api\/incidents\/\d+\/comments/,
        handler: () =>
          new Response(JSON.stringify(MOCK_COMMENTS_RESPONSE), { status: 200 }),
      },
      {
        pattern: /\/api\/incidents/,
        handler: () =>
          new Response(JSON.stringify(MOCK_INCIDENTS_RESPONSE), { status: 200 }),
      },
    ]);

    renderWithProviders(<IncidentsClient />);

    const row = await screen.findByText('Perte de signal site Marseille Nord');
    await userEvent.click(row);
    await screen.findByText('Signal check done.');

    await userEvent.type(
      screen.getByPlaceholderText(/write a comment/i),
      'My new comment'
    );
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(postSpy).toHaveBeenCalledOnce());
  });

  // 6 — Success toast on successful comment post

  it('shows a success toast after adding a comment', async () => {
    renderWithProviders(<IncidentsClient />);

    const row = await screen.findByText('Perte de signal site Marseille Nord');
    await userEvent.click(row);
    await screen.findByText('Signal check done.');

    await userEvent.type(
      screen.getByPlaceholderText(/write a comment/i),
      'Test comment'
    );
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/comment added successfully/i)).toBeInTheDocument()
    );
  });

  // 7 — Error toast when POST fails

  it('shows an error toast when the comment POST fails', async () => {
    global.fetch = buildFetchMock([
      {
        pattern: /\/api\/incidents\/\d+\/comments/,
        method: 'POST',
        handler: () =>
          new Response(JSON.stringify({ message: 'Server error' }), { status: 500 }),
      },
      {
        pattern: /\/api\/incidents\/\d+\/comments/,
        handler: () =>
          new Response(JSON.stringify(MOCK_COMMENTS_RESPONSE), { status: 200 }),
      },
      {
        pattern: /\/api\/incidents/,
        handler: () =>
          new Response(JSON.stringify(MOCK_INCIDENTS_RESPONSE), { status: 200 }),
      },
    ]);

    renderWithProviders(<IncidentsClient />);

    const row = await screen.findByText('Perte de signal site Marseille Nord');
    await userEvent.click(row);
    await screen.findByText('Signal check done.');

    await userEvent.type(
      screen.getByPlaceholderText(/write a comment/i),
      'Will fail'
    );
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    );
  });
});
