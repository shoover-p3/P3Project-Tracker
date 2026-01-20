'use client';

import { useState } from 'react';

interface TopBarProps {
  boardName?: string;
  onSearch: (query: string) => void;
  onCreateCard?: () => void;
}

export default function TopBar({ boardName, onSearch, onCreateCard }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        {boardName && (
          <h2 className="text-2xl font-bold text-gray-800">{boardName}</h2>
        )}
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </form>

        {onCreateCard && (
          <button
            onClick={onCreateCard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Card
          </button>
        )}
      </div>
    </div>
  );
}
