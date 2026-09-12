import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginDir = path.join(__dirname, 'plugins')
const configPath = path.join(__dirname, 'config.json')
const ownerPath = path.join(__dirname, 'database/owner.json')
const premiumPath = path.join(__dirname, 'database/premium.json')

export const plugins = new Map()

const pluginCache = new Map()
const watchers = new Map()
const pendingReloads = new Map()

const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'))

function getPluginFiles(dir) {
    let files = []
    if (!fs.existsSync(dir)) return files
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name)
        if (item.isDirectory()) files.push(...getPluginFiles(full))
        else if (item.isFile() && item.name.endsWith('.js')) files.push(full)
    }
    return files
}

async function loadPlugin(file) {
    try {
        const module = await import(`${pathToFileURL(file).href}?update=${Date.now()}`)
        const handler = module.default
        if (!handler) return

        if (pluginCache.has(file)) {
            for (const key of pluginCache.get(file)) plugins.delete(key)
        }

        const keys = []
        if (handler.command && !(handler.command instanceof RegExp)) {
            const commands = Array.isArray(handler.command) ? handler.command : [handler.command]
            for (const cmd of commands) {
                const key = String(cmd).toLowerCase()
                plugins.set(key, handler)
                keys.push(key)
            }
        }

        if (handler.customPrefix) {
            const key = Symbol(file)
            plugins.set(key, handler)
            keys.push(key)
        }

        pluginCache.set(file, keys)
    } catch (e) {
        console.error(e)
    }
}

async function unloadPlugin(file) {
    if (!pluginCache.has(file)) return
    for (const key of pluginCache.get(file)) plugins.delete(key)
    pluginCache.delete(file)
}

export async function initPlugins() {
    for (const file of getPluginFiles(pluginDir)) {
        await loadPlugin(file)
    }
    watch(pluginDir)
}

function watch(dir) {
    if (watchers.has(dir)) return
    watchers.set(dir, fs.watch(dir, (_, filename) => {
        if (!filename || !filename.endsWith('.js')) return
        const file = path.join(dir, filename)
        if (pendingReloads.has(file)) clearTimeout(pendingReloads.get(file))
        pendingReloads.set(file, setTimeout(async () => {
            pendingReloads.delete(file)
            if (fs.existsSync(file)) await loadPlugin(file)
            else await unloadPlugin(file)
        }, 200))
    }))
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.isDirectory()) watch(path.join(dir, item.name))
    }
}

