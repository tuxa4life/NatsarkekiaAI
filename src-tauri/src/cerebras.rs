use std::fs;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Debug)]
struct CerebrasResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize, Debug)]
struct Choice {
    message: Message,
}

#[derive(Deserialize, Serialize, Debug)]
struct Message {
    role: String,
    content: String,
}

#[tauri::command]
pub async fn ask_cerebras(user_message: String) -> Result<String, String> {
    let system_prompt = fs::read_to_string("system_prompt.txt")
        .map_err(|e| format!("Failed to read system prompt file: {}", e))?;

    let api_key = std::env::var("CEREBRAS_API_KEY").expect("Error with API Key");

    let client = reqwest::Client::new();

    let payload = json!({
        "model": "llama-3.3-70b", 
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_message }
        ],
        "temperature": 0.5
    });

    let response = client
        .post("https://api.cerebras.ai/v1/chat/completions")
        .header(AUTHORIZATION, format!("Bearer {}", api_key))
        .header(CONTENT_TYPE, "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API Error: {}", response.status()));
    }

    let response_data: CerebrasResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let result_text = response_data.choices
        .first()
        .map(|c| c.message.content.clone())
        .ok_or("No response content found")?;

    Ok(result_text)
}