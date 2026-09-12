import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ownerPath = path.join(__dirname, '../../database/owner.json')

let handler = async (m, { args, notifReply }) => {
    if (!args[0]) return notifReply('Contoh:\n.delowner 628xxx', 'Delete Owner')

    const number = args[0].replace(/[^0-9]/g, '')
    const target = number + '@s.whatsapp.net'

    const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'))
    const idx = owner.indexOf(target)
    if (idx === -1) return notifReply(`${target} bukan Owner.`, 'Delete Owner')

    owner.splice(idx, 1)
    fs.writeFileSync(ownerPath, JSON.stringify(owner, null, 2))
    await notifReply(`✅ ${target} sudah bukan Owner.`, 'Delete Owner')
}

handler.command = ['delowner', 'delown']
handler.creator = true

export default handler