'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Board from '@/components/Board';
import CardModal from '@/components/CardModal';

interface Board {
  id: number;
  name: string;
}

interface Card {
  id: number;
  board_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'done';
  position: number;
}

interface TeamMember {
  id: number;
  name: string;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = Number(params.id);

  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load boards
  useEffect(() => {
    loadBoards();
    loadTeamMembers();
  }, []);

  // Load current board and cards when boardId changes
  useEffect(() => {
    if (boardId) {
      loadCurrentBoard();
      loadCards();
    }
  }, [boardId]);

  const loadBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadCurrentBoard = async () => {
    try {
      const board = boards.find(b => b.id === boardId);
      if (board) {
        setCurrentBoard(board);
      } else {
        const res = await fetch('/api/boards');
        const data = await res.json();
        const foundBoard = data.find((b: Board) => b.id === boardId);
        setCurrentBoard(foundBoard || null);
      }
    } catch (error) {
      console.error('Failed to load current board:', error);
    }
  };

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/cards?board_id=${boardId}`);
      const data = await res.json();
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
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
      const updatedBoards = boards.filter(b => b.id !== id);
      setBoards(updatedBoards);

      // If we deleted the current board, navigate to first board or home
      if (id === boardId) {
        if (updatedBoards.length > 0) {
          router.push(`/board/${updatedBoards[0].id}`);
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleCreateCard = () => {
    setEditingCard(null);
    setIsCardModalOpen(true);
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = async (
    title: string,
    description: string,
    assignee: string,
    priority: 'high' | 'medium' | 'low',
    status: 'not_started' | 'in_progress' | 'done',
    targetBoardId: number
  ) => {
    try {
      if (editingCard) {
        // Update existing card
        const boardChanged = editingCard.board_id !== targetBoardId;

        await fetch(`/api/cards?id=${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            assignee,
            priority,
            status,
            board_id: targetBoardId
          }),
        });

        setIsCardModalOpen(false);
        setEditingCard(null);

        if (boardChanged) {
          // Card moved to different board
          if (targetBoardId === boardId) {
            // Moved to current board, reload
            await loadCards();
          } else {
            // Moved to different board, navigate there or just reload current
            await loadCards(); // Remove from current board
            alert(`Card moved to ${boards.find(b => b.id === targetBoardId)?.name || 'another board'}`);
          }
        } else {
          // Same board, just reload
          await loadCards();
        }
      } else {
        // Create new card
        await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board_id: targetBoardId,
            title,
            description,
            assignee,
            priority,
            status,
          }),
        });

        setIsCardModalOpen(false);
        setEditingCard(null);

        if (targetBoardId === boardId) {
          // Created on current board
          await loadCards();
        } else {
          // Created on different board
          alert(`Card created on ${boards.find(b => b.id === targetBoardId)?.name}`);
          // Optionally navigate: router.push(`/board/${targetBoardId}`);
        }
      }
    } catch (error) {
      console.error('Failed to save card:', error);
      alert('Failed to save card. Please try again.');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      await fetch(`/api/cards?id=${cardId}`, {
        method: 'DELETE',
      });
      await loadCards();
      setIsCardModalOpen(false);
      setEditingCard(null);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }
    // Navigate to search page
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleMoveCard = async (
    cardId: number,
    newPriority: 'high' | 'medium' | 'low',
    newPosition: number
  ) => {
    try {
      // Optimistically update UI
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const oldPriority = card.priority;
      const oldPosition = card.position;

      // Get cards in the old and new priority columns
      const sameColumn = oldPriority === newPriority;

      // Create updated cards array
      let updatedCards = [...cards];

      // Remove card from old position
      updatedCards = updatedCards.map(c => {
        if (c.id === cardId) {
          return { ...c, priority: newPriority, position: newPosition };
        }

        // Adjust positions in old column
        if (!sameColumn && c.priority === oldPriority && c.position > oldPosition) {
          return { ...c, position: c.position - 1 };
        }

        // Adjust positions in new column
        if (!sameColumn && c.priority === newPriority && c.position >= newPosition) {
          return { ...c, position: c.position + 1 };
        }

        // Adjust positions in same column
        if (sameColumn && c.priority === oldPriority) {
          if (oldPosition < newPosition && c.position > oldPosition && c.position <= newPosition) {
            return { ...c, position: c.position - 1 };
          }
          if (oldPosition > newPosition && c.position >= newPosition && c.position < oldPosition) {
            return { ...c, position: c.position + 1 };
          }
        }

        return c;
      });

      setCards(updatedCards);

      // Send to server
      await fetch(`/api/cards/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          boardId,
          newPriority,
          newPosition
        }),
      });

      // Reload to ensure consistency
      await loadCards();
    } catch (error) {
      console.error('Failed to move card:', error);
      await loadCards(); // Reload on error
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        boards={boards}
        currentBoardId={boardId}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          boardName={currentBoard?.name}
          onSearch={handleSearch}
          onCreateCard={handleCreateCard}
        />

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <Board
              cards={cards}
              onCardClick={handleEditCard}
              onMoveCard={handleMoveCard}
            />
          )}
        </div>
      </div>

      {isCardModalOpen && (
        <CardModal
          card={editingCard}
          teamMembers={teamMembers}
          boards={boards}
          currentBoardId={boardId}
          onSave={handleSaveCard}
          onDelete={editingCard ? () => handleDeleteCard(editingCard.id) : undefined}
          onClose={() => {
            setIsCardModalOpen(false);
            setEditingCard(null);
          }}
        />
      )}
    </div>
  );
}
