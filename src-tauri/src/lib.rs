mod cerebras;
mod groq;
use cerebras::ask_cerebras;
use groq::transcribe_audio;
use dotenvy::dotenv;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().expect(".env file not found");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![ask_cerebras, transcribe_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}