interface IWindow extends Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
}

const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow

let recognition: any | null = null
let finalTranscript: string = ''

export const initSpeechRecognition = (lang: string = 'ka-GE'): void => {
    const Recognition = SpeechRecognition || webkitSpeechRecognition

    if (!Recognition) {
        console.error('Speech Recognition is not supported in this browser.')
        return
    }

    recognition = new Recognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript
            if (event.results[i].isFinal) {
                finalTranscript += transcriptChunk + ' '
            } else {
                interimTranscript += transcriptChunk
            }
        }
    }

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
    }
}

export const startRecognition = (): void => {
    if (!recognition) {
        initSpeechRecognition()
    }
    finalTranscript = ''
    recognition?.start()
}

export const stopRecognition = (): void => {
    if (recognition) {
        recognition.stop()
    }
}

export const getTranscript = (): string => {
    return finalTranscript.trim()
}
