const http = require('node:http');
const { randomUUID } = require('node:crypto');

const users = new Map();
const emails = new Set();
const port = Number(process.env.PORT || 3000);

function send(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

function error(res, status, code, message) {
  send(res, status, { error: { code, message } });
}

async function readJson(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    const err = new Error('Content-Type must be application/json');
    err.status = 415;
    throw err;
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024) {
      const err = new Error('Request body is too large');
      err.status = 413;
      throw err;
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    const err = new Error('Request body must be valid JSON');
    err.status = 400;
    throw err;
  }
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (req.method === 'POST' && pathname === '/users') {
    let input;
    try {
      input = await readJson(req);
    } catch (err) {
      error(res, err.status || 400, 'INVALID_REQUEST', err.message);
      return;
    }

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      error(res, 400, 'INVALID_PAYLOAD', 'Expected a JSON object');
      return;
    }
    if (input.name === undefined || input.email === undefined) {
      error(res, 400, 'MISSING_REQUIRED_FIELD', 'name and email are required');
      return;
    }
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      error(res, 400, 'INVALID_PAYLOAD', 'name must be 1-100 characters and email must be valid');
      return;
    }
    if (emails.has(email)) {
      error(res, 409, 'DUPLICATE_USER', 'A user with this email already exists');
      return;
    }

    const user = { id: randomUUID(), name, email };
    users.set(user.id, user);
    emails.add(email);
    send(res, 201, user, { Location: `/users/${user.id}` });
    return;
  }

  if (req.method === 'GET' && pathname === '/users') {
    send(res, 200, { users: [...users.values()] });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/users/')) {
    const id = pathname.slice('/users/'.length);
    const user = users.get(id);
    if (user) send(res, 200, user);
    else error(res, 404, 'USER_NOT_FOUND', 'User not found');
    return;
  }

  error(res, 404, 'NOT_FOUND', 'Route not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Users API listening on http://localhost:${port}`);
});
