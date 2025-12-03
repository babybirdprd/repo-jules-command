import React from 'react';
import { useJobs } from '../../context/JobContext';
import JobCard from './JobCard';
import { Plus, Command } from 'lucide-react';

interface DashboardProps {
  onNew: () => void;
  onUplink: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNew, onUplink }) => {
  const { jobs } = useJobs();

  // Sort: Active first, then by date
  const sortedJobs = [...jobs].sort((a, b) => {
    const aActive = a.status !== 'merged';
    const bActive = b.status !== 'merged';
    if (aActive === bActive) return b.createdAt - a.createdAt;
    return aActive ? -1 : 1;
  });

  return (
    <div className="p-4 pb-24 relative min-h-full">
      <header className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Command className="text-indigo-500" />
          Mission Control
        </h1>
        <div className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
          v4.0
        </div>
      </header>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
            <Command size={40} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">No Active Missions</h3>
          <p className="text-sm text-slate-500 max-w-xs mt-2">Start a new project or connect an existing repository to begin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-20 flex flex-col gap-3 items-end pointer-events-none">
        {/* We use pointer-events-auto on buttons to allow interaction */}
        <button 
          onClick={onUplink}
          className="pointer-events-auto shadow-xl bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transform hover:-translate-y-1 transition-transform"
        >
          <span className="bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">⌘</span>
          Link Existing
        </button>

        <button 
          onClick={onNew}
          className="pointer-events-auto shadow-xl shadow-indigo-900/20 bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;