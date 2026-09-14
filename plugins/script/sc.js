import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const thumbPath = path.join(__dirname, '../../media/thumb.jpg')

let handler = async (m, { conn }) => {
    const pushname = m.pushName || 'No Name'

    const sc = `> *halo ${pushname}, apakah kamu ingin base script ini?*`

    const anu = `
jika kamu menginginkan base script ini silahkan klik tombol di bawah ini

\`rulles\`
- dilarang keras menghapus credits minimal taro di tqto
- dilarang memperjual belikan base ini karena 100% free
- boleh di jual dengan syarat sudah di tambah fitur
- dilarang mengklaim script ini 100%
`.trim()

    try {
        const thumb = await sharp(thumbPath).resize(300, 300).jpeg({ quality: 80 }).toBuffer()

        const media = await prepareWAMessageMedia(
            { image: thumb, mimetype: 'image/jpeg' },
            { upload: conn.waUploadToServer }
        )

        const interactiveMsg = {
            body: { text: sc },
            footer: { text: anu },
            header: {
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
            },
            nativeFlowMessage: {
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'get sc',
                        url: 'https://github.com/noxXza/base-wa-esm',
                        merchant_url: 'https://www.google.com'
                    })
                }],
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
        await conn.sendMessage(m.chat, { text: `❌ Gagal kirim pesan: ${e.message}` }, { quoted: m })
    }
}

handler.command = ['sc', 'script', 'getsc']

export default handler