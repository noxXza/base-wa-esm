import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(__dirname, '../../config.json')

let handler = async (m, { conn, notifReply }) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (config.botMode === 'self') return notifReply('Bot sudah dalam mode Self.', 'Mode Self')

    config.botMode = 'self'
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    conn.public = false
    await notifReply('Bot mode berhasil diubah ke Self.', 'Mode Self')
}

handler.command = ['self']
handler.owner = true

export default handler