function extractCommandFromMessage(m) {
    let body = ''
    let isButtonResponse = false
    try {
        if (m.message) {
            if (m.message.conversation) body = m.message.conversation
            else if (m.message.extendedTextMessage?.text) body = m.message.extendedTextMessage.text
            else if (m.message.imageMessage?.caption) body = m.message.imageMessage.caption
            else if (m.message.videoMessage?.caption) body = m.message.videoMessage.caption
            else if (m.message.documentMessage?.caption) body = m.message.documentMessage.caption
            else if (m.message.interactiveResponseMessage) {
                const inter = m.message.interactiveResponseMessage
                if (inter.nativeFlowResponseMessage) {
                    const flow = inter.nativeFlowResponseMessage
                    if (flow.paramsJson) {
                        try {
                            const params = JSON.parse(flow.paramsJson)
                            body = params.id || params.buttonId || params.rowId || params.index || ''
                        } catch { body = flow.name || '' }
                    } else body = flow.name || ''
                    isButtonResponse = true
                } else if (inter.buttonReply) {
                    body = inter.buttonReply.selectedButtonId || ''
                    isButtonResponse = true
                } else if (inter.singleSelectReply) {
                    body = inter.singleSelectReply.selectedRowId || ''
                    isButtonResponse = true
                }
            } else if (m.message.templateButtonReplyMessage) {
                body = m.message.templateButtonReplyMessage.selectedId || ''
                isButtonResponse = true
            } else if (m.message.buttonsResponseMessage) {
                body = m.message.buttonsResponseMessage.selectedButtonId || ''
                isButtonResponse = true
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error)
    }
    return { body, isButtonResponse }
}

export default async function handleMessage(conn, m) {
    try {
        const { body, isButtonResponse } = extractCommandFromMessage(m)
        if (!body) return
        m.text = body
        m.isButtonResponse = isButtonResponse

        const config = readJSON(configPath)
        const owner = readJSON(ownerPath)
        const premium = readJSON(premiumPath)

        const number = m.sender.split('@')[0]
        const botNumber = conn.decodeJid(conn.user.id).split('@')[0]

        const creatorList = [botNumber, ...(config.creator || [])]
            .map(v => String(v).replace(/[^0-9]/g, ''))

        m.isCreator = creatorList.includes(number)
        m.isOwner = m.isCreator || owner.map(v => v.split('@')[0]).includes(number)
        m.isPremium = m.isOwner || premium.map(v => v.split('@')[0]).includes(number)

        if (config.botMode === 'self' && !m.isOwner && !m.fromMe) return

        const notifReply = async (text, title = 'Notification') => {
            await conn.sendMessage(m.chat, {
                text: `*${title}*\n\n${text}`
            }, { quoted: m })
        }

        const checkAccess = handler => {
            const permissions = [
                ['owner', m.isOwner, config.accessDenied.owner],
                ['creator', m.isCreator, config.accessDenied.creator],
                ['premium', m.isPremium, config.accessDenied.premium]
            ]
            for (const [key, allowed, message] of permissions) {
                if (handler[key] && !allowed) {
                    notifReply(message, 'Access Denied')
                    return true
                }
            }
            return false
        }

        if (isButtonResponse) {
            let bodyText = body
            const prefixes = config.prefix || ['.']
            for (const p of prefixes) {
                if (bodyText.startsWith(p)) {
                    bodyText = bodyText.slice(p.length)
                    break
                }
            }
            const args = bodyText.trim().split(/\s+/)
            const command = args.shift().toLowerCase()
            const handler = plugins.get(command)
            if (!handler) return
            if (checkAccess(handler)) return
            return await handler(m, {
                conn, args, text: args.join(' '),
                command, prefix: '', notifReply
            })
        }

        const hasConfigPrefix = (config.prefix || ['.']).some(p => m.text.startsWith(p))

        if (!hasConfigPrefix) {
            // Custom prefix (=> / $ / keyword)
            let matchedHandler = null

            // Prioritas 1: hard prefix (^=> / ^$)
            for (const handler of plugins.values()) {
                if (!handler.customPrefix) continue
                if (!handler.customPrefix.source.startsWith('^')) continue
                if (!handler.customPrefix.test(m.text)) continue
                matchedHandler = handler
                break
            }

            if (!matchedHandler) {
                for (const handler of plugins.values()) {
                    if (!handler.customPrefix) continue
                    if (handler.customPrefix.source.startsWith('^')) continue
                    if (!handler.customPrefix.test(m.text)) continue
                    matchedHandler = handler
                    break
                }
            }

            if (matchedHandler) {
                if (checkAccess(matchedHandler)) return
                return await matchedHandler(m, {
                    conn,
                    args: [],
                    text: m.text,
                    command: '',
                    prefix: '',
                    notifReply
                })
            }
        }

        let prefix = ''
        let command = ''
        let args = []

        if (hasConfigPrefix) {
            prefix = (config.prefix || ['.']).find(p => m.text.startsWith(p))
            const body2 = m.text.slice(prefix.length).trim()
            if (!body2) return
            const parts = body2.split(/\s+/)
            command = parts.shift().toLowerCase()
            args = parts
        } else {
            const trimmed = m.text.trim()
            if (/\s/.test(trimmed)) return
            command = trimmed.toLowerCase()
            args = []
        }

        const handler = plugins.get(command)
        if (!handler) return
        if (checkAccess(handler)) return

        await handler(m, {
            conn, args,
            text: args.join(' '),
            command, prefix, notifReply
        })
    } catch (e) {
        console.error(e)
    }
}