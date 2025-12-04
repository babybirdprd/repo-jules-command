import React, { useRef, useEffect } from 'react';
import { Job, JobStatus } from '../../types';
import {
  GitPullRequest,
  Terminal,
  CheckCircle2,
  Loader2,
  Github,
  AppWindow,
  Globe,
  Server,
  Coffee,
  Box
} from 'lucide-react';
import { useJobs } from '../../context/JobContext';

// Icon Map
const IconMap: Record<string, React.ElementType> = {
  Github, AppWindow, Globe, Server, Coffee, Box
};

interface JobCardProps {
  job: Job;
}

const StatusColors: Record<JobStatus, string> = {
  booting: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  generating: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  connecting: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  uploading_context: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  planning: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  waiting_approval: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
  working: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  pr_ready: 'text-green-500 border-green-500/30 bg-green-500/10',
  merged: 'text-slate-500 border-slate-600 bg-slate-800/50',
};

const StatusLabels: Record<JobStatus, string> = {
  booting: 'Booting Infra',
  generating: 'Scaffolding',
  connecting: 'Connecting SSH',
  uploading_context: 'Syncing Context',
  planning: 'Jules Planning',
  waiting_approval: 'Needs Approval',
  working: 'Agent Coding',
  pr_ready: 'PR Ready',
  merged: 'Merged',
};

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { approvePlan, mergePR } = useJobs();
  const logRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [job.logs]);

  const IconComponent = job.generatorIcon && IconMap[job.generatorIcon]
    ? IconMap[job.generatorIcon]
    : Box;

  const isTerminal = job.status === 'merged';
  const colorClass = StatusColors[job.status] || StatusColors['planning'];

  // Progress Logic (Visual only)
  const getProgress = () => {
    const stages: JobStatus[] = ['booting', 'generating', 'connecting', 'uploading_context', 'planning', 'waiting_approval', 'working', 'pr_ready', 'merged'];
    const index = stages.indexOf(job.status);
    return Math.max(5, ((index + 1) / stages.length) * 100);
  };

  return (
    <div className={`relative flex flex-col w-full bg-slate-900 border ${isTerminal ? 'border-slate-800 opacity-60' : 'border-slate-700'} rounded-xl overflow-hidden transition-all duration-300 shadow-lg`}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-800 text-slate-300`}>
            <IconComponent size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">{job.repoName}</h3>
            <div className={`text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${job.status === 'merged' ? 'text-slate-500' : colorClass.split(' ')[0]}`}>
              {job.status === 'booting' || job.status === 'working' || job.status === 'planning' || job.status === 'connecting' ? (
                 <Loader2 size={10} className="animate-spin" />
              ) : (
                 <div className="w-2 h-2 rounded-full bg-current" />
              )}
              {StatusLabels[job.status] || job.status}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono">
           {job.type === 'scaffold' ? 'NEW' : job.type === 'remote_manual' ? 'SSH' : 'LINK'}
        </div>
      </div>

      {/* Progress Bar */}
      {!isTerminal && (
        <div className="h-1 w-full bg-slate-800 mt-2">
          <div
            className={`h-full transition-all duration-500 ease-out ${job.status === 'pr_ready' ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      )}

      {/* Main Content Body */}
      <div className="p-4 pt-3 space-y-3">

        {/* Terminal View */}
        {!isTerminal && (
           <div className="bg-black/50 rounded-md p-3 font-mono text-xs text-slate-400 border border-slate-800/50">
             <div className="flex items-center gap-2 mb-1 text-slate-600 border-b border-slate-800 pb-1">
               <Terminal size={10} />
               <span>Console</span>
             </div>
             <div ref={logRef} className="h-16 overflow-y-auto scrollbar-hide flex flex-col justify-end">
                {job.logs.slice(-5).map((log, i) => (
                  <div key={i} className="truncate">{log}</div>
                ))}
             </div>
           </div>
        )}

        {/* Action: Approval Needed */}
        {job.status === 'waiting_approval' && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 animate-pulse">
            <h4 className="text-orange-400 font-bold text-sm mb-1">Plan Ready</h4>
            <p className="text-xs text-orange-300/80 mb-3">Jules requires your confirmation to execute changes.</p>
            <div className="flex gap-2">
              <button
                onClick={() => approvePlan(job.id)}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Approve Plan
              </button>
            </div>
          </div>
        )}

        {/* Action: PR Ready */}
        {job.status === 'pr_ready' && job.prDetails && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <h4 className="text-green-400 font-bold text-sm mb-1">Pull Request #{job.prDetails.number}</h4>
            <p className="text-xs text-green-300/80 mb-3">{job.prDetails.title} • {job.prDetails.filesChanged} files changed</p>
            <button
                onClick={() => mergePR(job.id)}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-md text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <GitPullRequest size={16} /> MERGE
              </button>
          </div>
        )}

        {/* State: Merged */}
        {job.status === 'merged' && (
           <div className="text-center py-2">
             <div className="inline-flex items-center justify-center p-2 bg-slate-800 rounded-full text-green-500 mb-2">
               <CheckCircle2 size={24} />
             </div>
             <p className="text-sm text-slate-400">Deployed to Production</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default JobCard;
