use crate::types::{AgentMode, JobStatus, JobUpdateEvent};
use crate::github::GithubClient;
use crate::ssh_utils::{generate_ephemeral_keypair, execute_ssh_command};
use crate::jules::JulesClient;
use std::thread;
use std::time::Duration;
use tauri::Emitter;

pub fn resolve_recipe(recipe_id: &str) -> Result<String, String> {
    match recipe_id {
        "tauri-rust-v2" => Ok("https://raw.githubusercontent.com/mock-org/recipes/main/tauri-v2.sh".to_string()),
        "nextjs-app" => Ok("https://raw.githubusercontent.com/mock-org/recipes/main/nextjs.sh".to_string()),
        _ => Err("Invalid Recipe ID".to_string()),
    }
}

fn emit_update(app: &tauri::AppHandle, event: JobUpdateEvent) {
    if let Err(e) = app.emit("JOB_UPDATE", event) {
        println!("Failed to emit event: {}", e);
    }
}

pub fn run_scaffold_job(
    job_id: String,
    name: String,
    recipe_id: String,
    context: String,
    mode: AgentMode,
    gh_token: String,
    google_token: String,
    app_handle: tauri::AppHandle
) -> Result<(), String> {
    // 1. Resolve Recipe
    let recipe_url = resolve_recipe(&recipe_id)?;

    // 2. Github Client
    let gh = GithubClient::new(gh_token.clone());

    // Emit Booting
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Booting,
        logs: vec!["Provisioning GitHub resources...".to_string()],
        pr_details: None,
        plan: None,
    });

    // 3. Create Repo
    let repo_full_name = gh.create_private_repo(&name)?;
    let parts: Vec<&str> = repo_full_name.split('/').collect();
    let owner = parts[0];
    let repo = parts[1];

    // 4. Create Codespace
    let codespace_name = gh.create_codespace(owner, repo)?;
    gh.wait_for_codespace(&codespace_name)?;

    // 5. SSH Setup
    let keys = generate_ephemeral_keypair()?;
    let key_id = gh.add_deploy_key(owner, repo, &keys.public_key, "Command Center Ephemeral")?;

    // Emit Generating
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Generating,
        logs: vec!["Connecting via SSH and running generator...".to_string()],
        pr_details: None,
        plan: None,
    });

    // 6. Execute Script
    let command = format!(
        "echo '{}' > AGENTS.md && curl -o run.sh {} && bash run.sh '{}'",
        context, recipe_url, name
    );
    execute_ssh_command("mock_host", 22, "codespace", &keys.private_key, &keys.public_key, &command)?;

    // 7. Cleanup
    gh.remove_deploy_key(owner, repo, key_id)?;
    gh.delete_codespace(&codespace_name)?;

    // 8. Start Jules
    // Emit Planning
    emit_update(&app_handle, JobUpdateEvent {
        id: job_id.clone(),
        status: JobStatus::Planning,
        logs: vec!["Starting AI Session...".to_string()],
        pr_details: None,
        plan: None,
    });

    let jules = JulesClient::new(google_token);
    let session_id = jules.start_session(
        &format!("github.com/{}", repo_full_name),
        "Review the generated code and make improvements.",
        matches!(mode, AgentMode::Interactive)
    )?;

    // 9. Polling Loop
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

                // Exit conditions
                if matches!(status, JobStatus::PrReady | JobStatus::Merged) {
                    break;
                }

                // If waiting for approval, we might want to break or continue polling depending on implementation.
                // PRD says "poll every 5s", so we continue even if waiting, though practically we pause until action.
                // We'll continue polling to see if state changes (e.g. from resume action).
            }
            Err(e) => {
                println!("Polling error: {}", e);
                // retry
            }
        }
    }

    Ok(())
}
