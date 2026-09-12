import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const premPath = path.join(__dirname, '../../database/premium.json')

let handler = async (m, { args, conn, notifReply }) => {
    if (!args[0]) return notifReply('Contoh:\n.addprem 628xxx', 'Add Premium')

    const number = args[0].replace(/[^0-9]/g, '')
    const target = number + '@s.whatsapp.net'

    const cek = await conn.onWhatsApp(target).catch(() => [])
    if (!cek.length) return notifReply('Nomor tidak valid / tidak terdaftar di WhatsApp.', 'Add Premium')

    const premium = JSON.parse(fs.readFileSync(premPath, 'utf8'))
    if (premium.includes(target)) return notifReply(`${target} sudah menjadi Premium.`, 'Add Premium')

    premium.push(target)
    fs.writeFileSync(premPath, JSON.stringify(premium, null, 2))
    await notifReply(`✅ ${target} telah menjadi Premium.`, 'Add Premium')
}

handler.command = ['addprem', 'addpremium']
handler.creator = true

export default handler