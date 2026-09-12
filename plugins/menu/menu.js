import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { runtime, tanggal } from '../../lib/myfunc.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(__dirname, '../../config.json')
const thumbPath = path.join(__dirname, '../../media/thumb.jpg')

let handler = async (m, { conn, prefix }) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const pushname = m.pushName || 'No Name'
    const date = tanggal(Date.now())

    const thumb = await sharp(thumbPath)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toBuffer()

    const msg = `*haloo ${pushname}*`

    const anu = `
□ ./Information.js_
└────────
│ ├─ Creator ☇ *noxXza.exe* 
│ ├─ Telegram ☇ *t.me/noxXza19*
│ ├─ Bot Name ☇ *${config.botName}*
│ ├─ Baileys ☇ *npm:noxleyss*
│ ├─ Type ☇ *Plugins (esm)*
│ ├─ Prefix ☇ *Multi*
│ ├─ Status User ☇ ${m.isCreator ? '*👑 Owner*' : m.isPremium ? '*💎 Premium*' : '*🫪 User Free*'}
│ ├─ Mode Bot ☇ ${config.botMode === 'public' ? '*🌐Public*' : '*🔒Self*'}
│ ├─ Run Time ☇ ${runtime(process.uptime())}
│ └────────

□ ./Menu.js_
└────────
│ ├─ /addowner
│ ├─ /delowner
│ ├─ /addprem
│ ├─ /delprem
│ ├─ /public
│ ├─ /self
│ ├─ /ping
│ ├─ /sc
│ └────────
`

    await conn.sendMessage(m.chat, {
        buttonsMessage: {
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: config.botName,
                address: `📍${date}`,
                jpegThumbnail: thumb
            },
            contentText: msg,
            footerText: anu,
            buttons: [
                {
                    buttonId: 'menu',
                    buttonText: { displayText: '☰ menu' },
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Pilih Menu',
                            sections: [{
                                title: config.botName,
                                highlight_label: '🔥',
                                rows: [
                                    { header: '', title: 'ping', description: 'Server Live', id: `${prefix}ping` },
                                    { header: '', title: 'menu', description: 'Show Menu', id: `${prefix}menu` }
                                ]
                            }]
                        })
                    },
                    type: 1
                },
                {
                    buttonId: 'sc',
                    buttonText: { displayText: '⌕ script' },
                    type: 1
                }
            ],
            headerType: 6
        }
    }, { quoted: m })
}

handler.command = ['menu', 'help']

export default handler