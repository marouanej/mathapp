import {
  deleteQuestionById,
  getRoomsForUser,
  moveQuestionByDirection,
  toggleQuestionActive,
  upsertQuestion,
} from '../../../lib/rooms';
import { requireRole } from '../../../lib/session';

export default async function handler(req, res) {
  const session = await requireRole(req, res, 'maitre');

  if (!session) {
    return;
  }

  if (req.method === 'POST') {
    const { roomId, ...payload } = req.body || {};

    if (!roomId) {
      return res.status(400).json({ error: 'roomId est obligatoire.' });
    }

    try {
      await upsertQuestion({
        teacherId: session.user.id,
        roomId,
        payload,
      });

      const rooms = await getRoomsForUser(session.user);
      return res.status(200).json({ rooms });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Impossible d enregistrer la question.' });
    }
  }

  if (req.method === 'DELETE') {
    const { questionId } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ error: 'questionId est obligatoire.' });
    }

    await deleteQuestionById({
      teacherId: session.user.id,
      questionId,
    });

    const rooms = await getRoomsForUser(session.user);
    return res.status(200).json({ rooms });
  }

  if (req.method === 'PATCH') {
    const { roomId, moduleId, questionId, direction, isActive } = req.body || {};

    if (questionId && typeof isActive === 'boolean') {
      await toggleQuestionActive({
        teacherId: session.user.id,
        questionId,
        isActive,
      });

      const rooms = await getRoomsForUser(session.user);
      return res.status(200).json({ rooms });
    }

    if (!roomId || !moduleId || !questionId || !direction) {
      return res.status(400).json({ error: 'roomId, moduleId, questionId et direction sont obligatoires.' });
    }

    try {
      await moveQuestionByDirection({
        teacherId: session.user.id,
        roomId,
        moduleId,
        questionId,
        direction,
      });

      const rooms = await getRoomsForUser(session.user);
      return res.status(200).json({ rooms });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Impossible de deplacer la question.' });
    }
  }

  res.setHeader('Allow', 'POST, DELETE, PATCH');
  return res.status(405).json({ error: 'Methode non autorisee.' });
}
