'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Card from '@/components/Card';

interface Board {
  id: number;
  name: string;
}

interface CardType {
  id: number;
  board_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'done';
  board_name: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [results, setResults] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const loadBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (q: string) => {
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleCreateBoard = async (name: string) => {
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const newBoard = await res.json();
      setBoards([...boards, newBoard]);
      router.push(`/board/${newBoard.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleDeleteBoard = async (id: number) => {
    try {
      await fetch(`/api/boards?id=${id}`, {
        method: 'DELETE',
      });
      setBoards(boards.filter(b => b.id !== id));
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleCardClick = (card: CardType) => {
    router.push(`/board/${card.board_id}`);
  };

  const groupedResults = results.reduce((acc, card) => {
    const priority = card.priority;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(card);
    return acc;
  }, {} as Record<string, CardType[]>);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        boards={boards}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          boardName={query ? `Search: "${query}"` : 'Search'}
          onSearch={handleSearch}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center text-gray-500 py-12">Searching...</div>
            ) : !query ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">Enter a search query to find cards</p>
                <p className="text-sm">Search by title, description, or assignee name</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">No cards found for "{query}"</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Found {results.length} {results.length === 1 ? 'card' : 'cards'}
                  </h2>
                </div>

                {/* Group by Priority */}
                {(['high', 'medium', 'low'] as const).map((priority) => {
                  const cards = groupedResults[priority];
                  if (!cards || cards.length === 0) return null;

                  return (
                    <div key={priority} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        {priority === 'high' && (
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        )}
                        {priority === 'medium' && (
                          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        )}
                        {priority === 'low' && (
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        )}
                        {priority} Priority ({cards.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cards.map((card) => (
                          <Card
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            description={card.description}
                            assignee={card.assignee}
                            status={card.status}
                            boardName={card.board_name}
                            onClick={() => handleCardClick(card)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
