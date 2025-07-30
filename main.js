const { makeWASocket, delay, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const fs = require('fs')

// CONFIGURASI AWAL
const groupData = {} // Simpan data grup
const adminList = {} // Simpan daftar admin

async function runBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    getMessage: async () => {}
  })

  sock.ev.on('connection.update', (update) => {
    if (update.qr) console.log('SCAN QR INI DI WHATSAPP ANDA:\n' + update.qr)
    if (update.connection === 'open') console.log('BOT AKTIF!')
  })

  sock.ev.on('creds.update', saveCreds)

  // HANDLER PESAN
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.key.remoteJid.endsWith('@g.us')) return // Hanya di grup

    const groupId = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid
    const text = msg.message?.conversation?.toLowerCase() || ''
    const isAdmin = await checkAdmin(groupId, sender, sock)

    // SIMPAN DATA GRUP
    if (!groupData[groupId]) {
      groupData[groupId] = { welcome: true }
      fs.writeFileSync('group_data.json', JSON.stringify(groupData))
    }

    // WELCOME MESSAGE
    if (msg.message?.protocolMessage?.type === 'GROUP_PARTICIPANT_ADD' && groupData[groupId]?.welcome) {
      const group = await sock.groupMetadata(groupId)
      const newMember = msg.message.protocolMessage.participant
      await sock.sendMessage(groupId, {
        text: `Selamat datang di ${group.subject} @${newMember.split('@')[0]}!`,
        mentions: [newMember]
      })
    }

    // HANDLER COMMAND
    if (text.startsWith('!')) {
      const [cmd, ...args] = text.split(' ')

      switch(cmd) {
        // FITUR UMUM
        case '!menu':
          await sock.sendMessage(groupId, {
            text: `📌 *MENU UTAMA*\n\n` +
                  `!info - Info grup\n` +
                  `!tanya [pertanyaan] - Tanya bot\n` +
                  `!quotes - Dapatkan quotes\n` +
                  `\n🔐 *MENU ADMIN*\n` +
                  `!kick @user - Keluarkan member\n` +
                  `!promote @user - Jadikan admin\n` +
                  `!welcome on/off - Nyalakan/matikan welcome`
          })
          break

        case '!info':
          const group = await sock.groupMetadata(groupId)
          const admins = group.participants.filter(p => p.admin).map(a => a.id)
          await sock.sendMessage(groupId, {
            text: `📌 *INFO GRUP*\n\n` +
                  `Nama: ${group.subject}\n` +
                  `Deskripsi: ${group.desc || '-'}\n` +
                  `Anggota: ${group.participants.length}\n` +
                  `Admin: ${admins.length} orang`
          })
          break

        // FITUR ADMIN
        case '!kick':
          if (!isAdmin) return
          const target = args[0]?.replace('@', '') + '@s.whatsapp.net'
          await sock.groupParticipantsUpdate(groupId, [target], 'remove')
          break

        case '!welcome':
          if (!isAdmin) return
          groupData[groupId].welcome = args[0] === 'on'
          fs.writeFileSync('group_data.json', JSON.stringify(groupData))
          await sock.sendMessage(groupId, {
            text: `Welcome message ${groupData[groupId].welcome ? 'diaktifkan' : 'dimatikan'}`
          })
          break

        // TAMBAHKAN CASE LAINNYA DI SINI...
      }
    }
  })
}

// FUNGSI TAMBAHAN
async function checkAdmin(groupId, userJid, sock) {
  const group = await sock.groupMetadata(groupId)
  return group.participants.find(p => p.id === userJid)?.admin !== undefined
}

// JALANKAN BOT
runBot().catch(err => console.log('ERROR:', err))
