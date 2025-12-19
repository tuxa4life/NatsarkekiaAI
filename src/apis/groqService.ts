import { invoke } from '@tauri-apps/api/core'
import { getTranscript } from '../utils/speechToText'

const transcribeAudio = async (audioBlob: Blob, lang: string): Promise<string> => {
    try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const audioData = Array.from(uint8Array)
        const transcription = await invoke<string>('transcribe_audio', { audioData, lang })
        
        return transcription
    } catch (err) {
        console.error('Transcription error:', err)
        throw err
    }
}

export const mergeTranscript = async (audioBlob: Blob) => {
    try {
        const georgian = getTranscript()
        if (!georgian) throw new Error('Cannot transcribe georgian')

        const english = await transcribeAudio(audioBlob, 'en')
        return {T1: georgian, T2: english}
    } catch (e) {
        console.log(e)
        return {T1: 'Error: Transcript is empty.', T2: 'Solution: Let STT finish hearing you.'}
    }

}