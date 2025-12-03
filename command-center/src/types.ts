export type JobType = 'scaffold' | 'existing_uplink';
export type JobStatus =
  | 'booting'           // [Scaffold only] Provisioning Codespace
  | 'generating'        // [Scaffold only] Running Bash Script
  | 'uploading_context' // [Universal] Committing AGENTS.md
  | 'planning'          // [Universal] Jules Thinking
  | 'waiting_approval'  // [Universal] Interactive Mode Pause
  | 'working'           // [Universal] Jules Coding
  | 'pr_ready'          // [Universal] Pull Request Created
  | 'merged';           // [Universal] Job Done

export type AgentMode = 'auto' | 'interactive';

export interface PrDetails {
  title: string;
  url: string;
  number: number;
  filesChanged: number;
}

export interface Job {
  id: string;
  repoName: string; // "owner/repo"
  type: JobType;
  mode: AgentMode;
  status: JobStatus;
  createdAt: number;
  generatorIcon?: string; // For UI display

  // The content of the AGENTS.md file
  agentContext: string;

  // Logs for the terminal view
  logs: string[];

  // Details for the PR Ready state
  prDetails?: PrDetails;
}

export interface GeneratorRecipe {
  id: string;
  name: string;
  iconName: string; // Mapping to Lucide icon name
  description: string;
  defaultContext: string; // Template for AGENTS.md
}

export interface ContextTemplate {
  label: string;
  content: string;
}