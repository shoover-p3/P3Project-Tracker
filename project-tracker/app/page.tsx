import { redirect } from 'next/navigation';
import { isAppSetup, getAllBoards, initializeDatabase } from '@/lib/db';

export default async function Home() {
  // Initialize database tables
  await initializeDatabase();

  // Check if app is set up
  const setupComplete = await isAppSetup();

  if (!setupComplete) {
    redirect('/setup');
  }

  // Get first board and redirect to it
  const boards = await getAllBoards();
  if (boards.length > 0) {
    redirect(`/board/${boards[0].id}`);
  }

  // No boards yet, stay on home
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Project Tracker</h1>
        <p className="text-gray-600 mb-8">Phase 3 Project Management</p>
        <a
          href="/setup"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
