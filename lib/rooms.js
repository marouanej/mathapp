import { nanoid } from 'nanoid';
import { COURSE_MODULES } from '../data/courseModules';
import { validateCorrectAnswer } from './questionValidation';
import { resolveQuestionType } from './questionTypes';
import { prisma } from './prisma';

const roomInclude = {
  modules: {
    orderBy: {
      position: 'asc',
    },
    include: {
      questions: {
        orderBy: {
          position: 'asc',
        },
      },
    },
  },
};

const serializeQuestion = (question) => ({
  id: question.id,
  moduleId: question.moduleId,
  text: question.text,
  question: question.text,
  correctAnswer: question.correctAnswer,
  responseType: question.responseType,
  type: question.responseType,
  hint: question.hint || '',
  explanation: question.explanation || '',
  skillCode: question.skillCode || '',
  isActive: question.isActive,
  order: question.position,
});

const serializeModule = (module) => ({
  id: module.id,
  roomId: module.roomId,
  title: module.title,
  description: module.description || '',
  moduleType: module.moduleType,
  isActive: module.isActive,
  order: module.position,
  questions: module.questions.map(serializeQuestion),
});

const serializeRoom = (room) => ({
  id: room.id,
  title: room.title,
  level: room.level,
  description: room.description || '',
  teacherId: room.teacherId,
  isActive: room.isActive,
  modules: room.modules.map(serializeModule),
});

const normalizeQuestionPayload = (payload = {}) => {
  const responseType = resolveQuestionType(payload.responseType ?? payload.type, {
    correctAnswer: payload.correctAnswer,
    allowInferFromAnswer: false,
    fallback: null,
  });

  return {
    id: payload.id,
    moduleId: payload.moduleId,
    text: String(payload.text ?? payload.question ?? '').trim(),
    correctAnswer: String(payload.correctAnswer ?? '').trim(),
    responseType,
    hint: String(payload.hint ?? '').trim(),
    explanation: String(payload.explanation ?? '').trim(),
    skillCode: String(payload.skillCode ?? payload.skillcode ?? '').trim(),
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true,
  };
};

const getTeacherRoom = async (teacherId, roomId) => {
  return prisma.room.findFirst({
    where: {
      id: roomId,
      teacherId,
    },
    include: roomInclude,
  });
};

export const getRoomsForUser = async (user) => {
  const baseInclude =
    user.role === 'maitre'
      ? roomInclude
      : {
          modules: {
            where: {
              isActive: true,
            },
            orderBy: {
              position: 'asc',
            },
            include: {
              questions: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  position: 'asc',
                },
              },
            },
          },
        };

  const rooms = await prisma.room.findMany({
    where:
      user.role === 'maitre'
        ? {
            teacherId: user.id,
          }
        : {
            isActive: true,
          },
    orderBy: {
      createdAt: 'asc',
    },
    include: baseInclude,
  });

  return rooms.map(serializeRoom);
};

export const createRoomWithDefaultModules = async ({ title, teacherId, description = '' }) => {
  const room = await prisma.room.create({
    data: {
      id: `room_${nanoid(10)}`,
      title,
      level: '6e primaire',
      description,
      teacherId,
      modules: {
        create: COURSE_MODULES.map((module, index) => ({
          id: `module_${nanoid(10)}`,
          title: module.label,
          description: module.description,
          moduleType: module.id,
          position: index,
        })),
      },
    },
  });

  return room.id;
};

export const updateRoomById = async ({ teacherId, roomId, payload }) => {
  await prisma.room.updateMany({
    where: {
      id: roomId,
      teacherId,
    },
    data: {
      ...(typeof payload.title === 'string' ? { title: payload.title.trim() } : {}),
      ...(typeof payload.description === 'string' ? { description: payload.description.trim() } : {}),
      ...(typeof payload.level === 'string' ? { level: payload.level.trim() || '6e primaire' } : {}),
      ...(typeof payload.isActive === 'boolean' ? { isActive: payload.isActive } : {}),
    },
  });
};

export const deleteRoomById = async ({ teacherId, roomId }) => {
  await prisma.room.deleteMany({
    where: {
      id: roomId,
      teacherId,
    },
  });
};

export const duplicateRoomById = async ({ teacherId, roomId }) => {
  const sourceRoom = await getTeacherRoom(teacherId, roomId);

  if (!sourceRoom) {
    throw new Error('Salle introuvable.');
  }

  const duplicatedRoom = await prisma.room.create({
    data: {
      id: `room_${nanoid(10)}`,
      title: `${sourceRoom.title} - copie`,
      level: sourceRoom.level,
      description: sourceRoom.description || '',
      teacherId,
      isActive: sourceRoom.isActive,
      modules: {
        create: sourceRoom.modules.map((module) => ({
          id: `module_${nanoid(10)}`,
          title: module.title,
       
          position: module.position,
          isActive: module.isActive,
          questions: {
            create: module.questions.map((question) => ({
              id: `question_${nanoid(10)}`,
              text: question.text,
              responseType: question.responseType,
              correctAnswer: question.correctAnswer,
              skillCode: question.skillCode || '',
              hint: question.hint || '',
              explanation: question.explanation || '',
              position: question.position,
              isActive: question.isActive,
            })),
          },
        })),
      },
    },
  });

  return duplicatedRoom.id;
};

