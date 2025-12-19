import { Dispatch, SetStateAction } from 'react'
import { SpeechState } from '../types'
import { useAudioRecorder } from '../utils/useAudioRecorder'
import { useKeyboardShortcuts } from '../utils/useKeyboardShortcuts'
import { initSpeechRecognition } from '../utils/speechToText'
import '../styles/listener.css'

initSpeechRecognition()

interface AudioListenerProps {
    setSpeech: Dispatch<SetStateAction<SpeechState | null>>
}

const AudioListener = ({ setSpeech }: AudioListenerProps) => {
    const { isRecording, transcript, status, toggleRecording } = useAudioRecorder(setSpeech)
    
    useKeyboardShortcuts(toggleRecording)

    const getStatusClass = () => {
        if (isRecording || status === 'Recording...') return 'status-recording'
        if (status === 'Transcribing...') return 'status-transcribing'
        return 'status-ready'
    }

    const getStatusText = () => {
        if (status === 'Recording...') return 'Recording...'
        return status
    }

    return (
        <div className="voice-assistant-container">
            <div className="voice-assistant-card">
                <h2>Voice Assistant</h2>
                <p>
                    Press <kbd className="kbd-key">Ctrl + Space</kbd> to record.
                </p>
                <div className={`status-badge ${getStatusClass()}`}>{getStatusText()}</div>
            </div>

            {transcript && (
                <div className="transcript-container">
                    <div className="transcript-label">Georgian</div>
                    <p className="transcript-text">{transcript.T1}</p>

                    <div className="transcript-label">English</div>
                    <p className="transcript-text">{transcript.T2}</p>
                </div>
            )}
        </div>
    )
}

export default AudioListener