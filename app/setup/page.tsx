'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [currentMember, setCurrentMember] = useState('');
  const [boardName, setBoardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMember = () => {
    if (currentMember.trim() && !teamMembers.includes(currentMember.trim())) {
      setTeamMembers([...teamMembers, currentMember.trim()]);
      setCurrentMember('');
    }
  };

  const handleRemoveMember = (member: string) => {
    setTeamMembers(teamMembers.filter(m => m !== member));
  };

  const handleComplete = async () => {
    if (!boardName.trim() || teamMembers.length === 0) {
      alert('Please add at least one team member and create a board name');
      return;
    }

    setIsLoading(true);

    try {
      // Create team members
      for (const member of teamMembers) {
        await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: member }),
        });
      }

      // Create first board
      const boardRes = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: boardName }),
      });
      const board = await boardRes.json();

      // Mark setup as complete
      await fetch('/api/setup', {
        method: 'POST',
      });

      // Redirect to the new board
      router.push(`/board/${board.id}`);
    } catch (error) {
      console.error('Setup error:', error);
      alert('Failed to complete setup. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {step === 1 && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Project Tracker</h1>
              <p className="text-gray-600">
                A simple project management tool for Phase 3 teams
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-800 mb-3">What you'll do:</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  Add your team members
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  Create your first board
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  Start organizing your work
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Team Members</h2>
            <p className="text-gray-600 mb-6">Add the people who will be using this tracker (you need at least one)</p>

            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={currentMember}
                  onChange={(e) => setCurrentMember(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                  placeholder="Team member name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddMember}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-gray-700">{member}</span>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={teamMembers.length === 0}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your First Board</h2>
            <p className="text-gray-600 mb-6">Boards help you organize different projects or areas of work</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board Name
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g., Research Q1, Client Projects, Ideas..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 Don't worry, you can create more boards later! Each board will have High, Medium, and Low priority columns.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!boardName.trim() || isLoading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full ${
                s === step ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