export const createModuleInRoom = async ({ teacherId, roomId, payload }) => {
 
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      teacherId,
    },
    include: {
      modules: {
        orderBy: {
          position: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!room) {
    throw new Error('Salle introuvable.');
  }



  await prisma.module.create({
    data: {
      id: `module_${nanoid(10)}`,
      roomId,
      title: payload.title?.trim(),
      position: (room.modules[0]?.position ?? -1) + 1,
      isActive: payload.isActive ?? true,
    },
  });
};

export const updateModuleById = async ({ teacherId, moduleId, payload }) => {
  const module = await prisma.module.findFirst({
    where: {
      id: moduleId,
      room: {
        teacherId,
      },
    },
  });

  if (!module) {
    throw new Error('Module introuvable.');
  }

  await prisma.module.update({
    where: {
      id: moduleId,
    },
    data: {
      ...(typeof payload.title === 'string' ? { title: payload.title.trim() } : {}),
  
      ...(typeof payload.isActive === 'boolean' ? { isActive: payload.isActive } : {}),
    },
  });
};

export const deleteModuleById = async ({ teacherId, moduleId }) => {
  await prisma.module.deleteMany({
    where: {
      id: moduleId,
      room: {
        teacherId,
      },
    },
  });
};

export const upsertQuestion = async ({ teacherId, roomId, payload }) => {
  const normalizedPayload = normalizeQuestionPayload(payload);
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      teacherId,
    },
  });

  if (!room) {
    throw new Error('Salle introuvable.');
  }

  const module = await prisma.module.findFirst({
    where: {
      id: normalizedPayload.moduleId,
      roomId,
    },
    include: {
      questions: {
        orderBy: {
          position: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!module) {
    throw new Error('Module introuvable.');
  }

  const validation = validateCorrectAnswer(normalizedPayload.responseType, normalizedPayload.correctAnswer);

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (!normalizedPayload.text) {
    throw new Error('Le texte de la question est obligatoire.');
  }

  if (normalizedPayload.id) {
    await prisma.question.update({
      where: {
        id: normalizedPayload.id,
      },
      data: {
        moduleId: module.id,
        text: normalizedPayload.text,
        responseType: validation.type,
        correctAnswer: validation.normalized,
        skillCode: normalizedPayload.skillCode,
        hint: normalizedPayload.hint,
        explanation: normalizedPayload.explanation,
        isActive: normalizedPayload.isActive,
      },
    });

    return normalizedPayload.id;
  }

  const question = await prisma.question.create({
    data: {
      id: `question_${nanoid(10)}`,
      moduleId: module.id,
      text: normalizedPayload.text,
      responseType: validation.type,
      correctAnswer: validation.normalized,
      skillCode: normalizedPayload.skillCode,
      hint: normalizedPayload.hint,
      explanation: normalizedPayload.explanation,
      position: (module.questions[0]?.position ?? -1) + 1,
      isActive: normalizedPayload.isActive,
    },
  });

  return question.id;
};

export const deleteQuestionById = async ({ teacherId, questionId }) => {
  await prisma.question.deleteMany({
    where: {
      id: questionId,
      module: {
        room: {
          teacherId,
        },
      },
    },
  });
};

export const toggleQuestionActive = async ({ teacherId, questionId, isActive }) => {
  await prisma.question.updateMany({
    where: {
      id: questionId,
      module: {
        room: {
          teacherId,
        },
      },
    },
    data: {
      isActive,
    },
  });
};

export const moveQuestionByDirection = async ({ teacherId, roomId, moduleId, questionId, direction }) => {
  const module = await prisma.module.findFirst({
    where: {
      id: moduleId,
      roomId,
      room: {
        teacherId,
      },
    },
    include: {
      questions: {
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  if (!module) {
    throw new Error('Module introuvable.');
  }

  const index = module.questions.findIndex((question) => question.id === questionId);

  if (index === -1) {
    throw new Error('Question introuvable.');
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= module.questions.length) {
    return;
  }

  const currentQuestion = module.questions[index];
  const targetQuestion = module.questions[targetIndex];

  await prisma.$transaction([
    prisma.question.update({
      where: {
        id: currentQuestion.id,
      },
      data: {
        position: targetQuestion.position,
      },
    }),
    prisma.question.update({
      where: {
        id: targetQuestion.id,
      },
      data: {
        position: currentQuestion.position,
      },
    }),
  ]);
};
