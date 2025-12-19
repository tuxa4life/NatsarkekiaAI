use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct DeepLTranslation {
    detected_source_language: String,
    text: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DeepLResponse {
    translations: Vec<DeepLTranslation>,
}

#[tauri::command]
pub async fn translate_text(text: String) -> Result<String, String> {
    let api_key = std::env::var("DEEPL_API_KEY").expect("Error with API Key");
    
    let url = "https://api-free.deepl.com/v2/translate";

    let client = reqwest::Client::new();
    let params = [
        ("auth_key", api_key.as_str()),
        ("text", text.as_str()),
        ("source_lang", "KA"),
        ("target_lang", "EN-US"),
        ("enable_beta_languages", "1")
    ];

    let response = client.post(url)
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("API Request failed: {}", response.status()));
    }

    let deepl_data: DeepLResponse = response.json()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(translation) = deepl_data.translations.first() {
        Ok(translation.text.clone())
    } else {
        Err("No translation found".to_string())
    }
}