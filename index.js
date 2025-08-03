const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const { state, saveState } = useSingleFileAuthState('./auth.json')

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!messages[0].message) return
        const msg = messages[0]
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        if (text === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong!' })
        }
    })
}

startBot()
