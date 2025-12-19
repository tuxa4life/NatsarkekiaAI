import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { currentMonitor } from '@tauri-apps/api/window'

const openWin = async (id: string, url: string, width: number = 180, height: number = 75, initY: number = 10) => {
    let initX = 600

    try {
        const monitor = await currentMonitor()
        if (monitor) {
            const screenWidth = monitor.size.width / monitor.scaleFactor
            initX = Math.round((screenWidth - width) / 2)
        }
    } catch (e) {
        console.error('Failed to get monitor info, using default X', e)
    }

    const win = new WebviewWindow(id, {
        url,
        width,
        height,
        x: initX,
        y: initY,
        decorations: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        hiddenTitle: true,
        skipTaskbar: true,
        shadow: false
    })

    win.once('tauri://created', async () => {
        await win.setIgnoreCursorEvents(true)
    })

    win.once('tauri://error', (e) => {
        console.error(e)
        return
    })

    return win
}

export const openDock = async (value: string, blinking = true) => {
    const val = encodeURIComponent(value)
    const dotBlinking = encodeURIComponent(blinking)
    const win = openWin('dock', `/dock.html?value=${val}&blinking=${dotBlinking}`)

    return win
}

export const openDockTemporarily = async (value: string, blinking = true) => {
    setTimeout(() => {
        openDock(value, blinking)
        setTimeout(() => closeDock('dock'), 3000)
    }, 500)
}

export const closeDock = async (id: string): Promise<boolean> => {
    try {
        const win = await WebviewWindow.getByLabel(id)

        if (!win) {
            console.warn(`Window with id "${id}" not found`)
            return false
        }

        await win.close()
        return true
    } catch (e) {
        console.error(`Failed to close window "${id}"`, e)
        return false
    }
}
