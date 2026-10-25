// Gnomes of Hollowmere desktop app: a native window that shows the game from www/ using the system web engine.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while starting Gnomes of Hollowmere");
}
