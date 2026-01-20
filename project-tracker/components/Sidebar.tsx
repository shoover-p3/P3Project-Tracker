'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Board {
  id: number;
  name: string;
}

interface SidebarProps {
  boards: Board[];
  currentBoardId?: number;
  onCreateBoard: (name: string) => void;
  onDeleteBoard: (id: number) => void;
}

export default function Sidebar({
  boards,
  currentBoardId,
  onCreateBoard,
  onDeleteBoard,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreate = () => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim());
      setNewBoardName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Project Tracker</h1>
        <p className="text-xs text-gray-400 mt-1">Phase 3</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase">Boards</h2>
          </div>

          <div className="space-y-1">
            {boards.map((board) => (
              <div
                key={board.id}
                className={`flex items-center justify-between group rounded px-3 py-2 ${
                  currentBoardId === board.id
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-800'
                }`}
              >
                <Link
                  href={`/board/${board.id}`}
                  className="flex-1 text-sm"
                >
                  {board.name}
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${board.name}"? This will permanently delete all cards in this board.`)) {
                      onDeleteBoard(board.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {isCreating ? (
          <div className="mt-2">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewBoardName('');
                }
              }}
              placeholder="Board name..."
              className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreate}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewBoardName('');
                }}
                className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded"
          >
            + New Board
          </button>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <Link
          href="/archive"
          className="block w-full px-3 py-2 text-center text-sm bg-gray-800 hover:bg-gray-700 rounded"
        >
          Archive
        </Link>
        <Link
          href="/print"
          className="block w-full px-3 py-2 text-center text-sm bg-gray-800 hover:bg-gray-700 rounded"
        >
          Print/Reports
        </Link>
        <Link
          href="/settings"
          className="block w-full px-3 py-2 text-center text-sm bg-gray-800 hover:bg-gray-700 rounded"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
