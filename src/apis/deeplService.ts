import { invoke } from '@tauri-apps/api/core'

export const translateText = async (input: string) => {
    try {
        const result = await invoke<string>('translate_text', { text: input })
        return result
    } catch (error) {
        console.error('Translation failed:', error)
        return 'ERROR TRANSLATING'
    }
}