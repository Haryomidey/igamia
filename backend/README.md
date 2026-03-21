# iGamia Backend

NestJS + TypeScript + MongoDB backend for the iGamia frontend.

## Environment

Copy `.env.example` to `.env` and fill in the required values.

## Run

```bash
npm install
npm run start:dev
```

The API runs with a global `/api` prefix.

## Frontend Areas That Need This Backend

- `src/pages/auth/*`
  Uses `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/verify-email`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, and `POST /api/auth/resend-verification`.
- `src/pages/dashboard/profile/index.tsx`
  Uses `GET /api/users/me` and `GET /api/wallet/me`.
- `src/pages/dashboard/wallet/index.tsx`
  Uses `GET /api/wallet/me`, `POST /api/wallet/withdraw`, and `POST /api/payments/paystack/initialize`.
- `src/pages/dashboard/mining/index.tsx`
  Uses `GET /api/mining/status` and `POST /api/mining/complete-watch`.
- `src/pages/dashboard/refer/index.tsx`
  Uses `GET /api/referrals/me`.
- `src/pages/dashboard/stream/index.tsx`
  Uses `GET /api/streams/active`, `GET /api/streams/:streamId`, `POST /api/streams/start`, `POST /api/streams/:streamId/stop`, `POST /api/streams/:streamId/invite`, `POST /api/streams/:streamId/share`, `POST /api/streams/:streamId/like`, `POST /api/streams/:streamId/comments`, `POST /api/streams/:streamId/block`, plus websocket namespace `/streams`.
- `src/pages/dashboard/social/index.tsx`
  Can reuse `POST /api/wallet/gift` and stream/user endpoints for social gifting and moderation.
- `src/pages/dashboard/play/index.tsx` and `src/pages/dashboard/library/index.tsx`
  Still need a future `pledges` or `bets` module if you want real wagering logic. I did not invent that service yet because the current frontend only mocks it.
- `src/pages/dashboard/home/index.tsx`, `src/pages/dashboard/history/index.tsx`, `src/pages/dashboard/leaderboard/index.tsx`
  Can consume `GET /api/streams/active` now, but likely need future analytics/leaderboard/history endpoints.

## Websocket Events

Namespace: `/streams`

- `joinStreamRoom` -> `{ streamId }`
- `leaveStreamRoom` -> `{ streamId }`
- `startStream` -> `StartStreamDto`
- `stopStream` -> `{ streamId }`
- `inviteStreamer` -> `{ streamId, streamerUserId }`
- `shareStream` -> `{ streamId }`
- `likeStream` -> `{ streamId }`
- `commentStream` -> `{ streamId, message }`
- `blockViewer` -> `{ streamId, blockedUserId }`

Server events:

- `streamStarted`
- `streamStopped`
- `streamerInvited`
- `streamShared`
- `streamLiked`
- `streamCommented`
- `viewerBlocked`

## Current Assumptions

- A streamer cannot like their own stream.
- Other users can like a stream continuously; likes are increment-only events.
- Blocking removes a user from the participant list and prevents further comments/likes on that stream.
- Wallet balances start with seed values for easier frontend development.
- Paystack and Mailtrap are optional at first boot; the backend falls back gracefully when they are not configured.
