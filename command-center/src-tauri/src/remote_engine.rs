use crate::types::{AgentMode, JobStatus, JobUpdateEvent};
use crate::ssh_utils::{execute_ssh_command};
use crate::jules::JulesClient;
use std::thread;
use std::time::Duration;
use tauri::Emitter;
use ssh_key::PrivateKey;

fn emit_update(app: &tauri::AppHandle, event: JobUpdateEvent) {
    if let Err(e) = app.emit("JOB_UPDATE", event) {
        println!("Failed to emit event: {}", e);
    }
}

pub fn run_remote_job(
    job_id: String,
    repo_url: String, // Github URL for Jules context
    host: String,
    port: u16,
    username: String,
    private_key: String, // PEM Content
    context: String,
    mode: AgentMode,
    google_token: String,
    app_handle: tauri::AppHandle
) -> Result<(), String> {

    // Emit Connecting
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Connecting,
        logs: vec![format!("Connecting to {}:{}...", host, port)],
        pr_details: None,
        plan: None,
    });

    // 1. Validate Connection & Install Agent

    // Derive Public Key from Private Key PEM
    let public_key_openssh = match PrivateKey::from_openssh(&private_key) {
        Ok(key) => match key.public_key().to_openssh() {
            Ok(pk) => pk,
            Err(e) => {
                 let msg = format!("Failed to derive public key: {}", e);
                 emit_update(&app_handle, JobUpdateEvent {
                    id: job_id.clone(),
                    status: JobStatus::Connecting, // Failed state isn't explicit in enum yet, stay in Connecting or move to a Failed state if we add one.
                    logs: vec![msg.clone()],
                    pr_details: None,
                    plan: None,
                });
                return Err(msg);
            }
        },
        Err(e) => {
             let msg = format!("Invalid private key format: {}", e);
             emit_update(&app_handle, JobUpdateEvent {
                id: job_id.clone(),
                status: JobStatus::Connecting,
                logs: vec![msg.clone()],
                pr_details: None,
                plan: None,
            });
            return Err(msg);
        }
    };

    let command_check = "echo 'Connection Established'";
    match execute_ssh_command(&host, port, &username, &private_key, &public_key_openssh, command_check) {
        Ok(_) => {
             emit_update(&app_handle, JobUpdateEvent {
                id: job_id.clone(),
                status: JobStatus::Connecting,
                logs: vec!["Connection successful.".to_string()],
                pr_details: None,
                plan: None,
            });
        },
        Err(e) => {
             let msg = format!("SSH Connection Failed: {}", e);
             emit_update(&app_handle, JobUpdateEvent {
                id: job_id.clone(),
                status: JobStatus::Connecting, // Or new Error status
                logs: vec![msg.clone(), "Job Failed.".to_string()],
                pr_details: None,
                plan: None,
            });
            return Err(msg);
        }
    }

    // 2. Upload Context (AGENTS.md)
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::UploadingContext,
        logs: vec!["Uploading AGENTS.md...".to_string()],
        pr_details: None,
        plan: None,
    });

    let setup_cmd = format!(
        "echo '{}' > AGENTS.md",
        context.replace("'", "'\\''") // Simple escaping
    );
    if let Err(e) = execute_ssh_command(&host, port, &username, &private_key, &public_key_openssh, &setup_cmd) {
         let msg = format!("Failed to upload context: {}", e);
         emit_update(&app_handle, JobUpdateEvent {
            id: job_id.clone(),
            status: JobStatus::UploadingContext,
            logs: vec![msg.clone(), "Job Failed.".to_string()],
            pr_details: None,
            plan: None,
        });
        return Err(msg);
    }

    // 3. Start Jules Session
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Planning,
        logs: vec!["Starting AI Session...".to_string()],
        pr_details: None,
        plan: None,
    });

    let jules = JulesClient::new(google_token);

    let session_id = match jules.start_session(
        &repo_url,
        "Connect to the provided environment and execute the plan based on AGENTS.md",
        matches!(mode, AgentMode::Interactive)
    ) {
        Ok(sid) => sid,
        Err(e) => {
             let msg = format!("Failed to start AI session: {}", e);
             emit_update(&app_handle, JobUpdateEvent {
                id: job_id.clone(),
                status: JobStatus::Planning,
                logs: vec![msg.clone(), "Job Failed.".to_string()],
                pr_details: None,
                plan: None,
            });
            return Err(msg);
        }
    };

    // 4. Polling Loop
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
                // We might want to count errors and eventually fail the job, but for now we log and retry polling
            }
        }
    }

    Ok(())
}
