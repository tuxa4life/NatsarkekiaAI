import { useEffect, useState } from 'react'
import AudioListener from './components/AudioListener'
import './styles/app.css'
import { mergeTranscripts } from './utils/cerebrasService';

export type speechState = {
    T1: string;
    T2: string;
} | null

const App = () => {
    const [speech, setSpeech] = useState<speechState>(null)
    const [result, setResult] = useState('')

    const getResult = async () => {
        if (speech !== null) {
            const result = await mergeTranscripts(`T1: ${speech.T1}\nT2: ${speech.T2}`)
            setResult(result)
        }
    }

    useEffect(() => {
        getResult()
    }, [speech])

    return <div>
        <AudioListener setSpeech={setSpeech} />
        <h1 style={{width: '70%', marginLeft: '15%'}}>{result}</h1>
    </div>
}

export default App
