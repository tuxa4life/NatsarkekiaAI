// useAudioRecorder.ts
import { useState, useRef, useCallback } from 'react'
import { SpeechState, AudioRecorderRefs } from '../types'
import { AUDIO_CONFIG, MEDIA_RECORDER_OPTIONS, ANALYSER_CONFIG } from './audioConfig'
import { mergeTranscript } from '../utils/groqService'
import { startRecognition, stopRecognition } from '../utils/speechToText'
import { closeDock, openDock } from '../components/Dock'

export const useAudioRecorder = (setSpeech: (state: SpeechState | null) => void) => {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState<SpeechState | null>(null)
    const [status, setStatus] = useState('Ready')

    const refs: AudioRecorderRefs = {
        mediaRecorder: useRef<MediaRecorder | null>(null),
        chunks: useRef<Blob[]>([]),
        audioContext: useRef<AudioContext | null>(null),
        analyser: useRef<AnalyserNode | null>(null),
        silenceTimer: useRef<NodeJS.Timeout | null>(null),
        animationFrame: useRef<number | null>(null),
        recordingStartTime: useRef<number>(0),
        isRecording: useRef(isRecording)
    }

    refs.isRecording.current = isRecording

    const stopRecording = useCallback(() => {
        if (refs.mediaRecorder.current && refs.mediaRecorder.current.state !== 'inactive') {
            refs.mediaRecorder.current.stop()
            refs.mediaRecorder.current.stream.getTracks().forEach((track) => track.stop())
        }

        if (refs.audioContext.current) {
            refs.audioContext.current.close()
            refs.audioContext.current = null
        }

        if (refs.animationFrame.current) cancelAnimationFrame(refs.animationFrame.current)
        if (refs.silenceTimer.current) clearTimeout(refs.silenceTimer.current)

        setIsRecording(false)
        stopRecognition()
        closeDock('dock')
    }, [])

    const detectSilence = useCallback(() => {
        if (!refs.analyser.current) return

        const bufferLength = refs.analyser.current.frequencyBinCount
        const dataArray = new Float32Array(bufferLength)
        refs.analyser.current.getFloatFrequencyData(dataArray)

        let maxVolume = -Infinity
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxVolume) maxVolume = dataArray[i]
        }

        const recordingTime = Date.now() - refs.recordingStartTime.current

        if (recordingTime < AUDIO_CONFIG.MIN_RECORDING_TIME) {
            refs.animationFrame.current = requestAnimationFrame(detectSilence)
            return
        }

        if (maxVolume < AUDIO_CONFIG.SILENCE_THRESHOLD) {
            if (!refs.silenceTimer.current) {
                refs.silenceTimer.current = setTimeout(() => {
                    console.log('Stopping due to silence...')
                    stopRecording()
                }, AUDIO_CONFIG.SILENCE_DURATION)
            }
        } else {
            if (refs.silenceTimer.current) {
                clearTimeout(refs.silenceTimer.current)
                refs.silenceTimer.current = null
            }
        }

        refs.animationFrame.current = requestAnimationFrame(detectSilence)
    }, [stopRecording])

    const startRecording = useCallback(async () => {
        if (refs.isRecording.current) return
        setTranscript(null)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            const context = new AudioContext()
            if (context.state === 'suspended') await context.resume()

            const source = context.createMediaStreamSource(stream)
            const analyser = context.createAnalyser()
            analyser.fftSize = ANALYSER_CONFIG.fftSize
            analyser.smoothingTimeConstant = ANALYSER_CONFIG.smoothingTimeConstant
            source.connect(analyser)

            refs.audioContext.current = context
            refs.analyser.current = analyser

            const mediaRecorder = new MediaRecorder(stream, MEDIA_RECORDER_OPTIONS)
            refs.mediaRecorder.current = mediaRecorder
            refs.chunks.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) refs.chunks.current.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                setStatus('Transcribing...')
                setTimeout(async () => {
                    const audioBlob = new Blob(refs.chunks.current, { type: 'audio/webm' })
                    if (audioBlob.size < 500) {
                        setStatus('Ready')
                        closeDock('dock')
                        return
                    }

                    const transcription = await mergeTranscript(audioBlob)
                    setTranscript(transcription)
                    setSpeech(transcription)
                    setStatus('Ready')
                    closeDock('dock')
                }, 200)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setStatus('Recording...')
            startRecognition()
            refs.recordingStartTime.current = Date.now()
            detectSilence()
        } catch (err) {
            console.error('Mic Error:', err)
            setStatus('Mic Access Denied')
            closeDock('dock')
        }
    }, [detectSilence, setSpeech])

    const toggleRecording = useCallback(() => {
        if (refs.isRecording.current) {
            console.log('Stopping via toggle...')
            stopRecording()
        } else {
            console.log('Starting via toggle...')
            startRecording()
            openDock('dock', '/dock.html')
        }
    }, [startRecording, stopRecording])

    return {
        isRecording,
        transcript,
        status,
        toggleRecording
    }
}