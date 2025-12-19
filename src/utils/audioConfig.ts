import { AudioConfig } from '../types'

export const AUDIO_CONFIG: AudioConfig = {
    SILENCE_THRESHOLD: -50,
    SILENCE_DURATION: 1500,
    MIN_RECORDING_TIME: 750,
}

export const MEDIA_RECORDER_OPTIONS = {
    mimeType: 'audio/webm;codecs=opus',
}

export const ANALYSER_CONFIG = {
    fftSize: 512,
    smoothingTimeConstant: 0.4,
}

export const GLOBAL_SHORTCUT = 'Alt+Space'
