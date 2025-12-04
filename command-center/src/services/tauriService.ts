// services/tauriService.ts
import { invoke } from '@tauri-apps/api/core';
import { AgentMode } from '../types';

export const TauriService = {
  checkAuthStatus: async () => {
    return await invoke('check_auth_status');
  },

  initiateGoogleLogin: async () => {
    return await invoke('initiate_google_login');
  },

  startScaffoldJob: async (name: string, recipeId: string, context: string, mode: AgentMode): Promise<string> => {
    return await invoke('start_scaffold_job', { name, recipeId, context, mode });
  },

  startUplinkJob: async (repoUrl: string, context: string, mode: AgentMode): Promise<string> => {
    return await invoke('start_uplink_job', { repoUrl, context, mode });
  },

  startRemoteJob: async (repoUrl: string, host: string, port: number, username: string, privateKey: string, context: string, mode: AgentMode): Promise<string> => {
    return await invoke('start_remote_job', { repoUrl, host, port, username, privateKey, context, mode });
  },

  approvePlan: async (jobId: string) => {
    return await invoke('approve_agent_plan', { jobId });
  },

  refinePlan: async (jobId: string, feedback: string) => {
    return await invoke('refine_agent_plan', { jobId, feedback });
  },

  mergePR: async (jobId: string) => {
    return await invoke('merge_pull_request', { jobId });
  }
};
