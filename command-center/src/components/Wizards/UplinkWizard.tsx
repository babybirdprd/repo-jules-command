import React, { useState } from 'react';
import { AgentMode } from '../../types';
import { useJobs } from '../../context/JobContext';
import ContextEditor from '../Shared/ContextEditor';
import { ArrowLeft, Plug } from 'lucide-react';

interface Props {
  onBack: () => void;
  onComplete: () => void;
}

const UplinkWizard: React.FC<Props> = ({ onBack, onComplete }) => {
  const { addUplinkJob } = useJobs();
  const [repoName, setRepoName] = useState('');
  const [mode, setMode] = useState<AgentMode>('interactive');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    addUplinkJob(repoName, context, mode);
    onComplete();
  };

  return (
    <div className="p-4 h-full flex flex-col pb-24 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Uplink Existing</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">

        {/* Repo Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Repository</label>
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="owner/repository"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Agent Mode */}
        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
           <button
             type="button"
             onClick={() => setMode('auto')}
             className={`py-2 text-xs font-bold rounded-md transition-colors ${mode === 'auto' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
           >
             Auto-Pilot
           </button>
           <button
             type="button"
             onClick={() => setMode('interactive')}
             className={`py-2 text-xs font-bold rounded-md transition-colors ${mode === 'interactive' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
           >
             Interactive
           </button>
        </div>

        {/* Context Editor */}
        <ContextEditor
          value={context}
          onChange={setContext}
          label="Task / Context Update"
        />

        <div className="mt-auto pt-4">
          <button
            type="submit"
            disabled={!repoName.trim()}
            className="w-full bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plug size={20} />
            Establish Link
          </button>
        </div>
      </form>
    </div>
  );
};

export default UplinkWizard;