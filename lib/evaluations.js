import { nanoid } from 'nanoid';
import { prisma } from './prisma';

const toNumber = (value) => (typeof value?.toNumber === 'function' ? value.toNumber() : Number(value || 0));

export const saveEvaluationAttempt = async ({
  studentId,
  roomId,
  moduleId,
  score,
  totalQuestions,
  correctAnswers,
  responses = [],
}) => {
  const module = await prisma.module.findFirst({
    where: {
      id: moduleId,
      roomId,
      isActive: true,
      room: {
        isActive: true,
      },
    },
  });

  if (!module) {
    throw new Error('Salle ou module introuvable.');
  }

  const safeScore = Math.max(0, Number(score) || 0);
  const safeTotal = Math.max(0, Number(totalQuestions) || 0);
  const safeCorrect = Math.max(0, Number(correctAnswers) || 0);
  const successRate = safeTotal > 0 ? Number(((safeCorrect / safeTotal) * 100).toFixed(2)) : 0;

  await prisma.evaluation.create({
    data: {
      id: `evaluation_${nanoid(10)}`,
      studentId,
      roomId,
      moduleId,
      score: safeScore,
      totalQuestions: safeTotal,
      correctAnswers: safeCorrect,
      successRate,
      responses: {
        create: responses
          .filter((response) => response?.questionId)
          .map((response) => ({
            id: `response_${nanoid(10)}`,
            studentId,
            questionId: response.questionId,
            selectedAnswer: String(response.selectedAnswer ?? ''),
            isCorrect: Boolean(response.isCorrect),
            earnedPoints: Math.max(0, Number(response.earnedPoints) || 0),
          })),
      },
    },
  });
};

export const getStudentEvaluations = async (studentId) => {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      studentId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      room: true,
      module: true,
    },
  });

  return evaluations.map((evaluation) => ({
    id: evaluation.id,
    score: evaluation.score,
    totalQuestions: evaluation.totalQuestions,
    correctAnswers: evaluation.correctAnswers,
    successRate: toNumber(evaluation.successRate),
    createdAt: evaluation.createdAt,
    roomId: evaluation.roomId,
    roomTitle: evaluation.room.title,
    moduleId: evaluation.moduleId,
    moduleTitle: evaluation.module.title,
  }));
};

export const getTeacherDashboard = async (teacherId) => {
  const [totalRooms, totalModules, totalQuestions, totalAttempts, averageResult, rooms, recentEvaluations] = await Promise.all([
    prisma.room.count({
      where: {
        teacherId,
      },
    }),
    prisma.module.count({
      where: {
        room: {
          teacherId,
        },
      },
    }),
    prisma.question.count({
      where: {
        module: {
          room: {
            teacherId,
          },
        },
      },
    }),
    prisma.evaluation.count({
      where: {
        room: {
          teacherId,
        },
      },
    }),
    prisma.evaluation.aggregate({
      where: {
        room: {
          teacherId,
        },
      },
      _avg: {
        successRate: true,
      },
    }),
    prisma.room.findMany({
      where: {
        teacherId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        modules: {
          include: {
            questions: true,
            evaluations: true,
          },
        },
      },
    }),
    prisma.evaluation.findMany({
      where: {
        room: {
          teacherId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        student: {
          select: {
            name: true,
          },
        },
        room: true,
        module: true,
      },
    }),
  ]);

  return {
    overview: {
      totalRooms,
      totalModules,
      totalQuestions,
      totalAttempts,
      averageSuccessRate: toNumber(averageResult._avg.successRate),
    },
    rooms: rooms.map((room) => {
      const modulesCount = room.modules.length;
      const questionsCount = room.modules.reduce((total, module) => total + module.questions.length, 0);
      const attempts = room.modules.flatMap((module) => module.evaluations);
      const attemptsCount = attempts.length;
      const averageScore =
        attemptsCount > 0 ? attempts.reduce((total, item) => total + item.score, 0) / attemptsCount : 0;
      const averageSuccessRate =
        attemptsCount > 0 ? attempts.reduce((total, item) => total + toNumber(item.successRate), 0) / attemptsCount : 0;

      return {
        id: room.id,
        title: room.title,
        modulesCount,
        questionsCount,
        attemptsCount,
        averageScore,
        averageSuccessRate,
      };
    }),
    recentEvaluations: recentEvaluations.map((evaluation) => ({
      id: evaluation.id,
      studentName: evaluation.student.name,
      roomTitle: evaluation.room.title,
      moduleTitle: evaluation.module.title,
      score: evaluation.score,
      correctAnswers: evaluation.correctAnswers,
      totalQuestions: evaluation.totalQuestions,
      successRate: toNumber(evaluation.successRate),
      createdAt: evaluation.createdAt,
    })),
  };
};

export const resetTeacherEvaluations = async ({ teacherId, roomId, moduleId }) => {
  await prisma.evaluation.deleteMany({
    where: {
      ...(roomId ? { roomId } : {}),
      ...(moduleId ? { moduleId } : {}),
      room: {
        teacherId,
      },
    },
  });
};
