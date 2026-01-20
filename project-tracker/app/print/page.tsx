'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import * as XLSX from 'xlsx';

interface Board {
  id: number;
  name: string;
}

interface TeamMember {
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
  created_at: string;
  updated_at?: string;
}

export default function PrintPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allCards, setAllCards] = useState<CardType[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<'boards' | 'priority' | 'user' | 'summary'>('boards');
  const [selectedBoards, setSelectedBoards] = useState<number[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['high', 'medium', 'low']);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBoards();
    loadTeamMembers();
    loadAllCards();
  }, []);

  const loadBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data);
      setSelectedBoards(data.map((b: Board) => b.id));
    } catch (error) {
      console.error('Failed to load boards:', error);
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

  const loadAllCards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cards/all');
      const data = await res.json();
      setAllCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setIsLoading(false);
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

  const getFilteredCards = () => {
    let filtered = allCards;

    if (filterType === 'boards') {
      filtered = filtered.filter(c => selectedBoards.includes(c.board_id));
    } else if (filterType === 'priority') {
      filtered = filtered.filter(c => selectedPriorities.includes(c.priority));
    } else if (filterType === 'user' && selectedUser) {
      filtered = filtered.filter(c => c.assignee === selectedUser);
    } else if (filterType === 'summary') {
      filtered = filtered.filter(c => c.status === 'done');
      if (startDate) {
        filtered = filtered.filter(c => c.updated_at && c.updated_at >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(c => c.updated_at && c.updated_at <= endDate + 'T23:59:59');
      }
    }

    return filtered;
  };

  const filteredCards = getFilteredCards();

  const groupCardsByBoard = () => {
    const grouped: Record<string, CardType[]> = {};
    filteredCards.forEach(card => {
      if (!grouped[card.board_name]) {
        grouped[card.board_name] = [];
      }
      grouped[card.board_name].push(card);
    });
    return grouped;
  };

  const groupCardsByPriority = () => {
    const grouped: Record<string, CardType[]> = {
      high: [],
      medium: [],
      low: []
    };
    filteredCards.forEach(card => {
      grouped[card.priority].push(card);
    });
    return grouped;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const exportData = filteredCards.map(card => ({
      'Board': card.board_name,
      'Title': card.title,
      'Description': card.description || '',
      'Priority': card.priority,
      'Status': card.status.replace('_', ' '),
      'Assignee': card.assignee || 'Unassigned',
      'Created': new Date(card.created_at).toLocaleDateString(),
      'Updated': card.updated_at ? new Date(card.updated_at).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cards');

    // Generate filename with date and filter type
    const dateStr = new Date().toISOString().split('T')[0];
    const filterName = filterType === 'boards' ? 'by-boards' :
                       filterType === 'priority' ? 'by-priority' :
                       filterType === 'user' ? `by-user-${selectedUser || 'all'}` :
                       'summary';
    const filename = `project-tracker-${filterName}-${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const handleExportCSV = () => {
    const headers = ['Board', 'Title', 'Description', 'Priority', 'Status', 'Assignee', 'Created', 'Updated'];

    const rows = filteredCards.map(card => [
      card.board_name,
      card.title,
      (card.description || '').replace(/,/g, ';').replace(/\n/g, ' '), // Escape commas and newlines
      card.priority,
      card.status.replace('_', ' '),
      card.assignee || 'Unassigned',
      new Date(card.created_at).toLocaleDateString(),
      card.updated_at ? new Date(card.updated_at).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const filterName = filterType === 'boards' ? 'by-boards' :
                       filterType === 'priority' ? 'by-priority' :
                       filterType === 'user' ? `by-user-${selectedUser || 'all'}` :
                       'summary';
    const filename = `project-tracker-${filterName}-${dateStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="print:hidden">
        <Sidebar
          boards={boards}
          onCreateBoard={handleCreateBoard}
          onDeleteBoard={handleDeleteBoard}
        />
      </div>

      <div className="flex-1 flex flex-col print:w-full">
        <div className="print:hidden">
          <TopBar
            boardName="Print / Reports"
            onSearch={() => {}}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Filter Section - Hide when printing */}
          <div className="print:hidden bg-white border-b border-gray-200 p-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Report Filters</h2>

              {/* Report Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setFilterType('boards')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'boards'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By Boards
                  </button>
                  <button
                    onClick={() => setFilterType('priority')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'priority'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By Priority
                  </button>
                  <button
                    onClick={() => setFilterType('user')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By User
                  </button>
                  <button
                    onClick={() => setFilterType('summary')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === 'summary'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Summary
                  </button>
                </div>
              </div>

              {/* Boards Filter */}
              {filterType === 'boards' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Boards
                  </label>
                  <div className="space-y-2">
                    {boards.map(board => (
                      <label key={board.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBoards.includes(board.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBoards([...selectedBoards, board.id]);
                            } else {
                              setSelectedBoards(selectedBoards.filter(id => id !== board.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">{board.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Filter */}
              {filterType === 'priority' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Priorities
                  </label>
                  <div className="flex gap-4">
                    {['high', 'medium', 'low'].map(priority => (
                      <label key={priority} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPriorities.includes(priority)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPriorities([...selectedPriorities, priority]);
                            } else {
                              setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700 capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* User Filter */}
              {filterType === 'user' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Users</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary Filter (Date Range) */}
              {filterType === 'summary' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed Cards Date Range
                  </label>
                  <div className="flex gap-4 items-center">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Leave dates empty to show all completed cards
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Report
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
              {/* Report Header */}
              <div className="mb-8 print:mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {filterType === 'boards' && 'Boards Report'}
                  {filterType === 'priority' && 'Priority Report'}
                  {filterType === 'user' && `User Report${selectedUser ? `: ${selectedUser}` : ''}`}
                  {filterType === 'summary' && 'Accomplishments Summary'}
                </h1>
                <p className="text-gray-600">
                  Generated on {new Date().toLocaleDateString()}
                  {filterType === 'summary' && startDate && endDate &&
                    ` | ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Total Cards: {filteredCards.length}
                </p>
              </div>

              {isLoading ? (
                <div className="text-center text-gray-500 py-12">Loading...</div>
              ) : filteredCards.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No cards match the selected filters
                </div>
              ) : (
                <>
                  {/* By Boards */}
                  {filterType === 'boards' && (
                    <div className="space-y-8">
                      {Object.entries(groupCardsByBoard()).map(([boardName, cards]) => (
                        <div key={boardName} className="break-inside-avoid">
                          <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                            {boardName} ({cards.length})
                          </h2>
                          <div className="grid grid-cols-3 gap-6">
                            {(['high', 'medium', 'low'] as const).map(priority => {
                              const priorityCards = cards.filter(c => c.priority === priority);
                              if (priorityCards.length === 0) return null;
                              return (
                                <div key={priority}>
                                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                                    {priority} ({priorityCards.length})
                                  </h3>
                                  <ul className="space-y-2">
                                    {priorityCards.map(card => (
                                      <li key={card.id} className="text-sm">
                                        <div className="font-medium text-gray-800">{card.title}</div>
                                        {card.assignee && (
                                          <div className="text-xs text-gray-500">@{card.assignee}</div>
                                        )}
                                        <div className="text-xs text-gray-400">
                                          {card.status === 'done' && '✓ '}
                                          {card.status === 'in_progress' && '⟳ '}
                                          {card.status === 'not_started' && '○ '}
                                          {card.status.replace('_', ' ')}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* By Priority */}
                  {filterType === 'priority' && (
                    <div className="space-y-8">
                      {Object.entries(groupCardsByPriority()).map(([priority, cards]) => {
                        if (cards.length === 0 || !selectedPriorities.includes(priority)) return null;
                        return (
                          <div key={priority} className="break-inside-avoid">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200 capitalize">
                              {priority} Priority ({cards.length})
                            </h2>
                            <div className="space-y-3">
                              {cards.map(card => (
                                <div key={card.id} className="flex justify-between items-start py-2 border-b border-gray-100">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">{card.title}</div>
                                    <div className="text-sm text-gray-600">{card.board_name}</div>
                                  </div>
                                  <div className="text-right">
                                    {card.assignee && (
                                      <div className="text-sm text-gray-600">@{card.assignee}</div>
                                    )}
                                    <div className="text-xs text-gray-400">
                                      {card.status.replace('_', ' ')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* By User */}
                  {filterType === 'user' && (
                    <div className="space-y-8">
                      {Object.entries(groupCardsByBoard()).map(([boardName, cards]) => (
                        <div key={boardName} className="break-inside-avoid">
                          <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                            {boardName} ({cards.length})
                          </h2>
                          <div className="grid grid-cols-3 gap-6">
                            {(['high', 'medium', 'low'] as const).map(priority => {
                              const priorityCards = cards.filter(c => c.priority === priority);
                              if (priorityCards.length === 0) return null;
                              return (
                                <div key={priority}>
                                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                                    {priority} ({priorityCards.length})
                                  </h3>
                                  <ul className="space-y-2">
                                    {priorityCards.map(card => (
                                      <li key={card.id} className="text-sm">
                                        <div className="font-medium text-gray-800">{card.title}</div>
                                        <div className="text-xs text-gray-400">
                                          {card.status === 'done' && '✓ '}
                                          {card.status === 'in_progress' && '⟳ '}
                                          {card.status === 'not_started' && '○ '}
                                          {card.status.replace('_', ' ')}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary (Accomplishments) */}
                  {filterType === 'summary' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-lg font-semibold text-blue-800">
                          {filteredCards.length} task{filteredCards.length !== 1 ? 's' : ''} completed
                        </p>
                      </div>

                      {Object.entries(groupCardsByBoard()).map(([boardName, cards]) => (
                        <div key={boardName} className="break-inside-avoid">
                          <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            {boardName} ({cards.length} completed)
                          </h2>
                          <ul className="space-y-2 ml-4">
                            {cards.map(card => (
                              <li key={card.id} className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">{card.title}</div>
                                  {card.description && (
                                    <div className="text-sm text-gray-600 mt-1">{card.description}</div>
                                  )}
                                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                    {card.assignee && <span>@{card.assignee}</span>}
                                    {card.updated_at && (
                                      <span>
                                        Completed: {new Date(card.updated_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
