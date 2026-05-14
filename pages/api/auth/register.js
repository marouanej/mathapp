import { createUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Methode non autorisee.' });
  }

  try {
    const { name, email, password, role } = req.body || {};

    if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    if (!['maitre', 'eleve'].includes(role)) {
      return res.status(400).json({ error: 'Role invalide.' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caracteres.' });
    }

    const user = await createUser({
      name,
      email,
      password,
      role,
    });

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Impossible de creer le compte.' });
  }
}
