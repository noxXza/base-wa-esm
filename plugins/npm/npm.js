import { generateWAMessageFromContent } from 'noxleyss'

let handler = async (m, { conn }) => {
    const pushname = m.pushName || 'No Name'

    const anu = `> 📢 *haloo ${pushname}, saya ada rekomendasi library baileys bot WhatsApp* [ *npm:noxleyss@latest ]* 📢`

    const msg = `
\`"npm:noxleyss@latest"\`

📍*cara penggunaan*📍

\`\`\`"noxleyss": "latest",

{
  "dependencies": {
    "noxleyss": "latest",
    "@hapi/boom": "^10.0.1",
    "pino": "^8.17.2",
    "jimp": "^0.22.12",
    "sharp": "0.34.1",
    "fflate": "^0.8.2"
  }
}\`\`\`

- Support AiRich
- Support html
- Support table A2UI
- No logout sender
- Update Proto terbaru
- Support all type button
- Support custom pairing
- Support script type cjs & esm
- dll

📦*packages*📦
https://www.npmjs.com/noxleyss
`

    try {
        const interactiveMsg = {
            body: { text: anu },
            footer: { text: msg },
            header: { hasMediaAttachment: false },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copy baileys',
                            id: 'copy_baileys',
                            copy_code: '"noxleyss": "latest"'
                        })
                    },
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copy fflate',
                            id: 'copy_fflate',
                            copy_code: '"fflate": "^0.8.2"'
                        })
                    },
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copy jimp',
                            id: 'copy_jimp',
                            copy_code: '"jimp": "^0.22.12"'
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Information',
                            url: 'https://whatsapp.com/channel/0029VbD8x4q1dAw0XWN7wF0L',
                            merchant_url: 'https://www.google.com'
                        })
                    }
                ],
                messageParamsJson: '{}'
            }
        }

        const generatedMsg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: interactiveMsg
                }
            }
        }, { userJid: m.chat, upload: conn.waUploadToServer })

        await conn.relayMessage(m.chat, generatedMsg.message, { messageId: generatedMsg.key.id })
    } catch (e) {
        console.error(e)
    }
}

handler.customPrefix = /\b(bail|baileys|npm|bails)\b/i

export default handler