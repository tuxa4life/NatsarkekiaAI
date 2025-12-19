import { invoke } from '@tauri-apps/api/core'
import { openDockTemporarily } from '../components/Dock'

export const mergeTranscripts = async (input: string) => {
    try {
        const result = await invoke<string>('ask_cerebras', { userMessage: input })
        return result
    } catch (error) {
        console.error('Error calling backend:', error)
        openDockTemporarily('Problem executing.', false)
        return 'ERROR with Cerebras'
    }
}
