import { useState, useRef, useEffect } from 'react'
import { mergeTranscript } from '../utils/groqService'
import { initSpeechRecognition, startRecognition, stopRecognition } from '../utils/speechToText'

initSpeechRecognition()

const AudioListener = () => {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [status, setStatus] = useState('Ready')

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const recordingStartTimeRef = useRef<number>(0)

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
        if (isRecording) return
        setTranscript('')

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
                    setTranscript(transcription.T1)
                    console.log(transcription)
                    setStatus('Ready')
                }, 200)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setStatus('Recording...')
            recordingStartTimeRef.current = Date.now()
            detectSilence()
        } catch (err) {
            console.error('Mic Error:', err)
            setStatus('Mic Access Denied')
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault()
                if (isRecording) {
                    console.log('Stopping manually via shortcut...')
                    stopRecording()
                    stopRecognition()
                } else {
                    startRecording()
                    startRecognition()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isRecording])

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', fontFamily: 'sans-serif' }}>
            <div style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid #ddd', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', maxWidth: '400px', }} >
                <h2 style={{ marginTop: 0 }}>Voice Assistant</h2>
                <p>Press <kbd style={{ background: '#eee', padding: '2px 5px', borderRadius: '4px' }}>Ctrl + Space</kbd> to record.</p>
                <div
                    style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '2rem', color: '#fff', fontWeight: 'bold', textAlign: 'center', backgroundColor: isRecording ? '#ef4444' : status === 'Transcribing...' ? '#8b5cf6' : '#3b82f6', }} >
                    {status === 'Recording...' ? 'Listening (Speak Now)' : status}
                </div>
            </div>

            {transcript && (
                <div style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', }} >
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Result</div>
                    <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.5', color: '#374151' }}>{transcript}</p>
                </div>
            )}
        </div>
    )
}

export default AudioListener
