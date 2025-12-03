import React, { useState } from 'react';
import { GeneratorRecipe, AgentMode } from '../../types';
import { useJobs } from '../../context/JobContext';
import ContextEditor from '../Shared/ContextEditor';
import { ArrowLeft, Rocket } from 'lucide-react';

interface Props {
  recipe: GeneratorRecipe;
  onBack: () => void;
  onComplete: () => void;
}

const ScaffoldWizard: React.FC<Props> = ({ recipe, onBack, onComplete }) => {
  const { addScaffoldJob } = useJobs();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AgentMode>('auto');
  const [context, setContext] = useState(recipe.defaultContext);
  const [isPrivate, setIsPrivate] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addScaffoldJob(name, recipe.id, context, mode, recipe.iconName);
    onComplete();
  };

  return (
    <div className="p-4 h-full flex flex-col pb-24 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">New {recipe.name}</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">

        {/* Repo Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Repository Name</label>
          <div className="flex items-center">
             <span className="bg-slate-800 text-slate-400 px-3 py-3 rounded-l-lg border-y border-l border-slate-700 text-sm">github.com/</span>
             <input
               type="text"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="my-cool-app"
               className="flex-1 bg-slate-900 border border-slate-700 rounded-r-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
               autoFocus
             />
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
          <span className="text-sm font-medium">Private Repository</span>
          <button
             type="button"
             onClick={() => setIsPrivate(!isPrivate)}
             className={`w-12 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
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
        <ContextEditor value={context} onChange={setContext} />

        {/* Submit */}
        <div className="mt-auto pt-4">
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Rocket size={20} />
            Launch Mission
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScaffoldWizard;