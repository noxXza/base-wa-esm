import { jidNormalizedUser, getContentType, areJidsSameUser } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import moment from 'moment-timezone'
import { sizeFormatter } from 'human-readable'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)

export const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

export const generateMessageTag = (epoch) => {
    let tag = unixTimestampSeconds().toString()
    if (epoch) tag += '.--' + epoch
    return tag
}

export const processTime = (timestamp, now) =>
    moment.duration(now - moment(timestamp * 1000)).asSeconds()

export const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`

export const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'get',
            url,
            headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (err) {
        return err
    }
}

export const fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({ method: 'GET', url, ...options })
        return res.data
    } catch (err) {
        return err
    }
}

export const runtime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)

    const parts = []
    if (d) parts.push(`*${d}d*`)
    if (h) parts.push(`*${h}h*`)
    if (m) parts.push(`*${m}m*`)
    if (s) parts.push(`*${s}s*`)

    return parts.join(' ') || '*0s*'
}

export const formatp = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`
})

export const parseMention = (text = '') =>
    [...text.matchAll(/@([0-9]{5,16})/g)].map(v => v[1] + '@s.whatsapp.net')

export const getGroupAdmins = (participants = []) =>
    participants.filter(p => p.admin).map(p => p.id)

export const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const isUrl = (url) =>
    url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))

export const getTime = (format, date) => {
    if (date) return moment(date).locale('id').format(format)
    return moment.tz('Asia/Jakarta').locale('id').format(format)
}

export const tanggal = (numer) => {
    const myMonths = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const myDays = ['Minggu','Senin','Selasa','Rabu','Kamis',"Jum'at",'Sabtu']
    const tgl = new Date(numer)
    const day = tgl.getDate()
    const bulan = tgl.getMonth()
    let thisDay = tgl.getDay()
    thisDay = myDays[thisDay]
    const yy = tgl.getYear()
    const year = (yy < 1000) ? yy + 1900 : yy
    return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`
}

export const smsg = (conn, m, store) => {
    if (!m) return m

    const decode = (jid) => conn.decodeJid?.(jid) || jidNormalizedUser(jid || '')

    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = decode(m.fromMe ? conn.user?.id : m.key.participant || m.chat)
        if (m.isGroup) m.participant = decode(m.key.participant)
    }

    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = m.message[m.mtype]
        m.text = m.msg?.text || m.msg?.caption || m.message.conversation || ''

        const quoted = m.msg?.contextInfo?.quotedMessage
        if (quoted) {
            const type = getContentType(quoted)
            const content = quoted[type]
            
            m.quoted = (content && typeof content === 'object')
                ? content
                : { [type]: content }

            m.quoted.mtype = type
            m.quoted.msg = content
            m.quoted.key = {
                remoteJid: m.chat,
                fromMe: areJidsSameUser(
                    decode(m.msg.contextInfo.participant),
                    decode(conn.user?.id)
                ),
                id: m.msg.contextInfo.stanzaId,
                participant: decode(m.msg.contextInfo.participant)
            }
            m.quoted.sender = decode(m.msg.contextInfo.participant)
            m.quoted.text =
                m.quoted.text ||
                m.quoted.caption ||
                m.quoted.conversation ||
                ''
        }
    }

    m.reply = (text, chatId = m.chat, options = {}) =>
        conn.sendMessage(chatId, { text }, { quoted: m, ...options })

    return m
}

fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename)
    console.log(chalk.redBright(`Update ${__filename}`))
})