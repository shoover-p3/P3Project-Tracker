'use client';

import { useState, useEffect } from 'react';

interface Card {
  id: number;
  board_id?: number;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'done';
}

interface TeamMember {
  id: number;
  name: string;
}

interface Board {
  id: number;
  name: string;
}

interface CardModalProps {
  card: Card | null;
  teamMembers: TeamMember[];
  boards: Board[];
  currentBoardId: number;
  onSave: (
    title: string,
    description: string,
    assignee: string,
    priority: 'high' | 'medium' | 'low',
    status: 'not_started' | 'in_progress' | 'done',
    boardId: number
  ) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function CardModal({ card, teamMembers, boards, currentBoardId, onSave, onDelete, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [assignee, setAssignee] = useState(card?.assignee || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(card?.priority || 'high');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'done'>(card?.status || 'not_started');
  const [boardId, setBoardId] = useState<number>(card?.board_id || currentBoardId);

  useEffect(() => {
    setTitle(card?.title || '');
    setDescription(card?.description || '');
    setAssignee(card?.assignee || '');
    setPriority(card?.priority || 'high');
    setStatus(card?.status || 'not_started');
    setBoardId(card?.board_id || currentBoardId);
  }, [card, currentBoardId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim(), description.trim(), assignee, priority, status, boardId);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {card ? 'Edit Card' : 'New Card'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this card..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 mb-2">
                {[
                  { value: 'not_started', label: 'Not Started', color: 'gray' },
                  { value: 'in_progress', label: 'In Progress', color: 'blue' },
                  { value: 'done', label: 'Done', color: 'green' }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value as 'not_started' | 'in_progress' | 'done')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      status === s.value
                        ? s.color === 'gray'
                          ? 'bg-gray-600 text-white'
                          : s.color === 'blue'
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {status === 'done' && !card && (
                <p className="text-sm text-gray-500 italic">
                  💡 Cards marked as "Done" are automatically archived and removed from the board
                </p>
              )}
              {status !== 'done' && card?.status === 'done' && (
                <p className="text-sm text-blue-600 italic">
                  ℹ️ Changing status will unarchive this card and restore it to the board
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-600 text-white'
                          : p === 'medium'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Board */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board <span className="text-red-500">*</span>
              </label>
              <select
                value={boardId}
                onChange={(e) => setBoardId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
              {card && card.board_id !== boardId && (
                <p className="text-sm text-blue-600 italic mt-2">
                  ℹ️ This card will be moved to the selected board
                </p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete Card
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {card ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
