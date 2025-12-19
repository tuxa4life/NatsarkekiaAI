import { useEffect } from 'react'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import { GLOBAL_SHORTCUT } from './audioConfig'

export const useKeyboardShortcuts = (toggleRecording: () => void) => {
    useEffect(() => {
        const setupGlobalShortcut = async () => {
            if (await isRegistered(GLOBAL_SHORTCUT)) {
                await unregister(GLOBAL_SHORTCUT)
            }

            await register(GLOBAL_SHORTCUT, (event) => {
                if (event.state === 'Pressed') {
                    toggleRecording()
                }
            })
        }

        setupGlobalShortcut()

        return () => {
            unregister(GLOBAL_SHORTCUT).catch(console.error)
        }
    }, [toggleRecording])

    useEffect(() => {
        const handleLocalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault()
                toggleRecording()
            }
        }

        window.addEventListener('keydown', handleLocalKeyDown)
        return () => window.removeEventListener('keydown', handleLocalKeyDown)
    }, [toggleRecording])
}
