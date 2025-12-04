// use tauri::Wry;
use tauri_plugin_store::StoreExt;
// use serde_json::json;

// Placeholders for secrets
const GITHUB_CLIENT_ID: &str = "YOUR_GITHUB_CLIENT_ID";
const GOOGLE_CLIENT_ID: &str = "YOUR_GOOGLE_CLIENT_ID";

pub fn get_github_token<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Option<String> {
    // In a real app, use the store or keyring.
    // For this prototype, we'll try to read from the store, or return a mock if not found.
    let store = app.store("auth_store.json").ok()?;

    if let Some(token) = store.get("github_access_token") {
        return token.as_str().map(|s| s.to_string());
    }

    // Return mock for development if not set
    Some("mock_github_pat".to_string())
}

pub fn get_google_token<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Option<String> {
    let store = app.store("auth_store.json").ok()?;

    if let Some(token) = store.get("google_refresh_token") {
        return token.as_str().map(|s| s.to_string());
    }

    // Return mock for development
    Some("mock_google_token".to_string())
}

pub fn check_auth_status<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> crate::types::AuthState {
    let github = get_github_token(app).is_some();
    let google = get_google_token(app).is_some();

    crate::types::AuthState {
        github_authenticated: github,
        google_authenticated: google,
    }
}

pub fn initiate_google_login() -> Result<(), String> {
    // In a real app, this would open a browser with the OAuth URL.
    // For the prototype, we assume the user "logs in" by some other means or we just mock it.
    println!("Initiating Google Login flow...");
    Ok(())
}
