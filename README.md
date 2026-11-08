# Users API

Requires Node.js 18 or later. Run `npm start` to listen on `http://localhost:3000` (loopback only).
Users are held in memory and are cleared when the process restarts.

| Method | Path | Result |
| --- | --- | --- |
| POST | `/users` | Create a user; `201` with `{id,name,email}` and a `Location` header. |
| GET | `/users` | List users as `{users:[...]}`. |
| GET | `/users/:id` | Retrieve a user as `{id,name,email}`. |

`POST /users` accepts JSON with `name` (a nonempty string, at most 100 characters) and `email` (a valid email string, at most 254 characters). Emails are stored in lowercase and must be unique regardless of case. Invalid or missing data returns `400`; a duplicate email returns `409`; an unknown user returns `404`. Errors use `{ "error": { "code": "...", "message": "..." } }`.

Run the version-controlled Postman checks against the local server:

```sh
postman collection lint 'postman/collections/Users API'
postman collection run 'postman/collections/Users API' --no-report-events
```
