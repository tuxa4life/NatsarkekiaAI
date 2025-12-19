use reqwest;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Serialize, Deserialize)]
struct TranscriptionRequest {
    file: Vec<u8>,
    model: String,
    language: String,
}

#[derive(Serialize, Deserialize)]
struct TranscriptionResponse {
    text: String,
}

#[tauri::command]
pub async fn transcribe_audio(audio_data: Vec<u8>, lang: String) -> Result<String, String> {
    let api_key = env::var("GROQ_API_KEY")
        .map_err(|_| "GROQ_API_KEY not found in environment".to_string())?;

    let client = reqwest::Client::new();
    
    let form = reqwest::multipart::Form::new()
        .text("model", "whisper-large-v3")
        .text("language", lang)
        .part(
            "file",
            reqwest::multipart::Part::bytes(audio_data)
                .file_name("recording.webm")
                .mime_str("audio/webm")
                .map_err(|e| e.to_string())?,
        );

    let response = client
        .post("https://api.groq.com/openai/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error: {}", error_text));
    }

    let transcription: TranscriptionResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(transcription.text)
}