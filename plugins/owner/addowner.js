import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ownerPath = path.join(__dirname, '../../database/owner.json')

let handler = async (m, { args, conn, notifReply }) => {
    if (!args[0]) return notifReply('Contoh:\n.addowner 628xxx', 'Add Owner')

    const number = args[0].replace(/[^0-9]/g, '')
    const target = number + '@s.whatsapp.net'

    const cek = await conn.onWhatsApp(target).catch(() => [])
    if (!cek.length) return notifReply('Nomor tidak valid / tidak terdaftar di WhatsApp.', 'Add Owner')

    const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'))
    if (owner.includes(target)) return notifReply(`${target} sudah menjadi Owner.`, 'Add Owner')

    owner.push(target)
    fs.writeFileSync(ownerPath, JSON.stringify(owner, null, 2))
    await notifReply(`✅ ${target} telah menjadi Owner.`, 'Add Owner')
}

handler.command = ['addowner', 'addown']
handler.creator = true

export default handler