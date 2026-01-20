'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import Card from './Card';

interface CardType {
  id: number;
  board_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'done';
  position: number;
}

interface BoardProps {
  cards: CardType[];
  onCardClick: (card: CardType) => void;
  onMoveCard: (cardId: number, newPriority: 'high' | 'medium' | 'low', newPosition: number) => void;
}

interface SortableCardProps {
  card: CardType;
  onCardClick: (card: CardType) => void;
}

function SortableCard({ card, onCardClick }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        id={card.id}
        title={card.title}
        description={card.description}
        assignee={card.assignee}
        status={card.status}
        onClick={() => onCardClick(card)}
      />
    </div>
  );
}

export default function Board({ cards, onCardClick, onMoveCard }: BoardProps) {
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts (allows clicks)
      },
    })
  );

  // Filter out completed cards - they're automatically archived
  const activeCards = cards.filter(c => c.status !== 'done');

  const highCards = activeCards.filter(c => c.priority === 'high');
  const mediumCards = activeCards.filter(c => c.priority === 'medium');
  const lowCards = activeCards.filter(c => c.priority === 'low');

  const handleDragStart = (event: DragStartEvent) => {
    const card = activeCards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Find the active card
    const activeCard = activeCards.find(c => c.id === activeId);
    if (!activeCard) return;

    // Determine the target priority
    let targetPriority: 'high' | 'medium' | 'low';
    let targetCards: CardType[];

    if (overId === 'high-column' || overId === 'medium-column' || overId === 'low-column') {
      // Dropped on a column
      targetPriority = overId.replace('-column', '') as 'high' | 'medium' | 'low';
      targetCards = activeCards.filter(c => c.priority === targetPriority);
    } else {
      // Dropped on another card
      const overCard = activeCards.find(c => c.id === overId);
      if (!overCard) return;

      targetPriority = overCard.priority;
      targetCards = activeCards.filter(c => c.priority === targetPriority);
    }

    // Calculate new position
    let newPosition = 0;

    if (overId === `${targetPriority}-column`) {
      // Dropped at end of column
      newPosition = targetCards.length;
    } else {
      // Dropped on a card
      const overIndex = targetCards.findIndex(c => c.id === overId);
      if (overIndex !== -1) {
        const activeIndex = targetCards.findIndex(c => c.id === activeId);

        if (activeCard.priority === targetPriority && activeIndex !== -1) {
          // Moving within same column
          newPosition = activeIndex < overIndex ? overIndex : overIndex;
        } else {
          // Moving to different column
          newPosition = overIndex;
        }
      }
    }

    // Only update if something changed
    if (activeCard.priority !== targetPriority || newPosition !== activeCard.position) {
      onMoveCard(activeId, targetPriority, newPosition);
    }
  };

  const Column = ({
    title,
    cards,
    priority
  }: {
    title: string;
    cards: CardType[];
    priority: 'high' | 'medium' | 'low'
  }) => {
    const cardIds = cards.map(c => c.id);
    const { setNodeRef, isOver } = useDroppable({
      id: `${priority}-column`,
    });

    return (
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center justify-between">
              {title}
              <span className="text-xs text-gray-500 font-normal">({cards.length})</span>
            </h3>
          </div>
          <div
            ref={setNodeRef}
            className={`flex-1 overflow-y-auto p-4 space-y-3 transition-colors ${
              isOver ? 'bg-blue-50' : 'bg-gray-50'
            }`}
            data-column={priority}
          >
            {cards.length === 0 ? (
              <div className={`text-center text-sm py-8 transition-colors ${
                isOver ? 'text-blue-500 font-medium' : 'text-gray-400'
              }`}>
                {isOver ? 'Drop here' : 'Drag cards here'}
              </div>
            ) : (
              cards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  onCardClick={onCardClick}
                />
              ))
            )}
          </div>
        </div>
      </SortableContext>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full divide-x divide-gray-200">
        <Column title="High Priority" cards={highCards} priority="high" />
        <Column title="Medium Priority" cards={mediumCards} priority="medium" />
        <Column title="Low Priority" cards={lowCards} priority="low" />
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="opacity-90">
            <Card
              id={activeCard.id}
              title={activeCard.title}
              description={activeCard.description}
              assignee={activeCard.assignee}
              status={activeCard.status}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
