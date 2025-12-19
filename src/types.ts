export interface SpeechState {
    T1: string  
    T2: string  
}

export interface AudioRecorderRefs {
    mediaRecorder: React.MutableRefObject<MediaRecorder | null>
    chunks: React.MutableRefObject<Blob[]>
    audioContext: React.MutableRefObject<AudioContext | null>
    analyser: React.MutableRefObject<AnalyserNode | null>
    silenceTimer: React.MutableRefObject<NodeJS.Timeout | null>
    animationFrame: React.MutableRefObject<number | null>
    recordingStartTime: React.MutableRefObject<number>
    isRecording: React.MutableRefObject<boolean>
}

export interface AudioConfig {
    SILENCE_THRESHOLD: number
    SILENCE_DURATION: number
    MIN_RECORDING_TIME: number
}