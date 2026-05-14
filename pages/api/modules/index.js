import { convertToObject } from 'typescript';
import { createModuleInRoom, deleteModuleById, getRoomsForUser, updateModuleById } from '../../../lib/rooms';
import { requireRole } from '../../../lib/session';

export default async function handler(req, res) {
  const session = await requireRole(req, res, 'maitre');

  if (!session) {
    return;
  }

  if (req.method === 'POST') {
    const { roomId, title,  isActive } = req.body || {};

    if (!roomId ) {
      return res.status(400).json({ error: 'roomId et moduleType sont obligatoires.' });
    }

    try {
      await createModuleInRoom({
        teacherId: session.user.id,
        roomId,
        payload: { title, isActive },
      });

      const rooms = await getRoomsForUser(session.user);
      console.log('Module created successfully. Updated rooms:', rooms);
      return res.status(201).json({ rooms });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Impossible de creer le module.' });
    }
  }

  if (req.method === 'PATCH') {
    const { moduleId, ...payload } = req.body || {};

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId est obligatoire.' });
    }

    try {
      await updateModuleById({
        teacherId: session.user.id,
        moduleId,
        payload,
      });

      const rooms = await getRoomsForUser(session.user);
      return res.status(200).json({ rooms });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Impossible de modifier le module.' });
    }
  }

  if (req.method === 'DELETE') {
    const { moduleId } = req.body || {};

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId est obligatoire.' });
    }

    await deleteModuleById({
      teacherId: session.user.id,
      moduleId,
    });

    const rooms = await getRoomsForUser(session.user);
    return res.status(200).json({ rooms });
  }

  res.setHeader('Allow', 'POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Methode non autorisee.' });
}
