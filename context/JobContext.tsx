import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Job, AgentMode } from '../types';
import { MockService } from '../services/mockService';

interface JobContextType {
  jobs: Job[];
  addScaffoldJob: (name: string, recipeId: string, context: string, mode: AgentMode, icon?: string) => void;
  addUplinkJob: (repoName: string, context: string, mode: AgentMode) => void;
  approveJob: (jobId: string) => void;
  mergeJob: (jobId: string) => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider = ({ children }: { children?: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('mcc_jobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist jobs
  useEffect(() => {
    localStorage.setItem('mcc_jobs', JSON.stringify(jobs));
  }, [jobs]);

  // Simulation Loop (The "Server")
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(currentJobs => {
        let changed = false;
        const updatedJobs = currentJobs.map(job => {
          // Only advance jobs that aren't in terminal or waiting states
          if (['merged', 'waiting_approval', 'pr_ready'].includes(job.status)) {
            return job;
          }
          changed = true;
          return MockService.advanceJobState(job);
        });
        return changed ? updatedJobs : currentJobs;
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const addScaffoldJob = (name: string, recipeId: string, context: string, mode: AgentMode, icon?: string) => {
    const newJob = MockService.createScaffoldJob(name, recipeId, context, mode, icon);
    setJobs(prev => [newJob, ...prev]);
  };

  const addUplinkJob = (repoName: string, context: string, mode: AgentMode) => {
    const newJob = MockService.createUplinkJob(repoName, context, mode);
    setJobs(prev => [newJob, ...prev]);
  };

  const approveJob = (jobId: string) => {
    setJobs(prev => prev.map(job => job.id === jobId ? MockService.approvePlan(job) : job));
  };

  const mergeJob = (jobId: string) => {
    setJobs(prev => prev.map(job => job.id === jobId ? MockService.mergePR(job) : job));
  };

  return (
    <JobContext.Provider value={{ jobs, addScaffoldJob, addUplinkJob, approveJob, mergeJob }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) throw new Error('useJobs must be used within a JobProvider');
  return context;
};