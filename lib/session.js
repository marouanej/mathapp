import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';

export const requireSession = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: 'Authentification requise.' });
    return null;
  }

  return session;
};

export const requireRole = async (req, res, role) => {
  const session = await requireSession(req, res);

  if (!session) {
    return null;
  }

  if (session.user.role !== role) {
    res.status(403).json({ error: 'Acces refuse.' });
    return null;
  }

  return session;
};
