const { makeWASocket } = require('@whiskeysockets/baileys');
const fs = require('fs');

// Load data
const groupData = JSON.parse(fs.readFileSync('./data/groups.json'));
const admins = JSON.parse(fs.readFileSync('./data/admins.json'));

const sock = makeWASocket({
  auth: { creds: {}, keys: {} }, // Auto-generate
  printQRInTerminal: true
});

sock.ev.on('messages.upsert', async (m) => {
  const msg = m.messages[0];
  const text = msg.message?.conversation?.toLowerCase() || '';
  const sender = msg.key.remoteJid;
  const isGroup = sender.endsWith('@g.us');

  // Handle perintah
  if (text.startsWith('!menu')) showMenu(sender, isGroup);
  if (text.startsWith('!kick') && isAdmin(sender)) handleKick(msg);
  // ... tambah handler lain
});

function showMenu(userJid, isGroup) {
  const menuUser = `
📌 *MENU UTAMA*:
!info - Info grup
!tanya [pertanyaan] - Tanya bot
!game - Game tebak angka
!stiker - Buat stiker
  `;

  const menuAdmin = `
🔐 *MENU ADMIN*:
!kick @user - Keluarkan member
!promote @user - Jadikan admin
!lock desc - Kunci deskripsi grup
!antispam 5 - Set anti spam
  `;

  sock.sendMessage(userJid, { text: isGroup ? menuUser + menuAdmin : menuUser });
           }
