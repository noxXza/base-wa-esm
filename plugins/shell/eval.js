import util from 'util'

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

function formatErrorName(name) {
    return String(name).replace(/([a-z])([A-Z])/g, '$1 $2')
}

function buildBody(code) {
    const trimmed = code.trim()
    if (!trimmed) return 'return undefined'
    if (/(^|[^.\w])return[\s;]/.test(trimmed)) return trimmed
    try {
        new Function(`return (${trimmed})`)
        return `return (${trimmed})`
    } catch {
        return trimmed
    }
}

let handler = async (m, { conn, args, text, prefix, command, notifReply }) => {
    try {
        const code = m.text.slice(2).trim()
        if (!code) return notifReply('Masukkan kode untuk di-eval.', 'Eval')

        const body = buildBody(code)
        const fn = new AsyncFunction(
            'conn', 'sock', 'm', 'args', 'text',
            'prefix', 'command', 'notifReply',
            body
        )

        let evaled = await fn(
            conn, conn, m, args, text,
            prefix, command, notifReply
        )

        if (typeof evaled !== 'string') {
            evaled = util.inspect(evaled, { depth: 2, colors: false })
        }

        await notifReply(evaled ?? 'undefined', 'Eval Result')
    } catch (err) {
        await notifReply(`${formatErrorName(err.name)}: ${err.message}`, 'Eval Error')
    }
}

handler.customPrefix = /^=>/
handler.owner = true

export default handler