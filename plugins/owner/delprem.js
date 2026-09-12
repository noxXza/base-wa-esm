import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const premPath = path.join(__dirname, '../../database/premium.json')

let handler = async (m, { args, notifReply }) => {
    if (!args[0]) return notifReply('Contoh:\n.delprem 628xxx', 'Delete Premium')

    const number = args[0].replace(/[^0-9]/g, '')
    const target = number + '@s.whatsapp.net'

    const premium = JSON.parse(fs.readFileSync(premPath, 'utf8'))
    const idx = premium.indexOf(target)
    if (idx === -1) return notifReply(`${target} bukan Premium.`, 'Delete Premium')

    premium.splice(idx, 1)
    fs.writeFileSync(premPath, JSON.stringify(premium, null, 2))
    await notifReply(`✅ ${target} sudah bukan Premium.`, 'Delete Premium')
}

handler.command = ['delprem', 'delpremium']
handler.creator = true

export default handler