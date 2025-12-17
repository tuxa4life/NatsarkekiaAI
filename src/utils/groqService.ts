import Groq from 'groq-sdk'
import { getTranscript } from './speechToText'

const GROQ_MODEL = 'whisper-large-v3'
const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
})

const transcribeAudio = async (audioBlob: Blob, lang: string): Promise<string> => {
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })

    try {
        const response = await groq.audio.transcriptions.create({
            file: audioFile,
            model: GROQ_MODEL,
            language: lang,
        })
        return response.text
    } catch (err) {
        console.error('Groq transcription error:', err)
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
        return {T1: 'ERROR', T2: 'ERROR'}
    }

}