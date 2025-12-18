import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'
import { mergeTranscript } from '../utils/groqService'
import { initSpeechRecognition, startRecognition, stopRecognition } from '../utils/speechToText'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import '../styles/listener.css'
import { speechState } from '../App'

initSpeechRecognition()

const AudioListener = ({setSpeech}: {setSpeech: Dispatch<SetStateAction<speechState>>}) => {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState<speechState>(null)
    const [status, setStatus] = useState('Ready')

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const recordingStartTimeRef = useRef<number>(0)

    const isRecordingRef = useRef(isRecording)

    useEffect(() => {
        isRecordingRef.current = isRecording
    }, [isRecording])

    const SILENCE_THRESHOLD = -50
    const SILENCE_DURATION = 1500
    const MIN_RECORDING_TIME = 750

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
        }

        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

        setIsRecording(false)
        stopRecognition()
    }

    const detectSilence = () => {
        if (!analyserRef.current) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Float32Array(bufferLength)
        analyserRef.current.getFloatFrequencyData(dataArray)

        let maxVolume = -Infinity
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxVolume) maxVolume = dataArray[i]
        }

        const recordingTime = Date.now() - recordingStartTimeRef.current

        if (recordingTime < MIN_RECORDING_TIME) {
            animationFrameRef.current = requestAnimationFrame(detectSilence)
            return
        }

        if (maxVolume < SILENCE_THRESHOLD) {
            if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    console.log('Stopping due to silence...')
                    stopRecording()
                }, SILENCE_DURATION)
            }
        } else {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
            }
        }

        animationFrameRef.current = requestAnimationFrame(detectSilence)
    }

    const startRecording = async () => {
        if (isRecordingRef.current) return
        setTranscript(null)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            const context = new AudioContext()
            if (context.state === 'suspended') await context.resume()

            const source = context.createMediaStreamSource(stream)
            const analyser = context.createAnalyser()
            analyser.fftSize = 512
            analyser.smoothingTimeConstant = 0.4
            source.connect(analyser)

            audioContextRef.current = context
            analyserRef.current = analyser

            const options = { mimeType: 'audio/webm;codecs=opus' }
            const mediaRecorder = new MediaRecorder(stream, options)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                setStatus('Transcribing...')
                setTimeout(async () => {
                    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                    if (audioBlob.size < 500) {
                        setStatus('Ready')
                        return
                    }

                    const transcription = await mergeTranscript(audioBlob)
                    setTranscript(transcription)
                    setSpeech(transcription)
                    setStatus('Ready')
                }, 200)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setStatus('Recording...')
            startRecognition() 
            recordingStartTimeRef.current = Date.now()
            detectSilence()
        } catch (err) {
            console.error('Mic Error:', err)
            setStatus('Mic Access Denied')
        }
    }

    const toggleRecordingState = () => {
        if (isRecordingRef.current) {
            console.log('Stopping via toggle...')
            stopRecording()
        } else {
            console.log('Starting via toggle...')
            startRecording()
        }
    }


    useEffect(() => {
        const shortcut = 'CommandOrControl+Space'

        const setupGlobalShortcut = async () => {
            if (await isRegistered(shortcut)) {
                await unregister(shortcut)
            }

            await register(shortcut, (event) => {
                if (event.state === 'Pressed') {
                    toggleRecordingState()
                }
            })
        }

        setupGlobalShortcut()

        return () => {
            unregister(shortcut).catch(console.error)
        }
    }, []) 

    useEffect(() => {
        const handleLocalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault()
                toggleRecordingState()
            }
        }

        window.addEventListener('keydown', handleLocalKeyDown)
        return () => window.removeEventListener('keydown', handleLocalKeyDown)
    }, [])

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
