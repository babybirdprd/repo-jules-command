use reqwest::blocking::Client;
use serde_json::json;
use crate::types::{JobStatus, PrDetails};

pub struct JulesClient {
    token: String,
    client: Client,
}

impl JulesClient {
    pub fn new(token: String) -> Self {
        JulesClient {
            token,
            client: Client::builder().build().unwrap_or_default(),
        }
    }

    pub fn start_session(&self, source: &str, prompt: &str, require_approval: bool) -> Result<String, String> {
        if self.token.starts_with("mock") {
            // Use system time for unique ID instead of function pointer
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            return Ok(format!("mock_session_{}", timestamp));
        }

        let url = "https://jules.googleapis.com/v1/sessions"; // Hypothetical URL
        let res = self.client.post(url)
            .bearer_auth(&self.token)
            .json(&json!({
                "source": source,
                "prompt": prompt,
                "requirePlanApproval": require_approval
            }))
            .send()
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
             return Err(format!("Jules API Error: {}", res.status()));
        }

        let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
        Ok(body["name"].as_str().unwrap_or("").to_string())
    }

    pub fn poll_session(&self, session_id: &str) -> Result<(JobStatus, Option<PrDetails>, Option<String>), String> {
         if self.token.starts_with("mock") {
            // Randomly advance state for simulation
             use rand::Rng;
             let mut rng = rand::thread_rng();
             let roll: f64 = rng.gen();

             if roll < 0.3 {
                 return Ok((JobStatus::Planning, None, None));
             } else if roll < 0.6 {
                 return Ok((JobStatus::Working, None, None));
             } else if roll < 0.8 {
                 return Ok((JobStatus::WaitingApproval, None, Some("Mock Plan: Create main.rs".to_string())));
             } else {
                 return Ok((JobStatus::PrReady, Some(PrDetails {
                     number: 123,
                     url: "https://github.com/mock/repo/pull/123".to_string(),
                     title: "Mock PR".to_string()
                 }), None));
             }
        }

        let url = format!("https://jules.googleapis.com/v1/{}", session_id);
        let res = self.client.get(&url)
            .bearer_auth(&self.token)
            .send()
            .map_err(|e| e.to_string())?;

        let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
        let state = body["state"].as_str().unwrap_or("");

        // Map Jules State to App JobStatus
        if state == "WAITING_FOR_USER" {
            let plan = body["inputs"]["plan_summary"].as_str().map(|s| s.to_string());
            return Ok((JobStatus::WaitingApproval, None, plan));
        } else if state == "SUCCEEDED" {
            if let Some(outputs) = body["outputs"].as_array() {
                for output in outputs {
                    if let Some(pr) = output.get("pullRequest") {
                        return Ok((JobStatus::PrReady, Some(PrDetails {
                            number: 0, // Extract from URL or add to mock
                            url: pr["url"].as_str().unwrap_or("").to_string(),
                            title: pr["title"].as_str().unwrap_or("").to_string()
                        }), None));
                    }
                }
            }
             return Ok((JobStatus::Merged, None, None)); // Or just done
        } else if state == "RUNNING" {
             return Ok((JobStatus::Working, None, None));
        }

        Ok((JobStatus::Planning, None, None))
    }

    pub fn resume_session(&self, _session_id: &str) -> Result<(), String> {
        // Call resume endpoint
         if self.token.starts_with("mock") {
             return Ok(());
         }
         // Implementation
         Ok(())
    }

     pub fn send_activity(&self, _session_id: &str, _feedback: &str) -> Result<(), String> {
        // Call resume endpoint
         if self.token.starts_with("mock") {
             return Ok(());
         }
         // Implementation
         Ok(())
    }
}
