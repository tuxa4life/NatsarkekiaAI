import { useEffect, useState } from 'react'
import AudioListener from './components/AudioListener'
import './styles/app.css'
import { mergeTranscripts } from './apis/cerebrasService';

export type speechState = {
    T1: string;
    T2: string;
} | null

const App = () => {
    const [speech, setSpeech] = useState<speechState>(null)

    const getResult = async () => {
        if (speech !== null) {
            const result = await mergeTranscripts(`T1: ${speech.T1}\nT2: ${speech.T2}`)
            console.log(result)
        }
    }

    useEffect(() => {
        getResult()
    }, [speech])

    return <div>
        <AudioListener setSpeech={setSpeech} />
    </div>
}

export default App
