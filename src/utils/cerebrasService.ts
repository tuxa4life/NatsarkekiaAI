import { invoke } from '@tauri-apps/api/core'

export const mergeTranscripts = async (input: string) => {
    try {
        const result = await invoke<string>('ask_cerebras', { userMessage: input })
        console.log(result)
    } catch (error) {
        console.error('Error calling backend:', error)
    }
}
