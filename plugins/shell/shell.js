import { promisify, inspect } from 'util'
import { exec } from 'child_process'

const shell = promisify(exec)

let handler = async (m, { notifReply }) => {
    const cmd = m.text.replace(/^\$/, '').trim()
    if (!cmd) return notifReply('Contoh:\n$ ls', 'Shell Command')

    try {
        const { stdout, stderr } = await shell(cmd, {
            shell: '/bin/bash',
            maxBuffer: 1024 * 1024 * 20
        })
        await notifReply(stderr || stdout || 'Done.', 'Shell Result')
    } catch (e) {
        await notifReply(e.stderr || e.stdout || inspect(e), 'Shell Error')
    }
}

handler.customPrefix = /^\$/
handler.owner = true

export default handler