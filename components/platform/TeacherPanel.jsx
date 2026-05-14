'use client';

import React, { useState, useMemo } from 'react';
// import { Trash2 } from 'lucide-react';
import { QUESTION_TYPE_OPTIONS, resolveQuestionType } from '../../lib/questionTypes';

export const TeacherPanel = ({
  rooms,
  onCreateRoom,
  onCreateModule,
  onSaveQuestion,
  onDeleteRoom,
  onDeleteModule,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');

  const [roomTitle, setRoomTitle] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [questionForm, setQuestionForm] = useState({
    question: '',
    correctAnswer: '',
    responseType: 'integer',
    skillCode: '',
    hint: '',
    explanation: '',
  });

  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false);
  const [deleteModuleId, setDeleteModuleId] = useState(null);
  const [deletingModule, setDeletingModule] = useState(false);

  ////////////////////////////////////////////////////////////
  // DERIVED
  ////////////////////////////////////////////////////////////

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const selectedModule = useMemo(
    () =>
      selectedRoom?.modules.find((m) => m.id === selectedModuleId),
    [selectedRoom, selectedModuleId]
  );

  ////////////////////////////////////////////////////////////
  // ROOM
  ////////////////////////////////////////////////////////////

  const handleCreateRoom = async () => {
    if (!roomTitle.trim()) return;

    const room = await onCreateRoom(
      roomTitle
    );

    setRoomTitle('');
    setSelectedRoomId(room.id);
  };

  ////////////////////////////////////////////////////////////
  // MODULE (WITH CATEGORY)
  ////////////////////////////////////////////////////////////

  const handleCreateModule = async () => {
    if (!moduleTitle || !selectedRoomId) return;

    await onCreateModule({
      roomId: selectedRoomId,
      title: moduleTitle,
      isActive: true,
    });

    setModuleTitle('');
    setSelectedCategoryId('');
  };

  ////////////////////////////////////////////////////////////
  // QUESTION (WITH SKILL)
  ////////////////////////////////////////////////////////////

  const handleCreateQuestion = async () => {
  // Basic validation
  if (!questionForm?.question?.trim() || !questionForm?.correctAnswer?.trim() || !selectedModuleId) {
    console.warn('Please fill all required fields');
    return;
  }

  try {
    // Create the question
    await onSaveQuestion(selectedRoomId,{
      moduleId: selectedModuleId,
      text: questionForm.question.trim(),
      correctAnswer: questionForm.correctAnswer.trim(),
      responseType: resolveQuestionType(questionForm.responseType, {
        correctAnswer: questionForm.correctAnswer,
      }),
      skillCode: questionForm.skillCode || '',
      hint: questionForm.hint?.trim() || '',
      explanation: questionForm.explanation?.trim() || '',
    });

    // Reset form
    setQuestionForm({
      question: '',
      correctAnswer: '',
      responseType: 'integer',
      skillCode: '',
      hint: '',
      explanation: '',
    });

    // Optional: reset selected module if needed
    // setSelectedModuleId('');
  } catch (error) {
    console.error('Failed to create question:', error);
    // Optional: show toast or error message to user
  }
};

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    setDeletingRoom(true);
    try {
      await onDeleteRoom(deleteRoomId);
      setShowDeleteRoomModal(false);
      setDeleteRoomId(null);
      if (selectedRoomId === deleteRoomId) {
        setSelectedRoomId('');
        setSelectedModuleId('');
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModuleId) return;
    setDeletingModule(true);
    try {
      await onDeleteModule(deleteModuleId);
      setShowDeleteModuleModal(false);
      setDeleteModuleId(null);
      if (selectedModuleId === deleteModuleId) {
        setSelectedModuleId('');
      }
    } catch (error) {
      console.error('Failed to delete module:', error);
    } finally {
      setDeletingModule(false);
    }
  };

  ////////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////////

  return (
    <>
      <div className="space-y-4">

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">Créer une salle</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Nouveau room</h2>
          </div>
          <p className="text-sm text-slate-500">Ajoutez une salle pour organiser vos modules et questions.</p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="Nom de la salle"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />
            <button
              onClick={handleCreateRoom}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              +
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {rooms.map((room) => (
              <div key={room.id} className="relative">
                <button
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    room.id === selectedRoomId ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {room.title}
                </button>
                <button
                  onClick={() => {
                    setDeleteRoomId(room.id);
                    setShowDeleteRoomModal(true);
                  }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Supprimer cette salle"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRoom && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">Ajouter un module</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Module pour « {selectedRoom.title} »</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selectedRoom.modules.length} modules</span>
            </div>

            <div className="grid gap-3">
              <input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Nom du module"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
              />
              <button
                onClick={handleCreateModule}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Ajouter module
              </button>
            </div>

            <div className="grid gap-2">
              {selectedRoom.modules.map((m) => (
                <div key={m.id} className="relative">
                  <button
                    onClick={() => setSelectedModuleId(m.id)}
                    className={`w-full rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                      m.id === selectedModuleId ? 'border-sky-500 bg-sky-50 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {m.title}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModuleId(m.id);
                      setShowDeleteModuleModal(true);
                    }}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Supprimer ce module"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedModule && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">Ajouter une question</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Module « {selectedModule.title} »</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{selectedModule.questions?.length || 0} questions</span>
          </div>

          <div className="mt-3 grid gap-3">
            <textarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              placeholder="Question"
              className="min-h-[96px] w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />

            <input
              value={questionForm.correctAnswer}
              onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
              placeholder="Réponse correcte"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />

            <select
              value={questionForm.responseType}
              onChange={(e) => setQuestionForm({ ...questionForm, responseType: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              value={questionForm.hint}
              onChange={(e) => setQuestionForm({ ...questionForm, hint: e.target.value })}
              placeholder="Indice"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />

            <textarea
              value={questionForm.explanation}
              onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              placeholder="Explication"
              className="min-h-[96px] w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />

            <button
              onClick={handleCreateQuestion}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              Ajouter la question
            </button>
          </div>
        </div>
      )}
    </div>

    {showDeleteRoomModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900">Supprimer cette salle ?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Cette action est irréversible. Tous les modules et questions associés seront supprimés.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowDeleteRoomModal(false)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteRoom}
              disabled={deletingRoom}
              className="flex-1 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deletingRoom ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    )}

    {showDeleteModuleModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900">Supprimer ce module ?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Cette action est irréversible. Toutes les questions associées seront supprimées.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowDeleteModuleModal(false)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteModule}
              disabled={deletingModule}
              className="flex-1 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deletingModule ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
