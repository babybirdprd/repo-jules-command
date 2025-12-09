import { createContext, useContext, useState } from 'react';
import { Job, AgentMode } from '../types';
import { TauriService } from '../services/tauriService';

interface JobContextType {
  jobs: Job[];
  addScaffoldJob: (name: string, recipeId: string, context: string, mode: AgentMode, icon: string) => Promise<void>;
  addUplinkJob: (repoName: string, context: string, mode: AgentMode) => Promise<void>;
  approvePlan: (jobId: string) => Promise<void>;
  refinePlan: (jobId: string, feedback: string) => Promise<void>;
  mergePR: (jobId: string) => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);

  // NOTE: In a real app with Tauri, we would listen for events from the Rust backend
  // to update the job status. For now, we rely on the initial add, but
  // we would need a `listen` call from `@tauri-apps/api/event`.

  // Implementation of event listening would go here.
  // useEffect(() => {
  //   const unlisten = listen('JOB_UPDATE', (event) => {
  //      updateJobState(event.payload);
  //   });
  //   return () => unlisten.then(f => f());
  // }, []);

  const addScaffoldJob = async (name: string, recipeId: string, context: string, mode: AgentMode, icon: string) => {
    try {
        const jobId = await TauriService.startScaffoldJob(name, recipeId, context, mode);
        // Create an initial local job state to show immediately
        const newJob: Job = {
            id: jobId,
            repoName: name,
            type: 'scaffold',
            mode,
            status: 'booting',
            createdAt: Date.now(),
            agentContext: context,
            logs: ['>> Job started...'],
            generatorIcon: icon
        };
        setJobs(prev => [newJob, ...prev]);
    } catch (e) {
        console.error("Failed to start scaffold job", e);
    }
  };

  const addUplinkJob = async (repoName: string, context: string, mode: AgentMode) => {
    try {
        const jobId = await TauriService.startUplinkJob(repoName, context, mode);
        const newJob: Job = {
            id: jobId,
            repoName,
            type: 'existing_uplink',
            mode,
            status: 'uploading_context',
            createdAt: Date.now(),
            agentContext: context,
            logs: ['>> Connecting to uplink...'],
            generatorIcon: 'Github'
        };
        setJobs(prev => [newJob, ...prev]);
    } catch (e) {
        console.error("Failed to start uplink job", e);
    }
  };

  const approvePlan = async (jobId: string) => {
    await TauriService.approvePlan(jobId);
    setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'working', logs: [...job.logs, '>> Plan approved.'] } : job));
  };

  const refinePlan = async (jobId: string, feedback: string) => {
      await TauriService.refinePlan(jobId, feedback);
      // Optimistic update?
  };

  const mergePR = async (jobId: string) => {
    await TauriService.mergePR(jobId);
    setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'merged', logs: [...job.logs, '>> Merged PR.'] } : job));
  };

  return (
    <JobContext.Provider value={{ jobs, addScaffoldJob, addUplinkJob, approvePlan, refinePlan, mergePR: mergePR }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) throw new Error('useJobs must be used within a JobProvider');
  return context;
};
