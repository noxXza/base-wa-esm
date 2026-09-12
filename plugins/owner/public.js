import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(__dirname, '../../config.json')

let handler = async (m, { conn, notifReply }) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (config.botMode === 'public') return notifReply('Bot sudah dalam mode Public.', 'Mode Public')

    config.botMode = 'public'
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    conn.public = true
    await notifReply('Bot mode berhasil diubah ke Public.', 'Mode Public')
}

handler.command = ['public']
handler.owner = true

export default handler