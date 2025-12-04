import React, { useState } from 'react';
import { AgentMode } from '../../types';
import { useJobs } from '../../context/JobContext';
import ContextEditor from '../Shared/ContextEditor';
import { ArrowLeft, Terminal, Key } from 'lucide-react';

interface Props {
  onBack: () => void;
  onComplete: () => void;
}

const RemoteWizard: React.FC<Props> = ({ onBack, onComplete }) => {
  const { addRemoteJob } = useJobs();
  const [repoName, setRepoName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('root');
  const [privateKey, setPrivateKey] = useState('');
  const [mode, setMode] = useState<AgentMode>('interactive');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !host.trim() || !username.trim() || !privateKey.trim()) return;

    addRemoteJob(
      repoName,
      host,
      parseInt(port, 10),
      username,
      privateKey,
      context,
      mode
    );
    onComplete();
  };

  return (
    <div className="p-4 h-full flex flex-col pb-24 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Connect Remote / Lightning AI</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">

        {/* Repo Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Target Repository (Context)</label>
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="owner/repo"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            autoFocus
          />
          <p className="text-[10px] text-slate-500">Jules needs to know which repo this environment corresponds to.</p>
        </div>

        {/* SSH Details */}
        <div className="grid grid-cols-6 gap-3">
             <div className="col-span-4 space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Host</label>
                <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="ssh.lightning.ai"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm"
                />
            </div>
            <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Port</label>
                <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="22"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm"
                />
            </div>
            <div className="col-span-6 space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="root"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm"
                />
            </div>
        </div>

        {/* Private Key */}
         <div className="space-y-1">
            <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                    <Key size={12} /> Private Key (PEM)
                </label>
            </div>
            <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
            />
            <p className="text-[10px] text-slate-500">Paste your local private key content here.</p>
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
            disabled={!repoName.trim() || !host.trim() || !privateKey.trim()}
            className="w-full bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Terminal size={20} />
            Connect & Start
          </button>
        </div>
      </form>
    </div>
  );
};

export default RemoteWizard;
