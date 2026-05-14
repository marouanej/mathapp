import { deleteRoomById, duplicateRoomById, getRoomsForUser, updateRoomById } from '../../../lib/rooms';
import { requireRole } from '../../../lib/session';

export default async function handler(req, res) {
  const session = await requireRole(req, res, 'maitre');

  if (!session) {
    return;
  }

  const { roomId } = req.query;

  if (!roomId || typeof roomId !== 'string') {
    return res.status(400).json({ error: 'roomId est obligatoire.' });
  }

  if (req.method === 'PATCH') {
    await updateRoomById({
      teacherId: session.user.id,
      roomId,
      payload: req.body || {},
    });

    const rooms = await getRoomsForUser(session.user);
    return res.status(200).json({ rooms });
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};

    if (action !== 'duplicate') {
      return res.status(400).json({ error: 'Action inconnue.' });
    }

    await duplicateRoomById({
      teacherId: session.user.id,
      roomId,
    });

    const rooms = await getRoomsForUser(session.user);
    return res.status(200).json({ rooms });
  }

  if (req.method === 'DELETE') {
    await deleteRoomById({
      teacherId: session.user.id,
      roomId,
    });

    const rooms = await getRoomsForUser(session.user);
    return res.status(200).json({ rooms });
  }

  res.setHeader('Allow', 'PATCH, POST, DELETE');
  return res.status(405).json({ error: 'Methode non autorisee.' });
}
