use std::time::Duration;
use std::thread;
// use crate::auth::get_github_token;
use reqwest::blocking::Client;
use serde_json::json;
use base64::Engine;

pub struct GithubClient {
    token: String,
    client: Client,
}

impl GithubClient {
    pub fn new(token: String) -> Self {
        GithubClient {
            token,
            client: Client::builder()
                .user_agent("command-center-agent")
                .build()
                .unwrap_or_default(),
        }
    }

    pub fn create_private_repo(&self, name: &str) -> Result<String, String> {
        // Mock implementation
        if self.token.starts_with("mock") {
            println!("MOCK: Creating private repo {}", name);
            return Ok(format!("mock_user/{}", name));
        }

        let url = "https://api.github.com/user/repos";
        let res = self.client.post(url)
            .bearer_auth(&self.token)
            .json(&json!({
                "name": name,
                "private": true,
                "auto_init": true
            }))
            .send()
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
             return Err(format!("GitHub API Error: {}", res.status()));
        }

        let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
        Ok(body["full_name"].as_str().unwrap_or("unknown/repo").to_string())
    }

    pub fn create_codespace(&self, repo_owner: &str, repo_name: &str) -> Result<String, String> {
         if self.token.starts_with("mock") {
            println!("MOCK: Creating codespace for {}/{}", repo_owner, repo_name);
            return Ok("mock_codespace_id_123".to_string());
        }

        let url = format!("https://api.github.com/repos/{}/{}/codespaces", repo_owner, repo_name);
        let res = self.client.post(&url)
            .bearer_auth(&self.token)
            .json(&json!({
                "machine": "basicLinux"
            }))
            .send()
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
             return Err(format!("GitHub API Error (Create Codespace): {}", res.status()));
        }

        let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
        Ok(body["name"].as_str().unwrap_or("").to_string())
    }

    pub fn wait_for_codespace(&self, codespace_name: &str) -> Result<(), String> {
         if self.token.starts_with("mock") {
            println!("MOCK: Waiting for codespace {} to be available", codespace_name);
            thread::sleep(Duration::from_secs(2)); // Simulate wait
            return Ok(());
        }

        // Loop and check status
        let url = format!("https://api.github.com/user/codespaces/{}", codespace_name);
        for _ in 0..60 { // Try for 5 minutes
            let res = self.client.get(&url)
                .bearer_auth(&self.token)
                .send()
                .map_err(|e| e.to_string())?;

            if res.status().is_success() {
                let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
                let state = body["state"].as_str().unwrap_or("");
                if state == "Available" {
                    return Ok(());
                }
            }
            thread::sleep(Duration::from_secs(5));
        }
        Err("Codespace failed to become available".to_string())
    }

    pub fn delete_codespace(&self, codespace_name: &str) -> Result<(), String> {
         if self.token.starts_with("mock") {
            println!("MOCK: Deleting codespace {}", codespace_name);
            return Ok(());
        }

        let url = format!("https://api.github.com/user/codespaces/{}", codespace_name);
        let res = self.client.delete(&url)
            .bearer_auth(&self.token)
            .send()
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Failed to delete codespace: {}", res.status()));
        }
        Ok(())
    }

    pub fn add_deploy_key(&self, repo_owner: &str, repo_name: &str, key: &str, title: &str) -> Result<u64, String> {
         if self.token.starts_with("mock") {
            println!("MOCK: Adding deploy key to {}/{}", repo_owner, repo_name);
            return Ok(999);
        }

        let url = format!("https://api.github.com/repos/{}/{}/keys", repo_owner, repo_name);
        let res = self.client.post(&url)
            .bearer_auth(&self.token)
            .json(&json!({
                "title": title,
                "key": key,
                "read_only": false
            }))
            .send()
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
             return Err(format!("Failed to add deploy key: {}", res.status()));
        }

        let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
        Ok(body["id"].as_u64().unwrap_or(0))
    }

    pub fn remove_deploy_key(&self, repo_owner: &str, repo_name: &str, key_id: u64) -> Result<(), String> {
         if self.token.starts_with("mock") {
            println!("MOCK: Removing deploy key {} from {}/{}", key_id, repo_owner, repo_name);
            return Ok(());
        }

        let url = format!("https://api.github.com/repos/{}/{}/keys/{}", repo_owner, repo_name, key_id);
        let res = self.client.delete(&url)
            .bearer_auth(&self.token)
            .send()
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Failed to delete deploy key: {}", res.status()));
        }
        Ok(())
    }

    pub fn update_file(&self, repo_owner: &str, repo_name: &str, path: &str, content: &str, message: &str) -> Result<(), String> {
        if self.token.starts_with("mock") {
            println!("MOCK: Updating file {} in {}/{}", path, repo_owner, repo_name);
            return Ok(());
        }

        // 1. Get SHA of file (if it exists)
        let url_get = format!("https://api.github.com/repos/{}/{}/contents/{}", repo_owner, repo_name, path);
        let res_get = self.client.get(&url_get)
             .bearer_auth(&self.token)
             .send()
             .map_err(|e| e.to_string())?;

        let mut sha = None;
        if res_get.status().is_success() {
            let body: serde_json::Value = res_get.json().map_err(|e| e.to_string())?;
            sha = body["sha"].as_str().map(|s| s.to_string());
        }

        // 2. Put file
        let url_put = format!("https://api.github.com/repos/{}/{}/contents/{}", repo_owner, repo_name, path);
        let encoded_content = base64::engine::general_purpose::STANDARD.encode(content);

        let mut payload = json!({
            "message": message,
            "content": encoded_content
        });

        if let Some(s) = sha {
             payload["sha"] = json!(s);
        }

        let res_put = self.client.put(&url_put)
            .bearer_auth(&self.token)
            .json(&payload)
            .send()
             .map_err(|e| e.to_string())?;

        if !res_put.status().is_success() {
            return Err(format!("Failed to update file: {}", res_put.status()));
        }
        Ok(())
    }

    pub fn check_repo_access(&self, repo_owner: &str, repo_name: &str) -> Result<bool, String> {
        if self.token.starts_with("mock") {
             return Ok(true);
        }
        let url = format!("https://api.github.com/repos/{}/{}", repo_owner, repo_name);
        let res = self.client.get(&url)
            .bearer_auth(&self.token)
            .send()
            .map_err(|e| e.to_string())?;

        Ok(res.status().is_success())
    }

    pub fn merge_pull_request(&self, repo_owner: &str, repo_name: &str, pull_number: u64) -> Result<String, String> {
        if self.token.starts_with("mock") {
             return Ok("mock_sha_merged".to_string());
        }
        let url = format!("https://api.github.com/repos/{}/{}/pulls/{}/merge", repo_owner, repo_name, pull_number);
        let res = self.client.put(&url)
            .bearer_auth(&self.token)
            .json(&json!({
                "merge_method": "squash"
            }))
            .send()
            .map_err(|e| e.to_string())?;

         if !res.status().is_success() {
            return Err(format!("Failed to merge PR: {}", res.status()));
        }
        Ok("merged".to_string())
    }
}
