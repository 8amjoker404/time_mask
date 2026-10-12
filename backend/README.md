# Time Mask API

Express API for historical masks, accounts, conversations, and Google AI chat. Database credentials stay in the DBMS Gateway project. The API uses `diamond-sql` through the shared connector in `db.js`.

## Setup

1. Copy `.env.example` to `.env`. Fill in the full Gateway `SITE_ID`, `API_KEY`, and `DBMS_URL`. Set `JWT_SECRET` to a random value of at least 32 characters and set `CORS_ORIGIN` to the frontend origin.
2. Install and run the API with `npm install` and `npm run dev` (or `npm start`).
3. Apply migrations `001_initial_schema.sql` and `002_users_and_conversation_ownership.sql` to the project database through your DBMS Gateway workflow.
4. Register an account from the app, then promote the intended operator account with `npm run promote-admin -- person@example.com`. Promotion requires a working Gateway connection and should be run only by an operator with server access.
5. An administrator can set the Google key in the frontend AI settings. It is kept in backend memory and resets to `GOOGLE_API_KEY` from `.env` on restart.

## Routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | DBMS Gateway status |
| POST | `/api/auth/register` | Public | Create an account; passwords are bcrypt hashed |
| POST | `/api/auth/login` | Public | Return a 7 day JWT bearer token |
| GET | `/api/auth/me` | Signed in | Current account |
| POST | `/api/auth/logout` | Signed in | Client logout acknowledgment; discard the token |
| GET | `/api/masks` | Public | List masks |
| GET | `/api/masks/:id` | Public | Get a mask |
| POST | `/api/masks` | Admin | Create a mask |
| POST | `/api/masks/:id/chat` | Signed in | Send a message to a mask |
| GET | `/api/conversations` | Signed in | List the current account's conversations |
| GET | `/api/conversations/:id/messages` | Owner | Load messages for an owned conversation |
| GET | `/api/settings/llm` | Public | Google model and key configured status |
| PUT | `/api/settings/llm` | Admin | Set Google API key in server memory |

Protected routes accept `Authorization: Bearer <token>`. Conversations are scoped to their owner. Auth and chat endpoints are rate limited. Set `CORS_ORIGIN` to a comma-separated allowlist for production deployments.

## Gateway client contract

The local `diamond-sql.js` client currently calls `GET /api/status`, `POST /api/query`, and `POST /api/execute`, using `X-Site-Id`, `X-Api-Key`, and a `siteId` payload. Update that client if your Gateway uses different paths or request fields.
