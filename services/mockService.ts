import { Job, JobStatus, JobType, AgentMode, PrDetails } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Log Messages based on status
const LOG_MESSAGES: Record<JobStatus, string[]> = {
  booting: ['Provisioning container...', 'Setting up environment...', 'Installing base dependencies...'],
  generating: ['Running scaffolding scripts...', 'Initializing git...', 'Installing npm packages...'],
  uploading_context: ['Reading AGENTS.md...', 'Committing context file...', 'Pushing to remote...'],
  planning: ['Jules: Reading repository...', 'Jules: Analyzing request...', 'Jules: Formulating execution plan...'],
  waiting_approval: ['Plan generated.', 'Waiting for user review...', 'Paused.'],
  working: ['Jules: Writing code...', 'Jules: Running tests...', 'Jules: Refactoring...'],
  pr_ready: ['Pull Request created.', 'CI Checks passed.', 'Ready to merge.'],
  merged: ['Merged successfully.', 'Closing branch.', 'Deployment triggered.'],
};

const getRandomLog = (status: JobStatus) => {
  const msgs = LOG_MESSAGES[status];
  return msgs[Math.floor(Math.random() * msgs.length)];
};

export const MockService = {
  createScaffoldJob: (name: string, recipeName: string, context: string, mode: AgentMode, icon?: string): Job => {
    return {
      id: generateId(),
      repoName: name,
      type: 'scaffold',
      mode,
      status: 'booting',
      createdAt: Date.now(),
      agentContext: context,
      logs: ['>> Initializing command center...'],
      generatorIcon: icon,
    };
  },

  createUplinkJob: (repoName: string, context: string, mode: AgentMode): Job => {
    return {
      id: generateId(),
      repoName: repoName,
      type: 'existing_uplink',
      mode,
      status: 'uploading_context', // Skips booting/generating
      createdAt: Date.now(),
      agentContext: context,
      logs: ['>> Connecting to existing uplink...'],
      generatorIcon: 'Github', // Special case
    };
  },

  // Simulates the backend state machine
  advanceJobState: (job: Job): Job => {
    const newJob = { ...job, logs: [...job.logs] };
    
    // Add a random log line for current status
    if (Math.random() > 0.3) {
      newJob.logs.push(`>> ${getRandomLog(job.status)}`);
      if (newJob.logs.length > 20) newJob.logs = newJob.logs.slice(-20);
    }

    // State Transition Logic
    switch (job.status) {
      case 'booting':
        if (Math.random() > 0.7) newJob.status = 'generating';
        break;
      case 'generating':
        if (Math.random() > 0.7) newJob.status = 'uploading_context';
        break;
      case 'uploading_context':
        if (Math.random() > 0.7) newJob.status = 'planning';
        break;
      case 'planning':
        if (Math.random() > 0.6) {
          if (job.mode === 'interactive') {
            newJob.status = 'waiting_approval';
            newJob.logs.push('>> Plan requires approval.');
          } else {
            newJob.status = 'working';
          }
        }
        break;
      case 'waiting_approval':
        // Stuck here until manual action
        break;
      case 'working':
        if (Math.random() > 0.6) {
          newJob.status = 'pr_ready';
          newJob.prDetails = {
            title: `Feat: ${job.type === 'scaffold' ? 'Initialize Project' : 'Agent Update'}`,
            number: Math.floor(Math.random() * 1000) + 1,
            url: `https://github.com/${job.repoName}/pull/123`,
            filesChanged: Math.floor(Math.random() * 15) + 3,
          };
          newJob.logs.push('>> PR Created successfully.');
        }
        break;
      case 'pr_ready':
      case 'merged':
        // Terminal states regarding auto-advancement
        break;
    }

    return newJob;
  },

  approvePlan: (job: Job): Job => {
    return {
      ...job,
      status: 'working',
      logs: [...job.logs, '>> Plan approved by user. Executing...']
    };
  },

  mergePR: (job: Job): Job => {
    return {
      ...job,
      status: 'merged',
      logs: [...job.logs, '>> PR Merged. Mission complete.']
    };
  }
};