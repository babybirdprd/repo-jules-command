use crate::types::{AgentMode, JobStatus, JobUpdateEvent};
use crate::github::GithubClient;
use crate::jules::JulesClient;
use tauri::Emitter;
use std::thread;
use std::time::Duration;

fn emit_update(app: &tauri::AppHandle, event: JobUpdateEvent) {
    if let Err(e) = app.emit("JOB_UPDATE", event) {
        println!("Failed to emit event: {}", e);
    }
}

pub fn run_uplink_job(
    job_id: String,
    repo_url: String,
    context: String,
    mode: AgentMode,
    gh_token: String,
    google_token: String,
    app_handle: tauri::AppHandle
) -> Result<(), String> {
    // 1. Parse Repo
    let parts: Vec<&str> = repo_url.trim_end_matches('/').split('/').collect();
    if parts.len() < 2 {
        return Err("Invalid Repo URL".to_string());
    }
    let repo_name = parts.last().unwrap();
    let owner = parts[parts.len() - 2];

    // Emit Booting/Connect
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Booting,
        logs: vec!["Verifying repository access...".to_string()],
        pr_details: None,
        plan: None,
    });

    // 2. Github Client
    let gh = GithubClient::new(gh_token.clone());

    // 3. Verify Access
    if !gh.check_repo_access(owner, repo_name)? {
        return Err("No write access to repo".to_string());
    }

    // 4. Update Context
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::UploadingContext,
        logs: vec!["Syncing AGENTS.md...".to_string()],
        pr_details: None,
        plan: None,
    });

    gh.update_file(owner, repo_name, "AGENTS.md", &context, "Update AGENTS.md via Command Center")?;

    // 5. Start Jules
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Planning,
        logs: vec!["Starting AI Session...".to_string()],
        pr_details: None,
        plan: None,
    });

    let jules = JulesClient::new(google_token);
    let session_id = jules.start_session(
        &format!("github.com/{}/{}", owner, repo_name),
        "Read AGENTS.md and execute instructions.",
         matches!(mode, AgentMode::Interactive)
    )?;

     // 6. Polling Loop
    loop {
        thread::sleep(Duration::from_secs(5));

        match jules.poll_session(&session_id) {
             Ok((status, pr, plan)) => {
                let mut logs = vec![];
                match status {
                    JobStatus::Planning => logs.push("Jules is thinking...".to_string()),
                    JobStatus::Working => logs.push("Jules is working on code...".to_string()),
                    JobStatus::WaitingApproval => logs.push("Plan ready for review.".to_string()),
                    JobStatus::PrReady => logs.push("Pull Request created.".to_string()),
                    _ => {}
                }

                emit_update(&app_handle, JobUpdateEvent {
                    id: job_id.clone(),
                    status: status.clone(),
                    logs,
                    pr_details: pr,
                    plan,
                });

                if matches!(status, JobStatus::PrReady | JobStatus::Merged) {
                    break;
                }
            }
            Err(e) => {
                println!("Polling error: {}", e);
            }
        }
    }

    Ok(())
}
