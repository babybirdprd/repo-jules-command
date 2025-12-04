// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod types;
mod auth;
mod github;
mod jules;
mod ssh_utils;
mod scaffold_engine;
mod uplink_engine;

use types::{JobState, JobStatus, AgentMode, AuthState}; // PrDetails removed
use std::sync::{Arc, Mutex};
use tauri::State; // Manager removed
use std::collections::HashMap;

struct AppState {
    jobs: Arc<Mutex<HashMap<String, JobState>>>,
}

#[tauri::command]
fn check_auth_status(app: tauri::AppHandle) -> AuthState {
    auth::check_auth_status(&app)
}

#[tauri::command]
fn initiate_google_login() -> Result<(), String> {
    auth::initiate_google_login()
}

#[tauri::command]
async fn start_scaffold_job(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    name: String,
    recipe_id: String,
    context: String,
    mode: AgentMode
) -> Result<String, String> {
    let job_id = uuid::Uuid::new_v4().to_string();

    // Retrieve tokens
    let gh_token = auth::get_github_token(&app).ok_or("GitHub not authenticated")?;
    let google_token = auth::get_google_token(&app).ok_or("Google not authenticated")?;

    // Store Job Initial State
    {
        let mut jobs = state.jobs.lock().unwrap();
        jobs.insert(job_id.clone(), JobState {
            id: job_id.clone(),
            github_repo: format!("user/{}", name), // approximation
            jules_session_id: None,
            status: JobStatus::Booting,
            last_poll: None,
        });
    }

    // Spawn Background Task via spawn_blocking since engines are synchronous/heavy
    let job_id_clone = job_id.clone();
    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let res = scaffold_engine::run_scaffold_job(
            job_id_clone.clone(), name, recipe_id, context, mode, gh_token, google_token, app_handle.clone()
        );

        if let Err(e) = res {
             println!("Job {} failed: {}", job_id_clone, e);
             // In a real app, emit a failure event here
        }
    });

    Ok(job_id)
}

#[tauri::command]
async fn start_uplink_job(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    repo_url: String,
    context: String,
    mode: AgentMode
) -> Result<String, String> {
    let job_id = uuid::Uuid::new_v4().to_string();
    let gh_token = auth::get_github_token(&app).ok_or("GitHub not authenticated")?;
    let google_token = auth::get_google_token(&app).ok_or("Google not authenticated")?;

    {
        let mut jobs = state.jobs.lock().unwrap();
        jobs.insert(job_id.clone(), JobState {
            id: job_id.clone(),
            github_repo: repo_url.clone(),
            jules_session_id: None,
            status: JobStatus::UploadingContext,
            last_poll: None,
        });
    }

    let job_id_clone = job_id.clone();
    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || {
         let res = uplink_engine::run_uplink_job(
            job_id_clone.clone(), repo_url, context, mode, gh_token, google_token, app_handle
        );
         if let Err(e) = res {
             println!("Job {} failed: {}", job_id_clone, e);
        }
    });

    Ok(job_id)
}

#[tauri::command]
async fn approve_agent_plan(_job_id: String) -> Result<(), String> {
    // Logic to resume session
    // In a real implementation, this would look up the session ID from the job store and call Jules API
    Ok(())
}

#[tauri::command]
async fn refine_agent_plan(_job_id: String, _feedback: String) -> Result<(), String> {
    // Logic to send feedback
    Ok(())
}

#[tauri::command]
async fn merge_pull_request(app: tauri::AppHandle, _job_id: String) -> Result<String, String> {
    let gh_token = auth::get_github_token(&app).ok_or("GitHub not authenticated")?;
    // Mock logic: get repo info from job state
    let gh = github::GithubClient::new(gh_token);
    // Hardcoded for prototype
    gh.merge_pull_request("owner", "repo", 123)?;
    Ok("Merged".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            jobs: Arc::new(Mutex::new(HashMap::new())),
        })
        .invoke_handler(tauri::generate_handler![
            check_auth_status,
            initiate_google_login,
            start_scaffold_job,
            start_uplink_job,
            approve_agent_plan,
            refine_agent_plan,
            merge_pull_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
