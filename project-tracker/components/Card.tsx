'use client';

interface CardProps {
  id: number;
  title: string;
  description?: string | null;
  assignee?: string | null;
  status?: 'not_started' | 'in_progress' | 'done';
  boardName?: string;
  onClick: () => void;
}

export default function Card({ id, title, description, assignee, status, boardName, onClick }: CardProps) {
  const statusColors = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700'
  };

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    done: 'Done'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 flex-1">{title}</h3>
        {status && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {assignee && <span>@{assignee}</span>}
        {boardName && <span className="text-gray-400 italic">{boardName}</span>}
      </div>
    </div>
  );
}
