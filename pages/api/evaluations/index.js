import { getStudentEvaluations, getTeacherDashboard, resetTeacherEvaluations, saveEvaluationAttempt } from '../../../lib/evaluations';
import { requireSession, requireRole } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const session = await requireSession(req, res);

    if (!session) {
      return;
    }

    if (session.user.role === 'maitre') {
      const dashboard = await getTeacherDashboard(session.user.id);
      return res.status(200).json({ dashboard });
    }

    const evaluations = await getStudentEvaluations(session.user.id);
    return res.status(200).json({ evaluations });
  }

  if (req.method === 'POST') {
    const session = await requireRole(req, res, 'eleve');

    if (!session) {
      return;
    }

    const { roomId, moduleId, score, totalQuestions, correctAnswers, responses } = req.body || {};

    if (!roomId || !moduleId) {
      return res.status(400).json({ error: 'roomId et moduleId sont obligatoires.' });
    }

    try {
      await saveEvaluationAttempt({
        studentId: session.user.id,
        roomId,
        moduleId,
        score,
        totalQuestions,
        correctAnswers,
        responses,
      });

      const evaluations = await getStudentEvaluations(session.user.id);
      return res.status(201).json({ evaluations });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Impossible d enregistrer le score.' });
    }
  }

  if (req.method === 'DELETE') {
    const session = await requireRole(req, res, 'maitre');

    if (!session) {
      return;
    }

    const { roomId, moduleId } = req.body || {};

    await resetTeacherEvaluations({
      teacherId: session.user.id,
      roomId,
      moduleId,
    });

    const dashboard = await getTeacherDashboard(session.user.id);
    return res.status(200).json({ dashboard });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Methode non autorisee.' });
}
