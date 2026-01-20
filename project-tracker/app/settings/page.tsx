'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

interface Board {
  id: number;
  name: string;
}

interface TeamMember {
  id: number;
  name: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadBoards();
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

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    try {
      setIsAdding(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });

      if (res.ok) {
        const newMember = await res.json();
        setTeamMembers([...teamMembers, newMember]);
        setNewMemberName('');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Failed to add team member:', error);
      alert('Failed to add team member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMember = async (id: number, name: string) => {
    if (!confirm(`Delete team member "${name}"? This will not remove them from existing cards.`)) {
      return;
    }

    try {
      await fetch(`/api/members?id=${id}`, {
        method: 'DELETE',
      });
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete team member:', error);
      alert('Failed to delete team member');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        boards={boards}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          boardName="Settings"
          onSearch={() => {}}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

            {/* Team Members Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>
              <p className="text-gray-600 mb-6">
                Manage the people who can be assigned to cards.
              </p>

              {/* Add Member Form */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMember();
                  }}
                  placeholder="New member name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAdding}
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim() || isAdding}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isAdding ? 'Adding...' : 'Add Member'}
                </button>
              </div>

              {/* Team Members List */}
              {teamMembers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No team members yet. Add your first member above.
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-800 font-medium">{member.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About</h2>
              <p className="text-gray-600 mb-2">
                <strong>Project Tracker</strong> - Phase 3 Project Management
              </p>
              <p className="text-sm text-gray-500">
                A simple, trust-based project management tool for small teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
