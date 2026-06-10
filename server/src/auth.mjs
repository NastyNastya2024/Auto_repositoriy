import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-me-in-production';

export function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, login: user.login },
    JWT_SECRET,
    { expiresIn: '30d' },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
