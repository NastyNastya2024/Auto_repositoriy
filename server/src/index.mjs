import cors from 'cors';
import express from 'express';
import { isPublicAction, runAction } from './actions.mjs';
import { verifyToken, signToken } from './auth.mjs';
import { loadState, saveState } from './db.mjs';
import { stateForActor } from './stateView.mjs';

const PORT = Number(process.env.PORT || 3001);
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function getActor(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  return { userId: payload.userId, role: payload.role, login: payload.login };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', (req, res) => {
  const actor = getActor(req);
  const state = loadState();
  res.json({ state: stateForActor(state, actor) });
});

app.post('/api/auth/login', (req, res) => {
  const state = loadState();
  const result = runAction(state, 'login', req.body ?? {}, null);
  if (!result.ok) {
    res.status(401).json({ error: result.error });
    return;
  }
  saveState(result.state);
  const token = signToken(result.tokenUser);
  res.json({
    token,
    user: result.tokenUser,
    state: stateForActor(result.state, result.tokenUser),
  });
});

app.post('/api/actions', (req, res) => {
  const { action, payload } = req.body ?? {};
  if (!action || typeof action !== 'string') {
    res.status(400).json({ error: 'Укажите action' });
    return;
  }

  const actor = getActor(req);
  if (!isPublicAction(action) && !actor) {
    res.status(401).json({ error: 'Требуется вход в аккаунт' });
    return;
  }

  const state = loadState();
  const result = runAction(state, action, payload ?? {}, actor);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  saveState(result.state);
  const nextActor =
    action === 'login' && result.tokenUser
      ? result.tokenUser
      : actor;
  res.json({
    state: stateForActor(result.state, nextActor),
    token: result.tokenUser ? signToken(result.tokenUser) : undefined,
    user: result.tokenUser,
  });
});

app.listen(PORT, () => {
  loadState();
  console.log(`autoschool-api listening on :${PORT}`);
});
