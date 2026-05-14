import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { resolveQuestionType } from '../lib/questionTypes';

const sendJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Une erreur est survenue.');
  }

  return payload;
};

export const useRoomsStore = () => {
  const { status, data: session } = useSession();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({
    overview: {
      totalRooms: 0,
      totalModules: 0,
      totalQuestions: 0,
      totalAttempts: 0,
      averageSuccessRate: 0,
    },
    rooms: [],
    recentEvaluations: [],
  });
  const [evaluations, setEvaluations] = useState([]);

  const refreshRooms = useCallback(async () => {
    if (status !== 'authenticated') {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await sendJson('/api/rooms');
      setRooms(payload.rooms || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const refreshEvaluations = useCallback(async () => {
    if (status !== 'authenticated') {
      setDashboard({
        overview: {
          totalRooms: 0,
          totalModules: 0,
          totalQuestions: 0,
          totalAttempts: 0,
          averageSuccessRate: 0,
        },
        rooms: [],
        recentEvaluations: [],
      });
      setEvaluations([]);
      return;
    }

    try {
      const payload = await sendJson('/api/evaluations');

      if (session?.user?.role === 'maitre') {
        setDashboard(
          payload.dashboard || {
            overview: {
              totalRooms: 0,
              totalModules: 0,
              totalQuestions: 0,
              totalAttempts: 0,
              averageSuccessRate: 0,
            },
            rooms: [],
            recentEvaluations: [],
          }
        );
      } else {
        setEvaluations(payload.evaluations || []);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [session?.user?.role, status]);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  useEffect(() => {
    refreshEvaluations();
  }, [refreshEvaluations]);

  const createRoom = useCallback(async (title, description = '') => {
    const payload = await sendJson('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
    await refreshRooms();
    return payload.room || payload.rooms?.[payload.rooms.length - 1] || null;
    
  }, [refreshEvaluations,refreshRooms]);

  const updateRoom = useCallback(async (roomId, data) => {
    const payload = await sendJson(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
  }, [refreshEvaluations]);

  const duplicateRoom = useCallback(async (roomId) => {
    const payload = await sendJson(`/api/rooms/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'duplicate' }),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
  }, [refreshEvaluations]);

  const deleteRoom = useCallback(async (roomId) => {
    const payload = await sendJson(`/api/rooms/${roomId}`, {
      method: 'DELETE',
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
  }, [refreshEvaluations]);

  const createModule = useCallback(async ({roomId,  title, isActive}) => {
    console.log('Creating module with data:', {roomId, title, isActive});
    const payload = await sendJson('/api/modules', {
      method: 'POST',
      body: JSON.stringify({ roomId, title, isActive }),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
    await refreshRooms();
  }, [refreshEvaluations,refreshRooms]);

  const updateModule = useCallback(async (moduleId, moduleData) => {
    const payload = await sendJson('/api/modules', {
      method: 'PATCH',
      body: JSON.stringify({ moduleId, ...moduleData }),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
  }, [refreshEvaluations]);

  const deleteModule = useCallback(async (moduleId) => {
    const payload = await sendJson('/api/modules', {
      method: 'DELETE',
      body: JSON.stringify({ moduleId }),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
  }, [refreshEvaluations]);

const saveQuestion = useCallback(async (roomId, question) => {
  const responseType = resolveQuestionType(question.responseType ?? question.type, {
    correctAnswer: question.correctAnswer,
  });
  const text = String(question.text ?? question.question ?? '').trim();

  const payload = await sendJson('/api/questions', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      id: question.id,
      moduleId: question.moduleId,
      text,
      question: text,
      correctAnswer: String(question.correctAnswer ?? '').trim(),
      type: responseType,
      responseType,
      skillCode: question.skillCode ?? question.skillcode ?? '',
      hint: question.hint || '',
      explanation: question.explanation || '',
    }),
  });

  setRooms(payload.rooms || []);
  await refreshEvaluations();
  await refreshRooms();
}, [refreshEvaluations, refreshRooms]);

  const deleteQuestion = useCallback(async (roomId, moduleId, questionId) => {
    const payload = await sendJson('/api/questions', {
      method: 'DELETE',
      body: JSON.stringify({ roomId, moduleId, questionId }),
    });

    setRooms(payload.rooms || []);
    await refreshEvaluations();
  }, [refreshEvaluations]);

  const moveQuestion = useCallback(async (roomId, moduleId, questionId, direction) => {
    const payload = await sendJson('/api/questions', {
      method: 'PATCH',
      body: JSON.stringify({ roomId, moduleId, questionId, direction }),
    });

    setRooms(payload.rooms || []);
  }, []);

  const toggleQuestion = useCallback(async (questionId, isActive) => {
    const payload = await sendJson('/api/questions', {
      method: 'PATCH',
      body: JSON.stringify({ questionId, isActive }),
    });

    setRooms(payload.rooms || []);
  }, []);

  const saveEvaluation = useCallback(async (evaluationData) => {
    const payload = await sendJson('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });

    setEvaluations(payload.evaluations || []);
  }, []);

  const resetEvaluations = useCallback(async (filters = {}) => {
    const payload = await sendJson('/api/evaluations', {
      method: 'DELETE',
      body: JSON.stringify(filters),
    });

    setDashboard(
      payload.dashboard || {
        overview: {
          totalRooms: 0,
          totalModules: 0,
          totalQuestions: 0,
          totalAttempts: 0,
          averageSuccessRate: 0,
        },
        rooms: [],
        recentEvaluations: [],
      }
    );
  }, []);

  return {
    rooms,
    loading,
    error,
    session,
    dashboard,
    evaluations,
    refreshRooms,
    refreshEvaluations,
    createRoom,
    updateRoom,
    duplicateRoom,
    deleteRoom,
    createModule,
    updateModule,
    deleteModule,
    saveQuestion,
    deleteQuestion,
    moveQuestion,
    toggleQuestion,
    saveEvaluation,
    resetEvaluations,
  };
};
