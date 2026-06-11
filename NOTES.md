# Technical Notes

## Feature 1 — Silent Auto-Refresh (every 10s)

The incidents list is polled every 10 seconds using TanStack Query's `refetchInterval` option.

To keep the refresh **silent** (no spinner, no white flash), I combined two options:

- `refetchInterval: 10_000` — triggers a background refetch on the same query key every 10s.
- `placeholderData: keepPreviousData` — keeps the previous data visible while the new fetch is in flight, so the UI never empties out.

This means:
- **Background polls** → silent (query key doesn't change → `isLoading` stays false → no skeletons).
- **User actions** (filter, pagination) → normal loading (query key changes → `isLoading` is true → skeletons appear), as required.

## Feature 2 — Comments: Pagination & Add with Toast

### Pagination

Comments are fetched with `useQuery` using a `commentsPage` state variable in the query key. Changing page invalidates the cache entry and fetches the next page. `keepPreviousData` is used here too to avoid the flash between pages.

The backend supports `?page=&limit=` — I set a limit of 5 comments per page.

### Add Comment

The `postComment` mutation calls the BFF route `POST /api/incidents/:id/comments` (not `localhost:4000` directly, respecting the BFF architecture). On success, `toast.success()` is shown via Sonner. On error, `toast.error()` is shown with the backend error message. After a successful post, both the comment list and the incident list (comment count badge) are invalidated.

## Bug Fix — BFF Bypass

The original `fetchComments` function was calling `http://localhost:4000` directly, bypassing the Next.js BFF layer. This was fixed to use `/api/incidents/:id/comments` instead.

## Bug Fix — Missing `.env.local`

The `API_BASE_URL` environment variable was not set (no `.env.local` file existed), causing all BFF routes to return 500. Created `.env.local` with `API_BASE_URL=http://localhost:4000`.

## Running the Unit Test

> Unit test for the comment mutation (add comment flow).

```bash
npm test
```

The test is located at `src/app/incidents/__tests__/comments.test.tsx`.
It uses **Vitest** + **React Testing Library** and mocks `fetch` to verify:
- A comment is submitted with the correct payload.
- A success toast is triggered on success.
- An error toast is triggered on failure.
