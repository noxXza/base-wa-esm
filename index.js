import readline from 'readline'
import pino from 'pino'
import chalk from 'chalk'
import {
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    jidDecode,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    makeWASocket
} from '@whiskeysockets/baileys'
import { smsg } from './lib/myfunc.js'
import handleMessage, { initPlugins } from './handler.js'

const usePairingCode = true

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise(resolve => rl.question(text, resolve))

const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) })

let pluginsLoaded = false

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        printQRInTerminal: !usePairingCode,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        }
    })

    sock.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return decode.user && decode.server ? decode.user + '@' + decode.server : jid
        }
        return jid
    }

    store.bind(sock.ev)

    if (!sock.authState.creds.registered && usePairingCode) {
        const phoneNumber = await question(`
Silahkan masukkan nomor (628xxx):
`)
        const code = await sock.requestPairingCode(phoneNumber.trim(), 'NOXLEYSS')
        console.log(chalk.blue('\nPAIRING CODE:', code))
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const mek = messages[0]
            if (!mek.message) return
            if (mek.key.remoteJid === 'status@broadcast') return
            if (mek.key.id?.startsWith('BAE5') && mek.key.id.length === 16) return

            const m = smsg(sock, mek, store)
            if (!m) return

            await handleMessage(sock, m)
        } catch (e) {
            console.log(e)
        }
    })

    sock.public = true

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            if (!pluginsLoaded) {
                await initPlugins()
                pluginsLoaded = true
            }
            return
        }

        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp()
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()