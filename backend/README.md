# Time Mask API

Express API for historical masks, accounts, conversations, and Google AI chat. It connects directly to MySQL through a shared `mysql2/promise` pool in `database/index.js`, imported as `db`.

## Setup

1. Copy `.env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. The backend connects directly to this MySQL database.
2. Set `JWT_SECRET` to a random value of at least 32 characters and set `CORS_ORIGIN` to the frontend origin.
3. Install and run the API with `npm install` and `npm run dev` (or `npm start`).
4. Apply pending SQL migrations with `npm run migrate`.
5. Register an account from the app, then promote the intended operator account with `npm run promote-admin -- person@example.com`.
6. An administrator can set the Google key in the frontend AI settings. It is kept in backend memory and resets to `GOOGLE_API_KEY` from `.env` on restart.

## Routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | SQL database connectivity |
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
| GET | `/api/twins` | Signed in | List the user's saved masks |
| POST | `/api/twins/:maskId` | Signed in | Save a mask to Your Twins |
| DELETE | `/api/twins/:maskId` | Signed in | Remove a saved mask |
| GET | `/api/groups` | Signed in | List the user's group chats |
| POST | `/api/groups` | Signed in | Create a group chat with 1–6 masks |
| GET | `/api/groups/:id/messages` | Owner | Load group chat messages |
| POST | `/api/groups/:id/messages` | Owner | Send a message and get responses from each mask |
| GET | `/api/settings/llm` | Public | Google model and key configured status |
| PUT | `/api/settings/llm` | Admin | Set Google API key in server memory |

Protected routes accept `Authorization: Bearer <token>`. Conversations are scoped to their owner. Auth and chat endpoints are rate limited. Set `CORS_ORIGIN` to a comma-separated allowlist for production deployments.
