use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum JobStatus {
    Booting,           // [Scaffold only] Provisioning Codespace
    Generating,        // [Scaffold only] Running Bash Script
    UploadingContext, // [Universal] Committing AGENTS.md
    Planning,          // [Universal] Jules Thinking
    WaitingApproval,  // [Universal] Interactive Mode Pause
    Working,           // [Universal] Jules Coding
    PrReady,          // [Universal] Pull Request Created
    Merged,           // [Universal] Job Done
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum AgentMode {
    Auto,
    Interactive,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrDetails {
    pub number: u64,
    pub url: String,
    pub title: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JobState {
    pub id: String,
    pub github_repo: String, // owner/repo
    pub jules_session_id: Option<String>,
    pub status: JobStatus,
    pub last_poll: Option<u64>, // Timestamp
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JobUpdateEvent {
    pub id: String,
    pub status: JobStatus,
    pub logs: Vec<String>,
    pub pr_details: Option<PrDetails>,
    pub plan: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub github_authenticated: bool,
    pub google_authenticated: bool,
}
