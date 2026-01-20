'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Card from '@/components/Card';
import CardModal from '@/components/CardModal';

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
  position: number;
  updated_at?: string;
}

interface TeamMember {
  id: number;
  name: string;
}

export default function ArchivePage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [archivedCards, setArchivedCards] = useState<CardType[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  useEffect(() => {
    loadBoards();
    loadArchivedCards();
    loadTeamMembers();
  }, []);

  const loadBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadArchivedCards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cards/all');
      const data = await res.json();
      // Filter only done cards
      const archived = data.filter((c: CardType) => c.status === 'done');
      setArchivedCards(archived);
    } catch (error) {
      console.error('Failed to load archived cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
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

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = async (
    title: string,
    description: string,
    assignee: string,
    priority: 'high' | 'medium' | 'low',
    status: 'not_started' | 'in_progress' | 'done',
    boardId: number
  ) => {
    if (!editingCard) return;

    try {
      const boardChanged = editingCard.board_id !== boardId;

      await fetch(`/api/cards?id=${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          assignee,
          priority,
          status,
          board_id: boardId
        }),
      });

      await loadArchivedCards();
      setIsCardModalOpen(false);
      setEditingCard(null);

      // If status changed from 'done' to something else, user will see it disappear
      if (status !== 'done') {
        const boardName = boards.find(b => b.id === boardId)?.name || 'a board';
        alert(`Card unarchived and ${boardChanged ? 'moved to' : 'restored to'} ${boardName}!`);
      } else if (boardChanged) {
        alert(`Card moved to ${boards.find(b => b.id === boardId)?.name}`);
      }
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      await fetch(`/api/cards?id=${cardId}`, {
        method: 'DELETE',
      });
      await loadArchivedCards();
      setIsCardModalOpen(false);
      setEditingCard(null);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const groupedByBoard = archivedCards.reduce((acc, card) => {
    if (!acc[card.board_name]) {
      acc[card.board_name] = [];
    }
    acc[card.board_name].push(card);
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
          boardName="Archive"
          onSearch={() => {}}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Archived Cards</h1>
              <p className="text-gray-600">
                Cards marked as "Done" are automatically archived. Click any card to view details or unarchive it by changing its status.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-500 py-12">Loading archived cards...</div>
            ) : archivedCards.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No archived cards</h3>
                <p className="text-gray-500">
                  Cards will appear here when you mark them as "Done"
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedByBoard).map(([boardName, cards]) => (
                  <div key={boardName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
                      <span>{boardName}</span>
                      <span className="text-sm font-normal text-gray-500">
                        {cards.length} card{cards.length !== 1 ? 's' : ''}
                      </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cards
                        .sort((a, b) => {
                          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                          return dateB - dateA; // Most recently completed first
                        })
                        .map((card) => (
                          <div key={card.id} className="relative">
                            <Card
                              id={card.id}
                              title={card.title}
                              description={card.description}
                              assignee={card.assignee}
                              status={card.status}
                              onClick={() => handleEditCard(card)}
                            />
                            {card.updated_at && (
                              <div className="mt-2 text-xs text-gray-400">
                                Completed: {new Date(card.updated_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isCardModalOpen && editingCard && (
        <CardModal
          card={editingCard}
          teamMembers={teamMembers}
          boards={boards}
          currentBoardId={editingCard.board_id}
          onSave={handleSaveCard}
          onDelete={() => handleDeleteCard(editingCard.id)}
          onClose={() => {
            setIsCardModalOpen(false);
            setEditingCard(null);
          }}
        />
      )}
    </div>
  );
}
