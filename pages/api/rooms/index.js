import { createRoomWithDefaultModules, getRoomsForUser } from '../../../lib/rooms';
import { requireSession, requireRole } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const session = await requireSession(req, res);

    if (!session) {
      return;
    }

    const rooms = await getRoomsForUser(session.user);
    return res.status(200).json({ rooms });
  }

  if (req.method === 'POST') {
    const session = await requireRole(req, res, 'maitre');

    if (!session) {
      return;
    }

    const { title, description } = req.body || {};
   
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Le titre de la salle est obligatoire.' });
    }

    const roomId = await createRoomWithDefaultModules({
      title: title.trim(),
      description: description || '',
      teacherId: session.user.id,
    });

    const rooms = await getRoomsForUser(session.user);
    const room = rooms.find((item) => item.id === roomId) || null;
    return res.status(201).json({ rooms, room });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Methode non autorisee.' });
}
