import { verifyToken } from '../services/token.js';
import User from '../models/User.js';

/**
 * Reads the Bearer token, verifies it, and attaches the live user to req.user.
 * We hit the DB on each request so a deleted/disabled account can't keep acting
 * on a still-valid token — correctness over a marginal latency saving.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing authentication token' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
