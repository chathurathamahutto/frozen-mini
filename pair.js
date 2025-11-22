const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
const yts = require('yt-search');
const RCD_IMAGE_PATH = 'https://files.catbox.moe/kzlgqx.jpg';

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    downloadContentFromMessage,
    jidNormalizedUser,
    proto,
    prepareWAMessageMedia,
    downloadMediaMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent
} = require('baileys');
const config = {
    AUTO_VIEW_STATUS: 'true',
    AUTO_LIKE_STATUS: 'true',
    AUTO_RECORDING: 'false',
    BOT_NAME:"𝚂𝚄𝙻𝙰 𝙼𝙸𝙽𝙸",
    BOT_FOOTER:"> © 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃",
    SONG_FOOTER:"MUSIC 💖",
    AUTO_TYPING: 'false',
    AUTO_REACT: 'false',
    AUTO_REPLY_STATUS: 'false',
 READ_CMD: 'true', 
    ALLWAYS_OFFLINE: 'false', 
    MODE: 'public', 
    ANTI_CALL: 'false',
    AUTO_LIKE_EMOJI: ['❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗','💖', '💘', '💝', '💟',],
    PREFIX: '.',
    MAX_RETRIES: 3,
    GROUP_INVITE_LINK: 'https://chat.whatsapp.com/LoJBIgjMjdiDI7NW5ZCTEr',
    ADMIN_LIST_PATH: './admin.json',
    SULA_IMAGE_PATH: './sula.jpg',
    RCD_IMAGE_PATH: './sula.jpg',
    NEWSLETTER_JID: '120363385281017920@newsletter',
    NEWSLETTER_MESSAGE_ID: '428',
    OTP_EXPIRY: 300000,
    AUTO_REPLY_MESSAGES: [
  "🔥 වාහ් මචන්, ගොඩක්ම ලස්සනයි!",
  "😍 Wah wah bn, lassanata thama!",
  "😎 Style eka godak set!",
  "✨ Supiri idea ekak machan!",
  "🌸 අයිති වුනමම අලංකාරයි මේක!",
  "🤩 Wow, hari class!",
  "🙌 Ela ela bn, mood eka thiyenne!",
  "💯 Oya status eka next level!",
  "😁 බැලුවමම සතුටක් එනවා!",
  "👌 Lassana simplicity ekak!",
  "😌 හිතටම සන්සුන් feeling එකක් දෙනවා!",
  "💎 Gahapu status eka diamond wage!",
  "👏 Creative ekak thama!",
  "🌟 Ban shine karanawa lassanata!",
  "❤️ හිතට ඇදගන්න vibe ekak!",
  "🔥 අනිවාර්යයෙන්ම classy bn!",
  "😃 Supiri mood ekak!",
  "💖 ලස්සනටම thiyenne!",
  "🤗 මටත් happy feelings!",
  "🌙 රෑ mood vibes ❤️",
  "🤣 Status baluwama mage sim reload una wage 😂",
  "🎶 Lassana vibe ekak bn, music touch!",
  "🕶️ Ene ne ban, boss level!",
  "😇 තරහක් නැති calm look ekak!",
  "🌸 Hari lassanata bn!",
  "🔥 දැනටමම ගොඩක් cool!",
  "🌍 Oya status ekata world class look!",
  "🙈 Lassanata balanna puluwan machan!",
  "🤩 Stylish ne, proud of you!",
  "🍃 Cool + calm bn!",
  "⚡ Ene vibe overload!",
  "📸 Photo ekak wage beauty!",
  "🙌 Ban oya okkoma next level!",
  "💭 හිතටම ගියා status eka!",
  "😎 Boss look ekak bn!",
  "🎉 Ela ela, vibe eka set!",
  "😌 Chill ne machan!",
  "💖 මට ගොඩක් ආදරෙයි මේ look එකට!",
  "🔥 Ela bn, wow!",
  "😁 Hariyata funny ekak wage!",
  "😍 Love karanawa status eka!",
  "😅 Status baluwama internet slow una wage 😂",
  "🙌 Respect machan!",
  "🌟 Glow ne bn!",
  "💯 100% lassana!",
  "🤩 Wah wah super cool!",
  "✨ Next level idea!",
  "💖 සුපිරි look ekak!",
  "😎 Oya hari smart!",
  "🌸 පට්ටම ලස්සනයි!",
  "🔥 Ban godak classy!",
  "😂 මචන්, status eka balama hithuna TikTok clip ekak wage!",
  "😍 ආදරෙයි vibe එකට!",
  "😉 Lassana bn, boss look!",
  "💎 Luxury ekak wage!",
  "🙏 Gahapu status ekata salute!",
  "❤️ මට ගොඩක්ම හිත ගියා!",
  "🎶 Song ekak wage feelings!",
  "😌 Mage mood eka calm karala thiyenne!"
],

    OWNER_NUMBER: '94760663483',
    CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb65iOZKwqSNKecV8V07'
   
};

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';
const NUMBER_LIST_PATH = './numbers.json';
const otpStore = new Map();
const SessionSchema = new mongoose.Schema({
    number: { type: String, unique: true, required: true },
    creds: { type: Object, required: true },
    config: { type: Object },
    updatedAt: { type: Date, default: Date.now }
});
const Session = mongoose.model('Session', SessionSchema);
async function connectMongoDB() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://mdsula:Su0112Ma@cluster0.kylwrio.mongodb.net/Cluster0?retryWrites=true&w=majority';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}
connectMongoDB();
if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

function initialize() {
    activeSockets.clear();
    socketCreationTime.clear();
    console.log('Cleared active sockets and creation times on startup');
}

async function autoReconnectOnStartup() {
    try {
        let numbers = [];
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
            console.log(`Loaded ${(numbers.length)} numbers from numbers.json`);
        } else {
            console.warn('No numbers.json found, checking MongoDB for sessions...');
        }

        const sessions = await Session.find({}, 'number').lean();
        const mongoNumbers = sessions.map(s => s.number);
        console.log(`Found ${mongoNumbers.length} numbers in MongoDB sessions`);

        numbers = [...new Set([...numbers, ...mongoNumbers])];
        if (numbers.length === 0) {
            console.log('No numbers found in numbers.json or MongoDB, skipping auto-reconnect');
            return;
        }

        console.log(`Attempting to reconnect ${numbers.length} sessions...`);
        for (const number of numbers) {
            if (activeSockets.has(number)) {
                console.log(`Number ${number} already connected, skipping`);
                continue;
            }
            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
            try {
                await EmpirePair(number, mockRes);
                console.log(`Initiated reconnect for ${number}`);
            } catch (error) {
                console.error(`Failed to reconnect ${number}:`, error);
            }
            await delay(1000);
        }
    } catch (error) {
        console.error('Auto-reconnect on startup failed:', error);
    }
}

initialize();
setTimeout(autoReconnectOnStartup, 5000);

function loadAdmins() {
    try {
        if (fs.existsSync(config.ADMIN_LIST_PATH)) {
            return JSON.parse(fs.readFileSync(config.ADMIN_LIST_PATH, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('Failed to load admin list:', error);
        return [];
    }
}

function formatMessage(title, content, footer) {
    return `${title}\n\n${content}\n\n${footer}`;
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSriLankaTimestamp() {
    return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
}

function extractYouTubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|playlist\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function convertYouTubeLink(q) {
    const videoId = extractYouTubeId(q);
    if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return q;
}

async function joinGroup(socket) {
    let retries = config.MAX_RETRIES;
    const inviteCodeMatch = config.GROUP_INVITE_LINK.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
    if (!inviteCodeMatch) {
    
        return { status: 'failed', error: 'Invalid group invite link' };
    }
    const inviteCode = inviteCodeMatch[1];

    while (retries > 0) {
        try {
            const response = await socket.groupAcceptInvite(inviteCode);
            if (response?.gid) {
               
                return { status: 'success', gid: response.gid };
            }
            throw new Error('No group ID in response');
        } catch (error) {
            retries--;
            let errorMessage = error.message || 'Unknown error';
            if (error.message.includes('not-authorized')) {
                errorMessage = 'Bot is not authorized to join (possibly banned)';
            } else if (error.message.includes('conflict')) {
                errorMessage = 'Bot is already a member of the group';
            } else if (error.message.includes('gone')) {
                errorMessage = 'Group invite link is invalid or expired';
            }
          
            if (retries === 0) {
                return { status: 'failed', error: errorMessage };
            }
            await delay(2000 * (config.MAX_RETRIES - retries));
        }
    }
    return { status: 'failed', error: 'Max retries reached' };
}

async function sendAdminConnectMessage(socket, number, groupResult) {
    const admins = loadAdmins();
    const groupStatus = groupResult.status === 'success'
        ? `Joined (ID: ${groupResult.gid})`
        : `Failed to join group: ${groupResult.error}`;
    const caption = formatMessage(
        '𝑩𝑶𝑻 𝑪𝑶𝑵𝑵𝑬𝑪𝑻𝑬𝑫✅',
        `𝙷𝙸 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃 𝙽𝙾𝚆 🏷️🤭`,
        '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
    );

    for (const admin of admins) {
        try {
            await socket.sendMessage(
                `${admin}@s.whatsapp.net`,
                {
                    image: { url: config.SULA_IMAGE_PATH },
                    caption
                }
            );
        } catch (error) {
            console.error(`Failed to send connect message to admin ${admin}:`, error);
        }
    }
}

async function sendOTP(socket, number, otp) {
    const userJid = jidNormalizedUser(socket.user.id);
    const message = formatMessage(
        '🔐 𝙎𝙐𝙇𝘼 𝙑𝙀𝙍𝙄𝙁𝙄𝘾𝘼𝙏𝙄𝙊𝙉 𝘾𝙊𝘿𝙀🔑',
        `Your OTP is: *${otp}*\nThis OTP will expire in 5 minutes.`,
        '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
    );

    try {
        await socket.sendMessage(userJid, { text: message });
     
    } catch (error) {
        
        throw error;
    }
}




function setupNewsletterHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || message.key.remoteJid !== config.NEWSLETTER_JID) return;

        try {
            const emojis = ['🧡', '💛', '💚', '💙', '💜'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            const messageId = message.newsletterServerId;

            if (!messageId) {
                console.warn('No valid newsletterServerId found:', message);
                return;
            }

            let retries = config.MAX_RETRIES;
            while (retries > 0) {
                try {
                    await socket.newsletterReactMessage(
                        config.NEWSLETTER_JID,
                        messageId.toString(),
                        randomEmoji
                    );
                    console.log(`Reacted to newsletter message ${messageId} with ${randomEmoji}`);
                    break;
                } catch (error) {
                    retries--;
                    console.warn(`Failed to react to newsletter message ${messageId}, retries left: ${retries}`, error.message);
                    if (retries === 0) throw error;
                    await delay(2000 * (config.MAX_RETRIES - retries));
                }
            }
        } catch (error) {
            console.error('Newsletter reaction error:', error);
        }
    });
}


///////////////////////////////////////////////////////////////////
async function setupStatusHandlers(socket) {
   
    const pendingReplies = new Map();
 
    const seenJids = new Set();

    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.key || msg.key.remoteJid !== 'status@broadcast' || !msg.key.participant || msg.key.remoteJid === config.NEWSLETTER_JID) return;

     
        const botJid = jidNormalizedUser(socket.user.id);
        if (msg.key.participant === botJid) return;

        
        const sanitizedNumber = botJid.split('@')[0].replace(/[^0-9]/g, '');
        const sessionConfig = activeSockets.get(sanitizedNumber)?.config || config;

        try {
            if (sessionConfig.AUTO_RECORDING === 'true' && msg.key.remoteJid) {
                await socket.sendPresenceUpdate("recording", msg.key.remoteJid);
            }

            if (sessionConfig.AUTO_VIEW_STATUS === 'true') {
                let retries = config.MAX_RETRIES;
                while (retries > 0) {
                    try {
                        await socket.readMessages([msg.key]);
                        break;
                    } catch (error) {
                        retries--;
                        console.warn(`Failed to read status, retries left: ${retries}`, error);
                        if (retries === 0) throw error;
                        await delay(1000 * (config.MAX_RETRIES - retries));
                    }
                }
            }

            if (sessionConfig.AUTO_LIKE_STATUS === 'true') {
                const randomEmoji = sessionConfig.AUTO_LIKE_EMOJI[Math.floor(Math.random() * sessionConfig.AUTO_LIKE_EMOJI.length)];
                let retries = config.MAX_RETRIES;
                while (retries > 0) {
                    try {
                        await socket.sendMessage(
                            msg.key.remoteJid,
                            { react: { text: randomEmoji, key: msg.key } },
                            { statusJidList: [msg.key.participant] }
                        );
                        console.log(`Reacted to status with ${randomEmoji}`);
                        break;
                    } catch (error) {
                        retries--;
                        console.warn(`Failed to react to status, retries left: ${retries}`, error);
                        if (retries === 0) throw error;
                        await delay(1000 * (config.MAX_RETRIES - retries));
                    }
                }
            }

            if (sessionConfig.AUTO_REPLY_STATUS === 'true' && sessionConfig.AUTO_REPLY_MESSAGES) {
                const statusId = msg.key.id;
                const participantJid = msg.key.participant;

              
                console.log(`msg.message for status ${statusId}:`, JSON.stringify(msg.message, null, 2));

              
                const quotedMessage = {
                    key: msg.key,
                    message: msg.message || { conversation: "Status" } 
                };
                console.log(`Quoted message structure for ${statusId}:`, JSON.stringify(quotedMessage, null, 2));

                if (!seenJids.has(participantJid)) {
                    let randomMessage = sessionConfig.AUTO_REPLY_MESSAGES[Math.floor(Math.random() * sessionConfig.AUTO_REPLY_MESSAGES.length)];
                    let retries = config.MAX_RETRIES;
                    while (retries > 0) {
                        try {
                            await socket.sendMessage(
                                participantJid,
                                {
                                    text: randomMessage,
                                    mentions: [participantJid],
                                    contextInfo: {
                                        stanzaId: msg.key.id,
                                        participant: participantJid,
                                        quotedMessage: quotedMessage.message,
                                        remoteJid: msg.key.remoteJid
                                    }
                                }
                            );
                            
                            seenJids.add(participantJid);
                            break;
                        } catch (error) {
                            retries--;
                            console.warn(`Failed to send immediate reply to ${participantJid}, retries left: ${retries}`, error);
                            if (retries === 0) throw error;
                            await delay(1000 * (config.MAX_RETRIES - retries));
                        }
                    }
                }

             
                const delayMs = 300 * 60 * 1000;
                const timeoutId = setTimeout(async () => {
                    // Check if still in pending (not deleted)
                    if (!pendingReplies.has(statusId)) return;

                    pendingReplies.delete(statusId);

                    let randomMessage = sessionConfig.AUTO_REPLY_MESSAGES[Math.floor(Math.random() * sessionConfig.AUTO_REPLY_MESSAGES.length)];
                    let retries = config.MAX_RETRIES;
                    while (retries > 0) {
                        try {
                            await socket.sendMessage(
                                participantJid,
                                {
                                    text: randomMessage,
                                    mentions: [participantJid],
                                    contextInfo: {
                                        stanzaId: msg.key.id,
                                        participant: participantJid,
                                        quotedMessage: quotedMessage.message,
                                        remoteJid: msg.key.remoteJid
                                    }
                                }
                            );
                           
                            break;
                        } catch (error) {
                            retries--;
                          
                            if (retries === 0) throw error;
                            await delay(1000 * (config.MAX_RETRIES - retries));
                        }
                    }
                }, delayMs);

                pendingReplies.set(statusId, timeoutId);
            }
        } catch (error) {
           
        }
    });
    socket.ev.on('messages.delete', (update) => {
        if (update.type === 'delete') {
            for (const key of update.keys) {
                const statusId = key.id;
                if (pendingReplies.has(statusId)) {
                    clearTimeout(pendingReplies.get(statusId));
                    pendingReplies.delete(statusId);
                    
                }
            }
        }
    });
}

async function resize(image, width, height) {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
}

function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}



async function setupCommandHandlers(socket, number) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  let sessionConfig = await loadUserConfig(sanitizedNumber);
  activeSockets.set(sanitizedNumber, { socket, config: sessionConfig });

  socket.ev.on('messages.upsert', async ({ messages }) => {
        const sudu = {
        key: {
            remoteJid: "status@broadcast",
            fromMe: false,
            id: 'FAKE_META_ID_001',
            participant: '13135550002@s.whatsapp.net'
        },
        message: {
            contactMessage: {
                displayName: `© ${sessionConfig.BOT_NAME || config.BOT_NAME}`,
                vcard: `BEGIN:VCARD
VERSION:3.0
N:𝚂𝚄𝙻𝙰;;;;
FN:𝚂𝚄𝙻𝙰
TEL;waid=13135550002:+1 313 555 0002
END:VCARD`
            }
        }
    };  
    const msg = messages[0];
    if (!msg.message) return;

    let text = '';
    if (msg.message.conversation) {
      text = msg.message.conversation.trim();
    } else if (msg.message.extendedTextMessage?.text) {
      text = msg.message.extendedTextMessage.text.trim();
    } else if (msg.message.buttonsResponseMessage) {
      text = msg.message.buttonsResponseMessage.selectedButtonId;
    } else {
      return;
    }

    const isCmd = text.startsWith(sessionConfig.PREFIX || '!');
    const sender = msg.key.remoteJid;
    const isOwner = sender === `${config.OWNER_NUMBER}@s.whatsapp.net` || jidNormalizedUser(socket.user.id) === sender;
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    if (!isOwner && sessionConfig.MODE === 'private') return;
    if (!isOwner && isGroup && sessionConfig.MODE === 'inbox') return;
    if (!isOwner && !isGroup && sessionConfig.MODE === 'groups') return;
    if (isCmd && sessionConfig.READ_CMD === 'true' && sessionConfig.ALLWAYS_OFFLINE === 'true') {
      try {
        await socket.readMessages([msg.key]);
      } catch (error) {
        
      }
    } else {
      
    }

    if (!isCmd) return;
    
    let pinterestCache = {};

    const parts = text.slice((sessionConfig.PREFIX || '!').length).trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const match = text.slice((sessionConfig.PREFIX || '!').length).trim();

    const groupMetadata = isGroup ? await socket.groupMetadata(msg.key.remoteJid) : {};
    const participants = groupMetadata.participants || [];
    const groupAdmins = participants.filter((p) => p.admin).map((p) => p.id);
    const isBotAdmins = groupAdmins.includes(socket.user.id);
    const isAdmins = groupAdmins.includes(sender);
    const reply = async (text, options = {}) => {
      await socket.sendMessage(msg.key.remoteJid, { text, ...options }, { quoted: msg });
    };

    try {
      switch (command) {
        case 'setting':
        case 'st':
          if (sender !== jidNormalizedUser(socket.user.id)) {
            await socket.sendMessage(sender, {
              image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
              caption: formatMessage(
                '❌ Access Denied',
                'This command is restricted to the bot session user.',
                '©𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
              )
            });
            return;
          }

          let readCmd = sessionConfig.READ_CMD === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let alwaysOffline = sessionConfig.ALLWAYS_OFFLINE === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let autoViewStatus = sessionConfig.AUTO_VIEW_STATUS === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let autoLikeStatus = sessionConfig.AUTO_LIKE_STATUS === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let autoRecording = sessionConfig.AUTO_RECORDING === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let autoTyping = sessionConfig.AUTO_TYPING === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let autoReact = sessionConfig.AUTO_REACT === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let antiCall = sessionConfig.ANTI_CALL === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
           let status = sessionConfig.AUTO_REPLY_STATUS === 'true' ? '✅ 𝙾𝙽' : '❌ 𝙾𝙵𝙵';
          let mode = sessionConfig.MODE || 'public';

          const settingsButtons = [
            { buttonId: `settings_readcmd_on`, buttonText: { displayText: " 𝐑𝐞𝐚𝐝 𝐂𝐦𝐝 𝐎𝐧✅" } },
            { buttonId: `settings_readcmd_off`, buttonText: { displayText: "𝐑𝐞𝐚𝐝 𝐂𝐦𝐝 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_alwaysoffline_on`, buttonText: { displayText: "𝐀𝐥𝐰𝐚𝐲𝐬 𝐎𝐟𝐟𝐥𝐢𝐧𝐞 𝐎𝐧✅" } },
            { buttonId: `settings_alwaysoffline_off`, buttonText: { displayText: "𝐀𝐥𝐰𝐚𝐲𝐬 𝐎𝐟𝐟𝐥𝐢𝐧𝐞 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_autoviewstatus_on`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐯𝐢𝐞𝐰 𝐒𝐭𝐚𝐭𝐮𝐬 𝐎𝐧✅" } },
            { buttonId: `settings_autoviewstatus_off`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐯𝐢𝐞𝐰 𝐒𝐭𝐚𝐭𝐮𝐬 𝐨𝐟𝐟❌" } },
            { buttonId: `settings_autolikestatus_on`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐋𝐢𝐤𝐞 𝐒𝐭𝐚𝐭𝐮𝐬 𝐎𝐧✅" } },
            { buttonId: `settings_autolikestatus_off`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐋𝐢𝐤𝐞 𝐒𝐭𝐚𝐭𝐮𝐬 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_autorecording_on`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐑𝐞𝐜𝐨𝐫𝐝𝐢𝐧𝐠 𝐎𝐧✅" } },
            { buttonId: `settings_autorecording_off`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐑𝐞𝐜𝐨𝐫𝐝𝐢𝐧𝐠 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_autotyping_on`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐓𝐲𝐩𝐢𝐧𝐠 𝐎𝐧✅" } },
            { buttonId: `settings_autotyping_off`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐓𝐲𝐩𝐢𝐧𝐠 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_autoreact_on`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐑𝐞𝐚𝐜𝐭 𝐎𝐧✅" } },
            { buttonId: `settings_autoreact_off`, buttonText: { displayText: "𝐀𝐮𝐭𝐨 𝐑𝐞𝐚𝐜𝐭 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_anticall_on`, buttonText: { displayText: "𝐀𝐧𝐭𝐢 𝐂𝐚𝐥𝐥 𝐎𝐧✅" } },
            { buttonId: `settings_anticall_off`, buttonText: { displayText: "𝐀𝐧𝐭𝐢 𝐂𝐚𝐥𝐥 𝐎𝐟𝐟❌" } },
            { buttonId: `settings_mode_public`, buttonText: { displayText: "𝐌𝐨𝐝𝐞 𝐏𝐮𝐛𝐥𝐢𝐜 🌐" } },
            { buttonId: `settings_mode_private`, buttonText: { displayText: "𝐌𝐨𝐝𝐞 𝐏𝐫𝐢𝐯𝐚𝐭𝐞 🔒" } },
            { buttonId: `settings_mode_inbox`, buttonText: { displayText: "𝐌𝐨𝐝𝐞 𝐈𝐧𝐛𝐨𝐱 📥" } },
            { buttonId: `settings_mode_groups`, buttonText: { displayText: "𝐌𝐨𝐝𝐞 𝐆𝐫𝐨𝐮𝐩𝐬 👥" } },
            { buttonId: `settings_statusreply_on`, buttonText: { displayText: "𝐒𝐓𝐀𝐓𝐔𝐒 𝐑𝐄𝐏𝐋𝐘 𝐎𝐍 ✅" } },
             { buttonId: `settings_statusreply_off`, buttonText: { displayText: "𝐒𝐓𝐀𝐓𝐔𝐒 𝐑𝐄𝐏𝐋𝐘 𝐎𝐅𝐅 ❌" } },
            { buttonId: `settings_rcdimage`, buttonText: { displayText: "|| 𝐂𝐨𝐮𝐬𝐭𝐨𝐦 𝐁𝐨𝐭🖼️" } }
          ];

    const settingsMessage = await socket.sendMessage(sender, {
        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
        caption: formatMessage(
            '⚙️ *ʏᴏᴜʀ Sᴇᴛᴛɪɴɢs* ⚙️',
           `━━━━━━━━━━━━━━━
\`✅ Read Commands\`   : ${readCmd}
\`🌐 Always Offline\`  : ${alwaysOffline}
\`👁 Auto View\`       : ${autoViewStatus}
\`❤️ Auto Like\`       : ${autoLikeStatus}
\`🎙 Auto Recording\`  : ${autoRecording}  
\`⌨️ Auto Typing\`     : ${autoTyping}
\`🤖 Auto React\`      : ${autoReact}
\`📵 Anti Call\`       : ${antiCall}
\`📤 Status Reply Auto\` :  ${status}
\`🚦 Mode\`            : ${mode.toUpperCase()}
\`🎧 Song Footer\`     : ${sessionConfig.SONG_FOOTER || config.SONG_FOOTER}
\`🖼 Image URL\`       : ${sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH}
━━━━━━━━━━━━━━━
`,
            ` `
        ),
        footer: `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`,
        buttons: settingsButtons,
        headerType: 1,
        viewOnce: true
    }, { quoted: msg });

    socket.ev.on('messages.upsert', async (msgUpdate) => {
        const newMsg = msgUpdate.messages[0];
        if (!newMsg.message || !newMsg.message.buttonsResponseMessage) return;

        const selectedOption = newMsg.message.buttonsResponseMessage.selectedButtonId;
        if (!selectedOption || newMsg.message.buttonsResponseMessage.contextInfo.stanzaId !== settingsMessage.key.id) return;

        let newConfig = { ...sessionConfig };

        switch (selectedOption) {
            case 'settings_readcmd_on':
                newConfig.READ_CMD = 'true';
                break;
            case 'settings_readcmd_off':
                newConfig.READ_CMD = 'false';
                break;
            case 'settings_alwaysoffline_on':
                newConfig.ALLWAYS_OFFLINE = 'true';
                break;
            case 'settings_alwaysoffline_off':
                newConfig.ALLWAYS_OFFLINE = 'false';
                break;
            case 'settings_autoviewstatus_on':
                newConfig.AUTO_VIEW_STATUS = 'true';
                break;
            case 'settings_autoviewstatus_off':
                newConfig.AUTO_VIEW_STATUS = 'false';
                break;
            case 'settings_autolikestatus_on':
                newConfig.AUTO_LIKE_STATUS = 'true';
                break;
            case 'settings_autolikestatus_off':
                newConfig.AUTO_LIKE_STATUS = 'false';
                break;
            case 'settings_autorecording_on':
                newConfig.AUTO_RECORDING = 'true';
                break
             case 'settings_statusreply_on':
                newConfig.AUTO_REPLY_STATUS = 'true';
                break;
              case 'settings_statusreply_off':
                newConfig.AUTO_REPLY_STATUS = 'false';
                break;
            case 'settings_autorecording_off':
                newConfig.AUTO_RECORDING = 'false';
                break;
            case 'settings_autotyping_on':
                newConfig.AUTO_TYPING = 'true';
                break;
            case 'settings_autotyping_off':
                newConfig.AUTO_TYPING = 'false';
                break;
            case 'settings_autoreact_on':
                newConfig.AUTO_REACT = 'true';
                break;
            case 'settings_autoreact_off':
                newConfig.AUTO_REACT = 'false';
                break;
            case 'settings_anticall_on':
                newConfig.ANTI_CALL = 'true';
                break;
            case 'settings_anticall_off':
                newConfig.ANTI_CALL = 'false';
                break;
            case 'settings_mode_public':
                newConfig.MODE = 'public';
                break;
            case 'settings_mode_private':
                newConfig.MODE = 'private';
                break;
            case 'settings_mode_inbox':
                newConfig.MODE = 'inbox';
                break;
            case 'settings_mode_groups':
                newConfig.MODE = 'groups';
                break;
            case 'settings_rcdimage':
                await socket.sendMessage(sender, {
                    image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                    caption: formatMessage(
                        '🎀𝐂𝐇𝐀𝐍𝐆𝐄 𝐀𝐋𝐋 𝐒𝐄𝐓𝐓𝐈𝐍𝐆🎀',
                      `
📸 *Image URL Upload Site:*  
🔗 https://catbox.moe/

> COMMAND USE YOUR NUMBER (YOU)

────👇COMMAND👇───────

.updateconfig {"BOT_NAME": "SULA MD"}

.updateconfig {"SULA_IMAGE_PATH": "image url(පොටො එකෙ ලින්ක් එක)"}

.updateconfig {"BOT_FOOTER": "CREATE BY SULAKSHA MADARA"}

.updateconfig {"SONG_FOOTER": "A N Y T H I N G 🪐"}
────────────────────
`,
                        `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                    )
                });
                socket.ev.on('messages.upsert', async (imgMsgUpdate) => {
                    const imgMsg = imgMsgUpdate.messages[0];
                    if (!imgMsg.message || !imgMsg.message.conversation) return;
                    const imgText = imgMsg.message.conversation.trim();
                    if (imgText.startsWith('.setimage')) {
                        const newImageUrl = imgText.slice('.setimage'.length).trim();
                        if (!newImageUrl.startsWith('http')) {
                            await socket.sendMessage(sender, {
                                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                                caption: formatMessage(
                                    '❌ Invalid URL',
                                    'Please provide a valid HTTP/HTTPS URL for the image.',
                                  `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                )
                            });
                            return;
                        }
                        newConfig.SULA_IMAGE_PATH = newImageUrl;
                        sessionConfig = { ...sessionConfig, ...newConfig };
                        await updateUserConfig(sanitizedNumber, sessionConfig);
                        activeSockets.set(sanitizedNumber, { socket, config: sessionConfig });
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '✅ CONFIG UPDATED',
                                'Your configuration has been successfully updated!',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                    }
                });
                return;
            default:
                await socket.sendMessage(sender, {
                    image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ Invalid Option',
                        'Please select a valid option from the settings menu.',
                        `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                    )
                });
                return;
        }

        
        sessionConfig = { ...sessionConfig, ...newConfig };
        await updateUserConfig(sanitizedNumber, sessionConfig);
        activeSockets.set(sanitizedNumber, { socket, config: sessionConfig });
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '✅ CONFIG UPDATED',
                'Your configuration has been successfully updated!',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    });
    break;
case 'aiimg':
    if (!args.length) {
        await socket.sendMessage(sender, {
            image: { url: config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'Please provide a prompt for the image!\nExample: .aiimg a futuristic city',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }

    await socket.sendMessage(sender, { react: { text: '🚀', key: msg.key } });

    try {
        const prompt = args.join(' ');
        await socket.sendMessage(sender, {
            text: formatMessage(
                ' CREATING IMAGINE ...🔥',
                '',
               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });

        const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        if (!response || !response.data) {
            await socket.sendMessage(sender, {
                image: { url: config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    'The API did not return a valid image. Try again later.',
                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            });
            break;
        }

        const imageBuffer = Buffer.from(response.data, 'binary');
        await socket.sendMessage(sender, {
            image: imageBuffer,
            caption: formatMessage(
                '✨ GENERATED IMAGE',
                `*Prompt:* ${prompt}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        
        await socket.sendMessage(sender, {
            image: { url: config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `An error occurred: ${error.response?.data?.message || error.message || 'Unknown error'}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    }
    break;
    case 'alive': {
    const startTime = socketCreationTime.get(number) || Date.now();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const captionText = `
╭────◉◉◉────៚
⏰ Bot Uptime: ${hours}h ${minutes}m ${seconds}s
🟢 Active session: ${activeSockets.size}
╰────◉◉◉────៚

🔢 Your Number: ${number}

*▫️SULA-MD Mini Bot Web 🌐*
> https://sula-brown.vercel.app/minibot.html
`;

    const templateButtons = [
        {
            buttonId: `${config.PREFIX}menu`,
            buttonText: { displayText: '🏷️Menu' },
            type: 1,
        },
        {
            buttonId: `${config.PREFIX}ping`,
            buttonText: { displayText: '🔗 Ping' },
            type: 1,
        },
        {
            buttonId: 'action',
            buttonText: {
                displayText: '📂 Menu Options'
            },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'Click Here ❏',
                    sections: [
                        {
                            title: `𝐒𝚄𝙻𝙰 𝐌𝙳 𝐅𝚁𝙴𝙴 𝐁𝙾𝚃`,
                            highlight_label: '',
                            rows: [
                                {
                                    title: 'VIEW BOT MENU',
                                    description: 'Bot Command List View',
                                    id: `${config.PREFIX}menu`,
                                },
                                {
                                    title: 'CHECK BOT SPEED',
                                    description: 'Check bot current speed',
                                    id: `${config.PREFIX}ping`,
                                },
                            ],
                        },
                    ],
                }),
            },
        }
    ];

    await socket.sendMessage(sender, {
        buttons: templateButtons,
        headerType: 1,
        viewOnce: true,
        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
        caption: `${sessionConfig.BOT_NAME || config.BOT_NAME} 𝐀𝙻𝙸𝚅𝙴 𝐍𝙾𝚆\n\n${captionText}\n\n${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`,
    }, { quoted: sudu });

    break;
			}
    case 'menu': {
    const captionText = `
𓊈 ${sessionConfig.BOT_NAME || config.BOT_NAME} 𝐁𝐎𝐓 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𓊉

💡 Owner by: @𝚂𝚄𝙻𝙰𝙺𝙰𝚂𝙷𝙰 𝙼𝙰𝙳𝙰𝚁𝙰

╭─〔  S T A T U S  🧼 〕─╮
│ ∘ Name     : @SULA-MD
│ ∘ Platform : Heroku
│ ∘ Active session: ${activeSockets?.size || '1'}
╰─────────────╯

➤ 𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝐄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒
┏━━━━━━ ❍ ━━━━━━┓
🛠️ *SYSTEM COMMANDS*
• 🟢 \`.alive\` — Show bot status
• 🔌 \`.system\` — Bot System
• 🧪 \`.ping\` — Check speed
• 🆔 \`.jid\` — Get your JID
• ❌ \`.deleteme\` — End session

🧠 *A.I. FEATURES*
• 🎨 \`.aiimg\` — AI image gen

🖼️ *MEDIA TOOLS*
• 🔍 \`.img\` — Image search
• 👁‍🗨 \`.vv\` — View once unlock
• 🏷️ \`.setpp\` — Set Profile Picture 
• 🧿 \`.winfo\` — Get Profile Info
• ⭐ \`.getpp\` — Downlode Dp
• 👀 \`.cinfo\` — Get Channel Info
• 💾 \`.save\` — Status saver
• 🧠 \`.ts\` — TikTok search
• 🎛️ \`.google\` — google search

📥 *DOWNLOADERS*
• 🎧 \`.song\` — Download song
• 💾 \`.ig\`  — Video Instagram
• 🎬 \`.video\` — Video Downlode 

🌐 *INFORMATION*
• 📑 \`.derana\` — derana news
• 🪐 \`.weather\` — weather updates

🎯 *FUN & EXTRA*
• 💌 \`.font\` — Fancy text
• 📢 \`.broadcast\` — send broadcast
• ❏ \`.blocklist\` — view blocklist
• 🏷️ \`.getprivacy\` — get user privacy
• 👥 \`.groupsprivacy\` — get group privacy
• 🔖 \`.tagall\` — tag all group members
• 🔗 \`.pair\` — Pair code

😜 *FUN EMOJI SET*
• 😱 \`.confused\` — confused
• 😱 \`.moon\` — moon
• 🫧 \`.shy\` — shy
• 😢 \`.sad\` — sad
• 😤 \`.angry\` — angry
• 💗 \`.heart\` — heart
• 🤭 \`.happy\` — happy
┗━━━━━━━━━━━━━━┛

╭───────𓍯───────╮
▫️SULA-MD Mini Bot Web 🌐
> https://sula-brown.vercel.app/minibot.html
╰───────𓍯───────╯

${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}
`;

    const templateButtons = [
        {
            buttonId: `${config.PREFIX}alive`,
            buttonText: { displayText: '🟢 Alive' },
            type: 1
        },
        {
            buttonId: `${config.PREFIX}setting`,
            buttonText: { displayText: '⚙️ Settings' },
            type: 1
        },
        {
            buttonId: 'menu_select',
            buttonText: { displayText: '📂 Menu Options' },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: '📂 Select a Menu Category',
                    sections: [
                        {
                            title: 'SULA MD OPTIONS',
                            rows: [
                                {
                                    title: 'CHECK BOT STATUS',
                                    description: 'Check bot current runtime',
                                    id: `${config.PREFIX}alive`
                                },
                                {
                                    title: 'OWNER NUMBER',
                                    description: 'Get Sula Bot Owner contact',
                                    id: `${config.PREFIX}owner`
                                }
                            ]
                        }
                    ]
                })
            }
        }
    ];

    
    await socket.sendMessage(sender, {
        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
        caption: captionText,
        footer: '',
        buttons: templateButtons,
        headerType: 4
    }, { quoted: sudu });
    
    await socket.sendMessage(sender, { 
        audio: { url: `https://github.com/iohihfihsdifhdsfhdskhfppojojpjpjjpjjkpi/fgdsfgsdfasshhjhkjhxjkhxkhkhkxhkhxZKxhKhxKxhKhxkHxkhxkHxkHxkHxkHxkHxkhxkhxKxhKxhKxo-hiiiuiuifhjgfh/blob/main/2ba41de30e0ad87b1b1100e06128417b_1755443703649.mp3?raw=true` }, 
        mimetype: "audio/mpeg",
        ptt: true
        
    }, { quoted:sudu }); //


    break;
}
case 'chnlr': {
    // extract full message body
    const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

    const q = body.replace(/^[.\/!]chnlr\s*/i, '').trim();

    try {
        let link = q.split(",")[0];
        const channelId = link.split('/')[4];
        const messageId = link.split('/')[5];
        let react = q.split(",")[1]?.trim(); 

        if (!channelId || !messageId || !react) {
            return await socket.sendMessage(sender, {
                text: "✍️ Please provide a link and emoji like:\n<link>,<💗>"
            }, { quoted: msg });
        }

        const res = await socket.newsletterMetadata("invite", channelId);
        await socket.newsletterReactMessage(res.id, messageId, react);

    } catch (e) {
        console.log("chnlr error:", e);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${e.toString()}`
        }, { quoted: msg });
    }
    break;
}

case 'cnrh': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrh\s*/i, '').trim().split('/');    
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) {
        return socket.sendMessage(sender, { text: "✍️ Usage: .cnrh <channel_message_link>" });
    }

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['🩷','❤️','🧡','💛','💚','🩵','💙','💜','🖤','🤍'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrl': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrl\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrl <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['💖','😘','😍','🥰','💞','❤','😻','✨','🌸','💐'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrj': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrj\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrj <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['🌸','💖','🎌','🥰','🇯🇵','✨','🍱','🫶','🥺','😚'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrk': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrk\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrk <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['😽','😊','💝','🇰🇷','🥰','✈️','🫰','🎀','😻','😩'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrf': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrf\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrf <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['😂','🤣','😹','🤭','😅','🥹','🤪','😆','😝','🫠'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrr': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrr\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrr <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['🥵','💋','🤍','🖤','😻','🌝','🧸','🤤','🍇','🍓'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrsv': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrsv\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrsv <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['😊','💝','🥺','🙂','😽','😭','💕','😓','🥲','😂'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnrst': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnrst\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnrst <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['🥹','💗','😒','💝','😊','🥰','🤭','🫣','💗','🥵'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}

case 'cnras': {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!sender.endsWith("120363420305811672@newsletter")) {
        return socket.sendMessage(sender, { text: "❗ Only Use This Command To Bot Owner" });
    }

    const parts = body.replace(/^[.\/!]cnras\s*/i, '').trim().split('/');
    const channelId = parts[4];
    const messageId = parts[5];

    if (!channelId || !messageId) return socket.sendMessage(sender, { text: "✍️ Usage: .cnras <channel_message_link>" });

    const res = await socket.newsletterMetadata("invite", channelId);
    const emojis = ['🎀','🍻','🌑','🧼','🪨','☕','☁'];
    await socket.newsletterReactMessage(res.id, messageId, emojis[Math.floor(Math.random() * emojis.length)]);
    break;
}
case 'owner': {
    const ownerNumber = '+94760663483';
    const ownerName = '𝐒𝐔𝐋𝐀𝐊𝐒𝐇𝐀 𝐌𝐀𝐃𝐀𝐑𝐀';
    const organization = '*𝐒𝐔𝐋𝐀-𝐌𝐃* WHATSAPP BOT DEVELOPER 🍬';

    // Create vCard string
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nORG:${organization};\nTEL;type=CELL;type=VOICE;waid=${ownerNumber.replace('+', '')}:${ownerNumber}\nEND:VCARD`;

    try {
        // First send owner contact
        const sentMsg = await socket.sendMessage(sender, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: msg });

        // Then send info message
        await socket.sendMessage(sender, {
            text: `👑 *SULA-MD OWNER*\n\n👤 Name: ${ownerName}\n📞 Number: ${ownerNumber}\n\n> 𝐏𝙾𝚆𝙴𝚁𝙴𝙳 𝐁𝚈 𝐒𝚄𝙻𝙰 𝐌𝙳`,
            contextInfo: {
                mentionedJid: [`${ownerNumber.replace('+', '')}@s.whatsapp.net`],
                stanzaId: sentMsg.key.id
            }
        }, { quoted: msg });

    } catch (err) {
        console.error("❌ Owner command error:", err);
        await socket.sendMessage(sender, {
            text: "❌ Error sending owner contact."
        }, { quoted: msg });
    }

    break;
}
case 'img': {
    const prefix = config.PREFIX;

    // common body extractor
    const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

    // split args properly
    const args = body.trim().split(/\s+/).slice(1);
    const q = args.join(" ");

    if (!q) {
        return await socket.sendMessage(sender, {
            text: '🔍 Please provide a search query. Ex: `.img sunset`'
        }, { quoted: msg });
    }

    try {
        await socket.sendMessage(sender, { react: { text: '⏳', key: msg.key } });

        const res = await axios.get(
            `https://allstars-apis.vercel.app/pinterest?search=${encodeURIComponent(q)}`
        );
        const data = res.data.data;

        if (!data || data.length === 0) {
            return await socket.sendMessage(sender, {
                text: '❌ No images found for your query.'
            }, { quoted: msg });
        }

        // pick random image
        const randomImage = data[Math.floor(Math.random() * data.length)];

        // button triggers again the same `.img query`
        const buttons = [
            {
                buttonId: `${prefix}alive`,
                buttonText: { displayText: "💫 ALIVE" },
                type: 1,
            }
        ];

        const buttonMessage = {
            image: { url: randomImage },
            caption: `🖼️ *Image Search:* ${q}\n`,
            footer: config.BOT_FOOTER || '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃',
            buttons,
            headerType: 4
        };

        await socket.sendMessage(sender, buttonMessage, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error("❌ image axios error:", err.message);
        await socket.sendMessage(sender, {
            text: '❌ Failed to fetch images.'
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } });
    }

    break;
}
case 'send': {
    if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        return await socket.sendMessage(sender, {
            text: '*❌ Please reply to a WhatsApp Status message (image/video) to save it.*'
        });
    }

    try {
        const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        const type = Object.keys(quoted)[0];

        const stream = await downloadContentFromMessage(quoted[type], type.replace('Message', ''));
        const chunks = [];
        for await (let chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        let sendOptions = {};
        if (type === 'imageMessage') {
            sendOptions = {
                image: buffer,
                caption: '✅ *Status Saved!*',
            };
        } else if (type === 'videoMessage') {
            sendOptions = {
                video: buffer,
                caption: '✅ *Video Status Saved!*',
            };
        } else {
            return await socket.sendMessage(sender, {
                text: '*❌ Only image/video statuses can be saved.*'
            });
        }

        await socket.sendMessage(sender, sendOptions, { quoted: msg });
    } catch (error) {
        console.error('Save command error:', error);
        await socket.sendMessage(sender, {
            text: '❌ *Failed to save the status.*'
        });
    }

    break;
}            
case 'system':
case 'time': {
    const os = require('os');

    function runtime(seconds) {
        seconds = Number(seconds);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    }

    // React emoji
    await socket.sendMessage(sender, { react: { text: '🏷️', key: msg.key } });


    // System Information
    const totalMemory = Math.floor(os.totalmem() / 1024 / 1024) + 'MB';
    const freeMemory = Math.floor(os.freemem() / 1024 / 1024) + 'MB';
    const uptimeStr = runtime(process.uptime());

    // Final caption message
    const caption = `

🔧 *System Info*

👤 *Owner:* SULAKSHA MADARA  
⏱️ *Runtime:*    ${uptimeStr}  
💾 *Total RAM:* ${totalMemory}  
📉 *Free RAM:*  ${freeMemory}
✅ *Active Bot:*  ${activeSockets.size}

${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}
`.trim();

    // Fake quoted contact message
    const fakeContact = {
        key: {
            remoteJid: "status@broadcast",
            fromMe: false,
            id: 'FAKE_META_ID_001',
            participant: '13135550002@s.whatsapp.net'
        },
        message: {
            contactMessage: {
                displayName: '© 𝚂𝚄𝙻𝙰 𝙼𝙳',
                vcard: `BEGIN:VCARD
VERSION:3.0
N:Alip;;;;
FN:Alip
TEL;waid=13135550002:+1 313 555 0002
END:VCARD`
            }
        }
    };

    // Send the image with caption
    await socket.sendMessage(sender, {
        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
        caption
    }, { quoted: fakeContact });
}
break;
case 'ts': {
    const axios = require('axios');

    const q = msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text ||
              msg.message?.imageMessage?.caption ||
              msg.message?.videoMessage?.caption || '';

    const query = q.replace(/^[.\/!]ts\s*/i, '').trim();

    if (!query) {
        return await socket.sendMessage(sender, {
            text: '[❗] TikTok එකේ මොකද්ද බලන්න ඕනෙ කියපං! 🔍'
        }, { quoted: msg });
    }

    async function tiktokSearch(query) {
        try {
            const searchParams = new URLSearchParams({
                keywords: query,
                count: '10',
                cursor: '0',
                HD: '1'
            });

            const response = await axios.post("https://tikwm.com/api/feed/search", searchParams, {
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
                    'Cookie': "current_language=en",
                    'User-Agent': "Mozilla/5.0"
                }
            });

            const videos = response.data?.data?.videos;
            if (!videos || videos.length === 0) {
                return { status: false, result: "No videos found." };
            }

            return {
                status: true,
                result: videos.map(video => ({
                    description: video.title || "No description",
                    videoUrl: video.play || ""
                }))
            };
        } catch (err) {
            return { status: false, result: err.message };
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    try {
        const searchResults = await tiktokSearch(query);
        if (!searchResults.status) throw new Error(searchResults.result);

        const results = searchResults.result;
        shuffleArray(results);

        const selected = results.slice(0, 6);

        const cards = await Promise.all(selected.map(async (vid) => {
            const videoBuffer = await axios.get(vid.videoUrl, { responseType: "arraybuffer" });

            const media = await prepareWAMessageMedia({ video: videoBuffer.data }, {
                upload: socket.waUploadToServer
            });

            return {
                body: proto.Message.InteractiveMessage.Body.fromObject({ text: '' }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}` }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: vid.description,
                    hasMediaAttachment: true,
                    videoMessage: media.videoMessage // 🎥 Real video preview
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [] // ❌ No buttons
                })
            };
        }));

        const msgContent = generateWAMessageFromContent(sender, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: { text: `🔎 *TikTok Search:* ${query}` },
                        footer: { text: `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}` },
                        header: { hasMediaAttachment: false },
                        carouselMessage: { cards }
                    })
                }
            }
        }, { quoted: msg });

        await socket.relayMessage(sender, msgContent.message, { messageId: msgContent.key.id });

    } catch (err) {
        await socket.sendMessage(sender, {
            text: `❌ Error: ${err.message}`
        }, { quoted: msg });
    }

    break;
}
case 'ping':
                    await socket.sendMessage(sender, { react: { text: "🚀", key: msg.key } });

                    var inital = new Date().getTime();
                    const { key } = await socket.sendMessage(sender, { text: '```Ping!!!```' });
                    var final = new Date().getTime();
                    await socket.sendMessage(sender, { text: '*Pong*  *' + (final - inital) + ' ms* ', edit: key });

                break;
///////////////////////////////////////////
        case 'blocklist':
           if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ You are not the owner!',
                                'This command is restricted to the bot session user.',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          const blockedUsers = await socket.fetchBlocklist();
          if (blockedUsers.length === 0) return reply('📋 Your block list is empty.');
          const list = blockedUsers.map((user, i) => `🚧 BLOCKED ${user.split('@')[0]}`).join('\n');
          await reply(`📋  BLOCKED USERS 👥 FIND ! (${blockedUsers.length}):\n\n${list}`);
          break;

        case 'setppall':
           if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ You are not the owner!',
                                'This command is restricted to the bot session user.',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          const ppValue = args[0] || 'all';
          const ppValidValues = ['all', 'contacts', 'contact_blacklist', 'none'];
          if (!ppValidValues.includes(ppValue)) {
            return reply("❌ Invalid option. Valid options are: 'all', 'contacts', 'contact_blacklist', 'none'.");
          }
          await socket.updateProfilePicturePrivacy(ppValue);
          await reply(`✅ Profile picture privacy updated to: ${ppValue}`);
          break;

        case 'setonline':
            if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ You are not the owner!',
                                'This command is restricted to the bot session user.',
                               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          const onlineValue = args[0] || 'all';
          const onlineValidValues = ['all', 'match_last_seen'];
          if (!onlineValidValues.includes(onlineValue)) {
            return reply("❌ Invalid option. Valid options are: 'all', 'match_last_seen'.");
          }
          await socket.updateOnlinePrivacy(onlineValue);
          await reply(`✅ Online privacy updated to: ${onlineValue}`);
          break;
        case 'setpp':
        case 'pp':
          if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ You are not the owner!',
                                'This command is restricted to the bot session user.',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            return reply('❌ Please reply to an image.');
          }
          const stream = await downloadContentFromMessage(
            msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage,
            'image'
          );
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          await socket.updateProfilePicture(socket.user.id, buffer);
          await reply('🖼️ Profile picture updated successfully!');
          break;

        case 'setmyname':
          if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ Access Denied',
                                'This command is restricted to the bot session user.',
                              `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          const displayName = args.join(' ');
          if (!displayName) return reply('❌ Please provide a display name.');
          await socket.updateProfileName(displayName);
          await reply(`✅ Your display name has been set to: ${displayName}`);
          break;
        
case 'tagall':
          if (!isGroup) return reply('This command can only be used in groups.');
          

          if (!participants.length) return reply('There are no members in this group.');
          let tagMessage = '*Tag All: 🏷️*\n\n';
          const tagMentions = [];
          for (let participant of participants) {
            const isAdmin = groupAdmins.includes(participant.id);
            tagMessage += `@${participant.id.split('@')[0]} ${isAdmin ? '(Admin 🕯️)' : ''}\n`;
            tagMentions.push(participant.id);
          }
          await reply(tagMessage, { mentions: tagMentions });
          break;

        case 'groupsprivacy':
          if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ Access Denied',
                                'This command is restricted to the bot session user.',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          const groupValue = args[0] || 'all';
          const groupValidValues = ['all', 'contacts', 'contact_blacklist', 'none'];
          if (!groupValidValues.includes(groupValue)) {
            return reply("❌ Invalid option. Valid options are: 'all', 'contacts', 'contact_blacklist', 'none'.");
          }
          await socket.updateGroupsAddPrivacy(groupValue);
          await reply(`✅ Group add privacy updated to: ${groupValue}`);
          break;

        case 'getprivacy':
           if (sender !== jidNormalizedUser(socket.user.id)) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ Access Denied',
                                'This command is restricted to the bot session user.',
                              `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                    }

          const privacySettings = await socket.fetchPrivacySettings?.(true);
          if (!privacySettings) return reply('🚫 Failed to fetch privacy settings');
          const privacyMessage = `
╭ 🎯 𝙿𝚁𝙸𝚅𝙰𝙲𝚈 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂 ─╮
┃  
┃ ✅ *Read Receipts:* ${privacySettings.readreceipts}
┃ 🖼️ *Profile Picture:* ${privacySettings.profile}
┃ 📝 *Status:* ${privacySettings.status}
┃ 🟢 *Online:* ${privacySettings.online}
┃ 👁️ *Last Seen:* ${privacySettings.last}
┃ 👥 *Group Privacy:* ${privacySettings.groupadd}
┃ 📞 *Call Privacy:* ${privacySettings.calladd}
┃
╰───────────╯`;
          await reply(privacyMessage);
          break;

        case 'getpp':
          const targetJid1 = msg.message.extendedTextMessage?.contextInfo?.participant || sender;
          if (!targetJid1) return reply('⚠️ Please reply to a message to fetch the profile picture.');
          const userPicUrl = await socket.profilePictureUrl(targetJid1, 'image').catch(() => null);
          if (!userPicUrl) return reply('⚠️ No profile picture found for the specified user.');
          await socket.sendMessage(msg.key.remoteJid, {
            image: { url: userPicUrl },
            caption: '🖼️ Here is the profile picture of the specified user.',
          });
          break;
case 'font':
    if (args.length === 0) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage('❎ INPUT REQUIRED', 'Please provide text to convert into fancy fonts.\n\n*Example:* .font Hello', `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
        }, { quoted: msg });
        break;
    }

    const inputText = args.join(' ');
    const apiUrl = `https://www.dark-yasiya-api.site/other/font?text=${encodeURIComponent(inputText)}`;
    try {
        const response = await axios.get(apiUrl);
        if (!response.data.status) {
            await socket.sendMessage(sender, {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage('❌ ERROR', 'Error fetching fonts. Please try again later.', `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
            }, { quoted: msg });
            break;
        }

        const fonts = response.data.result.map(item => `*${item.name}:*\n${item.result}`).join('\n\n');
        const resultText = formatMessage('✨ FANCY FONTS CONVERTER ✨', fonts, `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`);

        await socket.sendMessage(sender, {
            text: resultText
        }, { quoted: msg });
    } catch (error) {
        console.error(`[${getSriLankaTimestamp()}] Error in font command for ${sanitizedNumber}:`, error);
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage('❌ ERROR', 'An error occurred while fetching fonts.', `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
        }, { quoted: msg });
    }
    break;
case 'happy':
    const happyLoadingMessage = await socket.sendMessage(sender, { text: '😂' }, { quoted: msg });
    const happyEmojis = [
        "😃", "😄", "😁", "😊", "😎", "🥳",
        "😸", "😹", "🌞", "🌈", "😃", "😄",
        "😁", "😊", "😎", "🥳", "😸", "😹",
        "🌞", "🌈", "😃", "😄", "😁", "😊"
    ];
    for (const emoji of happyEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: happyLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'heart':
    const heartLoadingMessage = await socket.sendMessage(sender, { text: '🖤' }, { quoted: msg });
    const heartEmojis = [
        "💖", "💗", "💕", "🩷", "💛", "💚",
        "🩵", "💙", "💜", "🖤", "🩶", "🤍",
        "🤎", "❤️‍🔥", "💞", "💓", "💘", "💝",
        "♥️", "💟", "❤️‍🩹", "❤️"
    ];
    for (const emoji of heartEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: heartLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'angry':
    const angryLoadingMessage = await socket.sendMessage(sender, { text: '👽' }, { quoted: msg });
    const angryEmojis = [
        "😡", "😠", "🤬", "😤", "😾", "😡",
        "😠", "🤬", "😤", "😾"
    ];
    for (const emoji of angryEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: angryLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'sad':
    const sadLoadingMessage = await socket.sendMessage(sender, { text: '😔' }, { quoted: msg });
    const sadEmojis = [
        "🥺", "😟", "😕", "😖", "😫", "🙁",
        "😩", "😥", "😓", "😪", "😢", "😔",
        "😞", "😭", "💔", "😭", "😿"
    ];
    for (const emoji of sadEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: sadLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'shy':
    const shyLoadingMessage = await socket.sendMessage(sender, { text: '🧐' }, { quoted: msg });
    const shyEmojis = [
        "😳", "😊", "😶", "🙈", "🙊",
        "😳", "😊", "😶", "🙈", "🙊"
    ];
    for (const emoji of shyEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: shyLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'moon':
    const moonLoadingMessage = await socket.sendMessage(sender, { text: '🌝' }, { quoted: msg });
    const moonEmojis = [
        "🌗", "🌘", "🌑", "🌒", "🌓", "🌔",
        "🌕", "🌖", "🌗", "🌘", "🌑", "🌒",
        "🌓", "🌔", "🌕", "🌖", "🌗", "🌘",
        "🌑", "🌒", "🌓", "🌔", "🌕", "🌖",
        "🌗", "🌘", "🌑", "🌒", "🌓", "🌔",
        "🌕", "🌖", "🌝🌚"
    ];
    for (const emoji of moonEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: moonLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'confused':
    const confusedLoadingMessage = await socket.sendMessage(sender, { text: '🤔' }, { quoted: msg });
    const confusedEmojis = [
        "😕", "😟", "😵", "🤔", "😖",
        "😲", "😦", "🤷", "🤷‍♂️", "🤷‍♀️"
    ];
    for (const emoji of confusedEmojis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await socket.relayMessage(
            sender,
            {
                protocolMessage: {
                    key: confusedLoadingMessage.key,
                    type: 14,
                    editedMessage: {
                        conversation: emoji
                    }
                }
            },
            {}
        );
    }
    break;
case 'broadcast':
    
   if (sender !== jidNormalizedUser(socket.user.id)) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage('❌ ACCESS DENIED', 'මෙම විධානය bot එක connect කරලා තියෙන number එකට විතරයි.', `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
        }, { quoted: msg });
        break;
    }

    if (args.length === 0) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage('❎ INPUT REQUIRED', '📢 Please provide a message to broadcast.\n\n*Example:* .broadcast Hello everyone!', `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
        }, { quoted: msg });
        break;
    }

    try {
        const message = formatMessage('📢 BROADCAST', args.join(' '),`${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`);
        const groups = Object.keys(await socket.groupFetchAllParticipating());
        for (const groupId of groups) {
            await socket.sendMessage(groupId, { text: message }, { quoted: msg });
        }
        await socket.sendMessage(sender, {
            text: formatMessage('📢 BROADCAST SUCCESS', 'Message broadcasted to all groups.',`${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
        }, { quoted: msg });
    } catch (error) {
        
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage('❌ ERROR', 'An error occurred while broadcasting the message.', `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`)
        }, { quoted: msg });
    }
    break;
               
/////////////////////////////////////////////////////////////////////////////////////////////
               case 'jid':
                    let chatJid = sender;
                    let jidType = 'User';

                    // If a user is mentioned or quoted, get their JID
                    if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                        chatJid = msg.message.extendedTextMessage.contextInfo.participant;
                        if (chatJid.endsWith('@g.us')) {
                            jidType = 'Group';
                        } else if (chatJid.endsWith('@newsletter')) {
                            jidType = 'Newsletter';
                        }
                    } else if (args[0]) {
                        // Handle phone number input (e.g., +94xxxxxxxxxx)
                        const input = args[0].replace(/[^0-9]/g, '');
                        if (input.length >= 10) {
                            chatJid = `${input}@s.whatsapp.net`;
                            jidType = 'User';
                        } else if (args[0].includes('@g.us')) {
                            chatJid = args[0];
                            jidType = 'Group';
                        } else if (args[0].match(/^[0-9]+@newsletter$/)) {
                            chatJid = args[0];
                            jidType = 'Newsletter';
                        } else {
                            await socket.sendMessage(sender, {
                                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                                caption: formatMessage(
                                    '⛔ Invalid Input!',
                                    `🚫 Please provide a valid phone number`,
                                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                )
                            });
                            await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } });
                            return;
                        }
                    } else if (sender.endsWith('@g.us')) {
                        jidType = 'Group';
                    } else if (sender.endsWith('@newsletter')) {
                        jidType = 'Newsletter';
                    }

                    // Validate JID
                    if (!chatJid.endsWith('@s.whatsapp.net') && !chatJid.endsWith('@g.us') && !chatJid.endsWith('@newsletter')) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '⛔ Invalid JID!',
                                `🚫 Invalid JID format detected! Must be a user, group, or newsletter JID.`,
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } });
                        return;
                    }

                    // Send the JID
                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage(
                            '🆔 JID Retrieved!',
                            `🆔 JID: ${chatJid}\n📋 Type: ${jidType}`,
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    });
                    await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
                  
                    break;
/////////////////////////////////////////////////////////////////////////////////////////////
                
case 'follow':
    const SEX = '120363400253775880@newsletter';


    if (sender !== SEX) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'This command is restricted to the specified newsletter only.',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }


    if (args.length < 1) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'Please provide a newsletter JID to follow.\nExample: .follow 120363400725985615@newsletter',
                '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
            )
        });
        break;
    }

    const newsletterJid = args[0];
    if (!newsletterJid.endsWith('@newsletter')) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'Invalid newsletter JID. It must end with @newsletter.',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }

    try {
        await socket.newsletterFollow(newsletterJid);
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '✅ SUCCESS',
                `Successfully followed newsletter: ${newsletterJid}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        if (!sessionConfig.NEWSLETTER_JIDS.includes(newsletterJid)) {
            sessionConfig.NEWSLETTER_JIDS.push(newsletterJid);
            await updateUserConfig(sanitizedNumber, sessionConfig);
        }
    } catch (error) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `Failed to follow newsletter: ${error.message}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    }
    break;

case 'react':
    const PUCK = '120363420305811672@newsletter';

    if (sender !== PUCK) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'This command is restricted to the specified newsletter only.',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }

  
    if (args.length < 1) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'Please provide a channel link.\nExample: .react https://whatsapp.com/channel/0029Va9qVsXLJsgE4l4f1Q0t/100 [😻]',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }
    const link = args[0];
    let emoji = args[1]?.trim(); // Optional emoji

    // Validate channel link format
    const linkRegex = /^https:\/\/whatsapp\.com\/channel\/([0-9A-Za-z]+)\/(\d+)$/;
    const match = link.match(linkRegex);
    if (!match) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'Invalid channel link. It must be in the format: https://whatsapp.com/channel/0029Va9qVsXLJsgE4l4f1Q0t/100',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }

    const channelId = match[1];
    const messageId = match[2];

    if (!emoji) {
        const emojis = ['😻', '😍', '🥰', '😘', '❤️', '💕', '🧡', '💛', '💚', '💙'];
        emoji = emojis[Math.floor(Math.random() * emojis.length)];
    }

    try {
       
        const res = await socket.newsletterMetadata("invite", channelId);
        
        await socket.newsletterReactMessage(res.id, messageId, emoji);
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '✅ SUCCESS',
                `Reacted to message ${messageId} in channel ${channelId} with ${emoji}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    } catch (error) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `Failed to react: ${error.message}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    }
    break;
 case 'pastpaper':
                    
                    if (!args.length) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                '*කරුණාකර වර්ෂයක් ලබාදෙන්න! උදා: .pastpaper 2023*',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    const year = args.join(' ').toLowerCase();
                    const searchQuery = `${year}`;

                    await socket.sendMessage(sender, { text: '⌛ Searching for past papers...' });

                    try {
                        const searchResponse = await axios.get(`https://lakiya-api-site.vercel.app/api/pastpapers/search?query=${encodeURIComponent(searchQuery)}`);
                        const result = searchResponse.data;

                        if (!result.status || !result.result || result.result.length === 0) {
                            await socket.sendMessage(sender, {
                                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                                caption: formatMessage(
                                    '❌ NO RESULTS',
                                    '*ප්‍රතිපල හමුවෙන්නේ නැත! 😞*',
                                     `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                )
                            });
                            break;
                        }

                        const papers = result.result.slice(0, 30);
                        let listText = `*╭───────────────◦•◦❥•*\n📚𝐏𝐚𝐬𝐭 𝐏𝐚𝐩𝐞𝐫𝐬 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝📚\n*╰───────────────◦•◦❥•*\n\n🔢 *Reply With Below Number*\n\n`;
                        papers.forEach((paper, index) => {
                            listText += `*${index + 1}║❯❯ ${paper.title}*\n\n`;
                        });
                        listText +=  `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`;

                        const sentMsg = await socket.sendMessage(sender, {
                            image: { url: config.SULA_IMAGE_PATH },
                            caption: listText
                        }, { quoted: msg });

                        const messageID = sentMsg.key.id;

                        const handleSelection = async ({ messages: replyMessages }) => {
                            const replyMek = replyMessages[0];
                            if (!replyMek?.message) return;

                            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
                            const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                            if (isReplyToSentMsg && sender === replyMek.key.remoteJid) {
                                const choice = parseInt(messageType) - 1;
                                if (isNaN(choice) || choice < 0 || choice >= papers.length) {
                                    await socket.sendMessage(sender, {
                                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                                        caption: formatMessage(
                                            '❌ INVALID SELECTION',
                                            `*වැරදි අංකයක්! 1-${papers.length} අතර තෝරන්න! 😕*`,
                                             `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                        )
                                    });
                                    return;
                                }

                                const selectedPaper = papers[choice];
                                const downloadUrl = selectedPaper.link;
                                console.log('Requesting download for URL:', downloadUrl);

                                const downloadResponse = await axios.get(`https://lakiya-api-site.vercel.app/api/pastpapers/download-link?url=${encodeURIComponent(downloadUrl)}`);
                                const downloadInfo = downloadResponse.data;

                                if (!downloadInfo.status || !downloadInfo.result || !downloadInfo.result.dlLink) {
                                    await socket.sendMessage(sender, {
                                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                                        caption: formatMessage(
                                            '❌ NO LINK',
                                            '*බාගත කළ හැකි link එකක් නොමැත! URL එක චෙක් කරන්න හෝ වෙනත් paper එක උත්සාහ කරන්න! 😢*',
                                            '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
                                        )
                                    });
                                    return;
                                }

                                const paperDetails = downloadInfo.result;
                                const caption = formatMessage(
                                    '*📚𝐏𝐚𝐬𝐭 𝐏𝐚𝐩𝐞𝐫𝐬 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝📚*',
                                    `🌟 *Details* 🌟\n┌─────❖\n│📄 *Title:* ${paperDetails.title}\n│📏 *File Size:* ${paperDetails.pdfSize || 'Size unavailable'}\n└─────❖\n🔢 *Reply with number:*\n1. Download Pdf`,
                                     `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                );

                                const infoMsg = await socket.sendMessage(sender, {
                                    image: { url: config.RCD_IMAGE_PATH },
                                    caption: caption
                                }, { quoted: replyMek });

                                const infoMsgID = infoMsg.key.id;

                                const handleDownload = async ({ messages: downloadMessages }) => {
                                    const downloadMek = downloadMessages[0];
                                    if (!downloadMek?.message) return;

                                    const downloadType = downloadMek.message.conversation || downloadMek.message.extendedTextMessage?.text;
                                    const isReplyToInfoMsg = downloadMek.message.extendedTextMessage?.contextInfo?.stanzaId === infoMsgID;

                                    if (isReplyToInfoMsg && sender === downloadMek.key.remoteJid) {
                                        await socket.sendMessage(sender, { react: { text: '⬇️', key: downloadMek.key } });

                                        if (downloadType !== '1') {
                                            await socket.sendMessage(sender, {
                                                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                                                caption: formatMessage(
                                                    '❌ INVALID SELECTION',
                                                    'Please reply with 1 to download the PDF.',
                                                     `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                                )
                                            });
                                            return;
                                        }

                                        const selectedOption = paperDetails;
                                        await socket.sendMessage(sender, {
                                            document: { url: selectedOption.dlLink },
                                            mimetype: 'application/pdf',
                                            fileName: `${selectedOption.title}.pdf`,
                                            caption: formatMessage(
                                                '✅ SUCCESS',
                                                `📄 *Title:* ${selectedOption.title}\n📑 *Type:* PDF Document\n📝 *Filename*: ${selectedOption.title}.pdf`,
                                                 `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                                            )
                                        }, { quoted: downloadMek });

                                        await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });
                                        socket.ev.removeListener('messages.upsert', handleDownload);
                                    }
                                };

                                socket.ev.on('messages.upsert', handleDownload);
                                socket.ev.removeListener('messages.upsert', handleSelection);
                            }
                        };

                        socket.ev.on('messages.upsert', handleSelection);
                    } catch (error) {
                        
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                `*දෝෂයක් ඇතිවුණා:* ${error.message || 'Unknown error'}`,
                                 `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                    }
 break;
///////////////////////////////////////////////
                case 'getabogggut':
                    if (args.length === 0) {
                        await socket.sendMessage(sender, {
                            image: { url: config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                'Please provide a phone number. Example: .getabout 9476',
                                 `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }
                    const targetNumber = args[0].replace(/[^0-9]/g, '');
                    const targetJid = `${targetNumber}@s.whatsapp.net`;
                    try {
                        const statusData = await socket.fetchStatus(targetJid);
                        const aboutStatus = statusData.status || 'No status available';
                        const setAt = statusData.setAt ? moment(statusData.setAt).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss') : 'Unknown';
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '📝 WHATSAPP ABOUT STATUS',
                                `🔢 Number: ${targetNumber}\n📋 About: ${aboutStatus}\n🟢 Set At: ${setAt}`,
                                 `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                    } catch (error) {
                        console.error(`Failed to fetch status for ${targetNumber}:`, error);
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                `Failed to fetch About status for ${targetNumber}. The number may not exist or the status is not accessible.`,
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                    }
                    break;
       //////////////////
case 'derana':
           
                
                try {
                    // Define API URL inside the code
                    const DERANA_NEWS_API = 'https://dizer-adaderana-news-api.vercel.app/news';

                    // Fetch news data from the API
                    const response = await axios.get(DERANA_NEWS_API);
                    const news = response.data[0]; // Access the first item of the array

                    // Construct the message
                    const newsMessage = formatMessage(
                        '✨ 𝐃𝐄𝐑𝐀𝐍𝐀 𝐍𝐄𝐖𝐒 𝐔𝐏𝐃𝐀𝐓𝐄 ✨',
                        `*🗞️ Headline*: _${news.title || 'Not available'}_\n` +
                        `*📖 Story*: ${news.description || 'Not available'}\n` +
                        `*🕒 Published*: _${news.time || 'Not available'}_\n` +
                        `*🔗 Read More*: ${news.new_url || 'Not available'}\n\n` +
                        '*╚═══════════════╝*',
                       `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                    );

                    // Send the news as a message
                    await socket.sendMessage(sender, {
                        image: { url: news.image || config.RCD_IMAGE_PATH },
                        caption: newsMessage
                    }, { quoted: msg });
                } catch (error) {
                 
                    await socket.sendMessage(sender, {
                        image: { url: config.RCD_IMAGE_PATH },
                        caption: formatMessage(
                            '❌ ERROR',
                            '⚠️ දෝෂයක් සිදු විය. API එකෙන් දත්ත ලබා ගැනීමට නොහැකි විය!',
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    });
                }
                break;
/////////////////////////
case 'vv':
    
    if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*🍁 Please reply to a ViewOnce message!*',
               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }

    try {
        const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        const mtype = Object.keys(quotedMessage)[0]; // Get message type (imageMessage, videoMessage, audioMessage)

        
        if (
            (mtype === 'imageMessage' && quotedMessage.imageMessage?.viewOnce) ||
            (mtype === 'videoMessage' && quotedMessage.videoMessage?.viewOnce) ||
            (mtype === 'audioMessage' && quotedMessage.audioMessage?.viewOnce)
        ) {
         
            const decryptingMessage = {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '🔓 DECRYPTING',
                    'Decrypting the ViewOnce Message...',
                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            };
            const sentMessage = await socket.sendMessage(sender, decryptingMessage, { quoted: msg });

            
            const stream = await downloadContentFromMessage(quotedMessage[mtype], mtype.replace('Message', '')); // e.g., 'imageMessage' -> 'image'
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            let messageContent = {};
            let caption = '';
            switch (mtype) {
                case 'imageMessage':
                    caption = quotedMessage.imageMessage?.caption || `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`;
                    messageContent = {
                        image: buffer,
                        caption: caption,
                        mimetype: quotedMessage.imageMessage?.mimetype || 'image/jpeg'
                    };
                    break;
                case 'videoMessage':
                    caption = quotedMessage.videoMessage?.caption || `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`;
                    messageContent = {
                        video: buffer,
                        caption: caption,
                        mimetype: quotedMessage.videoMessage?.mimetype || 'video/mp4'
                    };
                    break;
                case 'audioMessage':
                    caption = quotedMessage.audioMessage?.caption || `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`;
                    messageContent = {
                        audio: buffer,
                        caption: caption,
                        mimetype: quotedMessage.audioMessage?.mimetype || 'audio/mp4',
                        ptt: quotedMessage.audioMessage?.ptt || false
                    };
                    break;
                default:
                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage(
                            '❌ ERROR',
                            'Only ViewOnce image, video, and audio messages are supported',
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    });
                    await socket.sendMessage(sender, { delete: sentMessage.key });
                    return;
            }

       
            await socket.sendMessage(sender, messageContent, { quoted: msg });

            
            await socket.sendMessage(sender, { delete: sentMessage.key });

          
           
        } else {
            await socket.sendMessage(sender, {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    '*🍁 Please reply to a ViewOnce message!*',
                   `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            });
        }
    } catch (error) {
       
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `Error decrypting ViewOnce message: ${error.message}`,
               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    }
    break;
                case 'winfo':
                    
                    if (!args[0]) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                'Please provide a phone number! Usage: .winfo +94xxxxxxxxx',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    let inputNumber = args[0].replace(/[^0-9]/g, '');
                    if (inputNumber.length < 10) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                'Invalid phone number! Please include country code (e.g., +94760663483)',
                               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    let winfoJid = `${inputNumber}@s.whatsapp.net`;
                    const [winfoUser] = await socket.onWhatsApp(winfoJid).catch(() => []);
                    if (!winfoUser?.exists) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ ERROR',
                                'User not found on WhatsApp',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    let winfoPpUrl;
                    try {
                        winfoPpUrl = await socket.profilePictureUrl(winfoJid, 'image');
                    } catch {
                        winfoPpUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
                    }

                    let winfoName = winfoJid.split('@')[0];
                    try {
                        const presence = await socket.presenceSubscribe(winfoJid).catch(() => null);
                        if (presence?.pushName) winfoName = presence.pushName;
                    } catch (e) {
                        console.log('Name fetch error:', e);
                    }

                    let winfoBio = 'No bio available';
                    try {
                        const statusData = await socket.fetchStatus(winfoJid).catch(() => null);
                        if (statusData?.status) {
                            winfoBio = `${statusData.status}\n└─ 📌 Updated: ${statusData.setAt ? new Date(statusData.setAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }) : 'Unknown'}`;
                        }
                    } catch (e) {
                        
                    }

                    let winfoLastSeen = '❌ Hidden';
                    try {
                        const lastSeenData = await socket.fetchPresence(winfoJid).catch(() => null);
                        if (lastSeenData?.lastSeen) {
                            winfoLastSeen = `🕒 ${new Date(lastSeenData.lastSeen).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`;
                        }
                    } catch (e) {
                        console.log('Last seen fetch error:', e);
                    }

                    const userInfoWinfo = formatMessage(
                        '🔍 PROFILE INFO',
                        `┌─[ 👤 WHATSAPP USER INFO ]
├ ✨ Name         : ${winfoName}
├ 📞 Number       : ${winfoJid.replace(/@.+/, '')}
├ 🏷️ Account Type : ${winfoUser.isBusiness ? '💼 Business' : '👤 Personal'}
└───────────────
📝 About:
${winfoBio}

🕒 Last Seen:
${winfoLastSeen}

🙏 Thank you for using our bot!
`,
                        `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                    );

                    await socket.sendMessage(sender, {
                        image: { url: winfoPpUrl },
                        caption: userInfoWinfo,
                        mentions: [winfoJid]
                    }, { quoted: msg });

                    console.log('User profile sent successfully for .winfo');
                    break;
///////////////////////////
case 'google':
                try {
                    // Check if a search query is provided
                    if (!args.length) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❗ ERROR',
                                '*Please provide a search query!*\n📋 *Usage*: .google [search term]',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    const query = args.join(' ');
                    const apiKey = 'AIzaSyDMbI3nvmQUrfjoCJYLS69Lej1hSXQjnWI';
                    const cx = 'baf9bdb0c631236e5';
                    const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

                    
                    await socket.sendMessage(sender, { text: '⌛ Fetching search results...' });

                    const response = await axios.get(apiUrl);

                    
                    if (response.status !== 200 || !response.data.items || response.data.items.length === 0) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ NO RESULTS',
                                `*No results found for: ${query}*`,
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    
                    let results = `🔎 *Google Search Results for: "${query}"*\n\n`;
                    response.data.items.slice(0, 5).forEach((item, index) => {
                        results += `*${index + 1}. ${item.title}*\n> ${item.link}\n> ${item.snippet}\n\n`;
                    });

                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage(
                            '🔎 GOOGLE SEARCH',
                            results.trim(),
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    });
                } catch (error) {
                    console.error(error);
                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage(
                            '⚠️ ERROR',
                            `*An error occurred while fetching search results!*\n${error.message}`,
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    });
                }
               
//////////////
                    break;
///////////////////////
case 'weather':
                try {
                    // නගරයක නමක් ලබාදී තිබේදැයි පරීක්ෂා කිරීම
                    if (!args.length) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                               '❗ Error',
'*Please provide a city name!* \n📋 *Usage*: .weather [city name]',
`${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        break;
                    }

                    const apiKey = '2d61a72574c11c4f36173b627f8cb177';
                    const city = args.join(' ');
                    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

         
                

                    const response = await axios.get(url);
                    const data = response.data;

              
                    const weatherMessage = formatMessage(
                        `*🌤 ${sessionConfig.BOT_NAME || config.BOT_NAME}𝐖𝐞𝐚𝐭𝐡𝐞𝐫 𝐑𝐞𝐩𝐨𝐫𝐭 🌤🌤*`,
                        `*━🌍 ${data.name}, ${data.sys.country} 🌍━*\n\n` +
                        `*🌡️ Temperature*: _${data.main.temp}°C_\n` +
                        `*🌡️ Feels Like*: _${data.main.feels_like}°C_\n` +
                        `*🌡️ Min Temp*: _${data.main.temp_min}°C_\n` +
                        `*🌡️ Max Temp*: _${data.main.temp_max}°C_\n` +
                        `*💧 Humidity*: ${data.main.humidity}%\n` +
                        `*☁️ Weather*: ${data.weather[0].main}\n` +
                        `*🌫️ Description*: _${data.weather[0].description}_\n` +
                        `*💨 Wind Speed*: ${data.wind.speed} m/s\n` +
                        `*🔽 Pressure*: ${data.main.pressure} hPa`,
                        `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                    );

                    await socket.sendMessage(sender, {
                        image: { url: config.SULA_IMAGE_PATH },
                        caption: weatherMessage
                    });
                } catch (e) {
                   
                    if (e.response && e.response.status === 404) {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '🚫 Error',
'*City not found!* \n🔍 Please check the name configuration and try again.',
`${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                    } else {
                        await socket.sendMessage(sender, {
                            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '⚠️ Error',
'*An error occurred!* \n🔄 Please try again later.',
`${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                    }
                }
                break;
//////////////
////////////////////////////////////////////////////////////////////////////

case 'song':
   
    if (!args.length) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Need YouTube URL or Song Title*',
                '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
            )
        }, { quoted: sudu });
        break;
    }

    const songQuery = args.join(' ');

    
    const isValidYouTubeUrl = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(url);
    };

    if (songQuery.startsWith('http') && !isValidYouTubeUrl(songQuery)) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Invalid YouTube URL*',
                '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
            )
        }, { quoted: sudu });
        break;
    }

    try {
        
        const search = await yts(songQuery);
        const data = search.videos[0];

        if (!data) {
            await socket.sendMessage(sender, {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ NO RESULTS',
                    '*No results found*',
                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            }, { quoted: sudu });
            break;
        }

        const url = data.url;
        const desc = formatMessage(
            `🎵 ${sessionConfig.BOT_NAME || config.BOT_NAME} 𝐌𝐔𝐒𝐈𝐂 🎵`,
            `*╭━ \`🌟🎵 YOUTUBE AUDIO INFO 🎵🌟\` ━*
*| \`🍀 Title\`    :* ${data.title || 'Not available'} 🙇‍♂️🫀🎧
*| \`⏰ Duration\` :* ${data.timestamp || 'N/A'}
*| \`👀 Views\`   :* ${data.views?.toLocaleString() || 'N/A'}
*| \`📅 Uploaded\` :* ${data.ago || 'N/A'}
*| \`🎵 Type\`  :* Audio Convert
*| \`🎇 Channel\` :* ${data.author?.name || 'Not available'}
*| \`🔗 URL\`   :* ${data.url || 'N/A'}
*╰━━━━━━━━━━━━━━━*

*💌 𝗥𝗲𝗽𝗹𝘆 𝗯𝗲𝗹𝗼𝘄 𝗻𝘂𝗺𝗯𝗲𝗿 𝘁𝗼 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱:*

1️⃣ ║❯❯ Download Audio 🎧
2️⃣ ║❯❯ Download Document 📁
3️⃣ ║❯❯ Download Voice 🎤
`,
            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
        );

        const sentMsg = await socket.sendMessage(sender, {
            image: { url: data.thumbnail },
            caption: desc
        }, { quoted: sudu });

       
        async function getDownloadLink(downloadId) {
            const maxAttempts = 30;
            let attempt = 0;

            while (attempt < maxAttempts) {
                try {
                    const response = await axios.get(`https://p.oceansaver.in/api/progress?id=${downloadId}`);
                    const progress = response.data;
                    if (progress && progress.success && progress.progress === 1000 && progress.download_url) {
                        return progress.download_url;
                    }
                } catch (error) {
                   
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempt++;
            }
            throw new Error('Download link not available within timeout');
        }

     
        const listener = async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === sentMsg.key.id;

            if (isReplyToSentMsg && ['1', '2', '3'].includes(messageType)) {
                await socket.sendMessage(sender, { react: { text: '⬇️', key: mek.key } });

                try {
                 
                    let retryCount = 0;
                    const maxRetries = 3;
                    let downloadId;

                    while (retryCount < maxRetries) {
                        try {
                            const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=mp3&url=${encodeURIComponent(url)}`;
                          
                            const response = await axios.get(apiUrl);
                            
                            const down = response.data;

                            if (down && down.success && down.id) {
                                downloadId = down.id;
                                break;
                            } else {
                                throw new Error('Invalid API response');
                            }
                        } catch (error) {
                            retryCount++;
                            console.error(`Retry ${retryCount}/${maxRetries} failed:`, error.message);
                            if (retryCount === maxRetries) {
                                throw new Error('Failed to initiate download after retries');
                            }
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                        }
                    }

                    const downloadLink = await getDownloadLink(downloadId);
                    await socket.sendMessage(sender, { react: { text: '⬆️', key: mek.key } });

                   
                    if (messageType === '1') {
                        await socket.sendMessage(sender, {
                            audio: { url: downloadLink },
                            mimetype: 'audio/mpeg'
                        }, { quoted: mek });
                    } else if (messageType === '2') {
                        await socket.sendMessage(sender, {
                            document: { url: downloadLink },
                            mimetype: 'audio/mp3',
                            fileName: `${data.title}.mp3`
                        }, { quoted: mek });
                    } else if (messageType === '3') {
                        await socket.sendMessage(sender, {
                            audio: { url: downloadLink },
                            mimetype: 'audio/mpeg',
                            ptt: true
                        }, { quoted: mek });
                    }

                   

                    
                    socket.ev.off('messages.upsert', listener);

                } catch (error) {
                    
                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage(
                            '❌ ERROR',
                            `*Failed to download*: ${error.message}. Try another song or check the URL.`,
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    }, { quoted: mek });

                    // Cleanup listener on error
                    socket.ev.off('messages.upsert', listener);
                }
            }
        };

        socket.ev.on('messages.upsert', listener);

    } catch (error) {
       
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `*Error occurred*: ${error.message}. Please try again.`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        }, { quoted: msg });
    }
    break;
case 'video':
   
    if (!args.length) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Need YouTube URL or Song Title*',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        }, { quoted: sudu });
        break;
    }

    const songQuery1 = args.join(' ');

    const isValidYouTubeUrl1 = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(url);
    };

    if (songQuery1.startsWith('http') && !isValidYouTubeUrl(songQuery1)) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Invalid YouTube URL*',
               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        }, { quoted: sudu });
        break;
    }

    try {
        const search = await yts(songQuery1);
        const data = search.videos[0];

        if (!data) {
            await socket.sendMessage(sender, {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ NO RESULTS',
                    '*No results found*',
                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            }, { quoted: sudu });
            break;
        }

        
        const timestamp = data.timestamp || '0:00';
        const [minutes, seconds] = timestamp.split(':').map(Number);
        const durationInSeconds = minutes * 60 + (seconds || 0);
        if (durationInSeconds > 350) { // 6 minutes = 360 seconds
            await socket.sendMessage(sender, {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    '*Video duration exceeds 6 minutes*',
                   `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            }, { quoted: sudu });
            break;
        }

        const url = data.url;
        const desc = formatMessage(
            `🎵 ${sessionConfig.BOT_NAME || config.BOT_NAME} 𝐕𝐈𝐃𝐄𝐎 🎵`,
            `*╭━ \`🌟🎵 YOUTUBE VIDEO INFO 🎵🌟\` ━*
*| \`🍀 Title\`    :* ${data.title || 'Not available'} 🙇‍♂️🫀🎧
*| \`⏰ Duration\` :* ${data.timestamp || 'N/A'}
*| \`👀 Views\`   :* ${data.views?.toLocaleString() || 'N/A'}
*| \`📅 Uploaded\` :* ${data.ago || 'N/A'}
*| \`🎵 Type\`  :* Audio Convert
*| \`🎇 Channel\` :* ${data.author?.name || 'Not available'}
*| \`🔗 URL\`   :* ${data.url || 'N/A'}
*╰━━━━━━━━━━━━━━━*

*💌 𝗥𝗲𝗽𝗹𝘆 𝗯𝗲𝗹𝗼𝘄 𝗻𝘂𝗺𝗯𝗲𝗿 𝘁𝗼 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱:*

1️⃣ ║❯❯ Download Video 
2️⃣ ║❯❯ Download Document 📁
`,
            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
        );

        const sentMsg = await socket.sendMessage(sender, {
            image: { url: data.thumbnail },
            caption: desc
        }, { quoted: sudu });

   
        async function getDownloadLink(downloadId) {
            const maxAttempts = 30; // Max 30 attempts (1 second each)
            let attempt = 0;

            while (attempt < maxAttempts) {
                try {
                    const response = await axios.get(`https://p.oceansaver.in/api/progress?id=${downloadId}`);
                    const progress = response.data;
                    if (progress && progress.success && progress.progress === 1000 && progress.download_url) {
                        return progress.download_url;
                    }
                } catch (error) {
                   
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempt++;
            }
            throw new Error('Download link not available within timeout');
        }

       
        const listener = async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === sentMsg.key.id;

            if (isReplyToSentMsg && ['1', '2', '3'].includes(messageType)) {
                await socket.sendMessage(sender, { react: { text: '⬇️', key: mek.key } });

                try {
                   
                    let retryCount = 0;
                    const maxRetries = 3;
                    let downloadId;

                    while (retryCount < maxRetries) {
                        try {
                            const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=360&url=${encodeURIComponent(url)}`;
                          
                            const response = await axios.get(apiUrl);
                            
                            const down = response.data;

                            if (down && down.success && down.id) {
                                downloadId = down.id;
                                break;
                            } else {
                                throw new Error('Invalid API response');
                            }
                        } catch (error) {
                            retryCount++;
                            
                            if (retryCount === maxRetries) {
                                throw new Error('Failed to initiate download after retries');
                            }
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                        }
                    }

                    const downloadLink = await getDownloadLink(downloadId);
                    await socket.sendMessage(sender, { react: { text: '⬆️', key: mek.key } });

                    
                    if (messageType === '1') {
                        await socket.sendMessage(sender, {
                            video: { url: downloadLink },
                            mimetype: 'video/mp4',
                            caption: `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        }, { quoted: mek });
                    } else if (messageType === '2') {
                        await socket.sendMessage(sender, {
                            document: { url: downloadLink },
                            mimetype: 'video/mp4',
                            fileName: `${data.title}.mp4`
                        }, { quoted: mek });
                    } 

                    
                    socket.ev.off('messages.upsert', listener);

                } catch (error) {
                    
                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage(
                            '❌ ERROR',
                            `*Failed to download*: ${error.message}. Try another song or check the URL.`,
                            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                        )
                    }, { quoted: mek });

                   
                    socket.ev.off('messages.upsert', listener);
                }
            }
        };

        socket.ev.on('messages.upsert', listener);

    } catch (error) {
        
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `*Error occurred*: ${error.message}. Please try again.`,
                 `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        }, { quoted: msg });
    }
    break;
case 'ig':
    if (!args.length || !args.join(' ').startsWith('https://')) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                'Please provide a valid Instagram URL!\nExample: .ig https://www.instagram.com/reel/DMNiqN2TV3v/',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        break;
    }

    await socket.sendMessage(sender, { react: { text: '⬇️', key: msg.key } });

    try {
        const igUrl = args.join(' ');
        const apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(igUrl)}`;
        console.log(`Fetching API: ${apiUrl}`); // Log the request
        const response = await axios.get(apiUrl);
       
        const igData = response.data;

        if (!igData.status || !igData.data || igData.data.length === 0) {
            await socket.sendMessage(sender, {
                image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    'Failed to fetch Instagram video! Please try again later. Check console for details.',
                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            });
            break;
        }

        const igData1 = igData.data[0]; // Access the first item in the data array
        const thumbnail = igData1.thumbnail || config.SULA_IMAGE_PATH;
        const videoUrl = igData1.url;

        if (!videoUrl) {
            await socket.sendMessage(sender, {
                image: { url: config.SULA_IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    'No video URL found in the API response.',
                    `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                )
            });
            break;
        }

        const captionMessage = formatMessage(
            '🎥 INSTAGRAM DOWNLOADER',
            `*╭━ \`🌟📹 INSTAGRAM VIDEO MENU 📹🌟\` ━*
*| 🗣️ Title:* ${igData1.title || 'Instagram Video'}
*╰━━━━━━━━━━━━━━━*

*🔢 𝗥𝗲𝗽𝗹𝘆 𝘄𝗶𝘁𝗵 𝗯𝗲𝗹𝗼𝘄 𝗻𝘂𝗺𝗯𝗲𝗿 𝘁𝗼 𝗱𝗼𝘄𝗻𝗹𝗮𝗱:*

*╭━🌟📹 IG VIDEO DL 📹🌟━*
1️⃣ ║❯❯ Video 📽️
*╰━━━━━━━━━━━━━━━*`,
           `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
        );

        const sentMessage = await socket.sendMessage(sender, {
            image: { url: thumbnail },
            caption: captionMessage
        }, { quoted: sudu });

        const messageID = sentMessage.key.id;

        const handleIgSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const userResponse = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToSentMsg && sender === replyMek.key.remoteJid) {
                await socket.sendMessage(sender, { react: { text: '⬇️', key: replyMek.key } });

                let mediaMessage;

                switch (userResponse) {
                    case '1':
                        mediaMessage = {
                            video: { url: videoUrl },
                            mimetype: 'video/mp4',
                            caption: formatMessage(
                                '✅ INSTAGRAM VIDEO',
                                'Video downloaded successfully',
                                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        };
                        break;
                    default:
                        await socket.sendMessage(sender, {
                            image: { url: config.SULA_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ INVALID SELECTION',
                                'Please reply with 1.',
                               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
                            )
                        });
                        return;
                }

                if (mediaMessage) {
                    await socket.sendMessage(sender, mediaMessage, { quoted: replyMek });
                    await socket.sendMessage(sender, { react: { text: '✅', key: replyMek.key } });
                }
                socket.ev.removeListener('messages.upsert', handleIgSelection);
            }
        };

        socket.ev.on('messages.upsert', handleIgSelection);
    } catch (error) {
      
        await socket.sendMessage(sender, {
            image: { url: config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `Failed to process Instagram request: ${error.message}. Check console for details.`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
    }
    break;
                case 'updateconfig':
    if (sender !== jidNormalizedUser(socket.user.id)) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ Access Denied',
                'This command USE IN YOUR NUMBER.',
               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        return;
    }

    if (args.length === 0) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ Invalid Input',
                'Please provide config in JSON format.\nExample: .updateconfig {"AUTO_VIEW_STATUS": "false", "AUTO_LIKE_STATUS": "true"}',
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        return;
    }

    let newConfig;
    try {
        newConfig = JSON.parse(args.join(' '));
    } catch (error) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ Invalid JSON',
                'Please provide a valid JSON object for config.',
               `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        return;
    }

    
    const validKeys = Object.keys(config);
    const invalidKeys = Object.keys(newConfig).filter(key => !validKeys.includes(key));
    if (invalidKeys.length > 0) {
        await socket.sendMessage(sender, {
            image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
            caption: formatMessage(
                '❌ Invalid Config Keys',
                `Invalid keys: ${invalidKeys.join(', ')}. Valid keys are: ${validKeys.join(', ')}`,
                `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
            )
        });
        return;
    }

    // Directly update the configuration
    sessionConfig = { ...sessionConfig, ...newConfig };
    await updateUserConfig(sanitizedNumber, sessionConfig);
    activeSockets.set(sanitizedNumber, { socket, config: sessionConfig });
    await socket.sendMessage(sender, {
        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
        caption: formatMessage(
            '✅ CONFIG UPDATED',
            'Your configuration has been successfully updated!',
            `${sessionConfig.BOT_FOOTER || config.BOT_FOOTER}`
        )
    });
    break;
                case 'deletemeseson':
                    await deleteSession(sanitizedNumber);
                    if (activeSockets.has(sanitizedNumber)) {
                        activeSockets.get(sanitizedNumber).socket.ws.close();
                        activeSockets.delete(sanitizedNumber);
                        socketCreationTime.delete(sanitizedNumber);
                    }
                    const deleteSessionButtons = [
                        { buttonId: `.menu`, buttonText: { displayText: "𝐌𝐄𝐍𝐔📜" } },
                        { buttonId: `.alive`, buttonText: { displayText: "𝐀𝐋𝐈𝐕𝐄👋" } }
                    ];
                    await socket.sendMessage(sender, {
                        image: { url: sessionConfig.SULA_IMAGE_PATH || config.SULA_IMAGE_PATH },
                        caption: formatMessage('🗑️ SESSION DELETED', '✅ Your session has been successfully deleted.', '𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'),
                        footer: '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃',
                        buttons: deleteSessionButtons,
                        headerType: 1,
                        viewOnce: true
                    });
                    break;
      }
    } catch (error) {
      console.error('Command handler error:', error);
      await socket.sendMessage(sender, {
        text: `❌ ERROR\nAn error occurred: ${error.message}`,
      });
    }
  });
}
//==============================================================

//============================================================



async function setupMessageHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

        const senderNumber = msg.key.participant ? msg.key.participant.split('@')[0] : msg.key.remoteJid.split('@')[0];
        const botNumber = jidNormalizedUser(socket.user.id).split('@')[0];
        const isReact = msg.message.reactionMessage;

        // Get session-specific config
        const sanitizedNumber = botNumber.replace(/[^0-9]/g, '');
        const sessionConfig = activeSockets.get(sanitizedNumber)?.config || config;

        // Auto Typing
        if (sessionConfig.AUTO_TYPING === 'true') {
            try {
                await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
                
            } catch (error) {
               
            }
        }

        // Auto Recording
        if (sessionConfig.AUTO_RECORDING === 'true') {
            try {
                await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
               
            } catch (error) {
                
            }
        }

        // Specific Number Reactions
        if (senderNumber.includes('94760663483')) {
            if (isReact) return;
            try {
                await socket.sendMessage(msg.key.remoteJid, { react: { text: '🍁', key: msg.key } });
             
                
            } catch (error) {
               
            }
        }

        // Auto React
        if (!isReact && senderNumber !== botNumber) {
            if (sessionConfig.AUTO_REACT === 'true') {
                const reactions = [
                    '❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗',
                    '💖', '💘', '💝', '💟', '♥', '💌', '🙂', '🤗', '😌', '😉', '🤗', '😊',
                    '🎊', '🎉', '🎁', '🎈', '👋'
                ];
                const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                try {
                    await socket.sendMessage(msg.key.remoteJid, { react: { text: randomReaction, key: msg.key } });
                    
                } catch (error) {
                    
                }
            }
        }
    });
}

async function saveSession(number, creds) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        await Session.findOneAndUpdate(
            { number: sanitizedNumber },
            { creds, updatedAt: new Date() },
            { upsert: true }
        );
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(creds, null, 2));
        let numbers = [];
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
        }
        if (!numbers.includes(sanitizedNumber)) {
            numbers.push(sanitizedNumber);
            fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
        }
       
    } catch (error) {
        
    }
}

async function restoreSession(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({ number: sanitizedNumber });
        if (!session) {
            
            return null;
        }
        if (!session.creds || !session.creds.me || !session.creds.me.id) {
           
            await deleteSession(sanitizedNumber);
            return null;
        }
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(session.creds, null, 2));
        
        return session.creds;
    } catch (error) {
        
        return null;
    }
}

async function deleteSession(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: sanitizedNumber });
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        if (fs.existsSync(sessionPath)) {
            fs.removeSync(sessionPath);
        }
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            let numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
            numbers = numbers.filter(n => n !== sanitizedNumber);
            fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
        }
        
    } catch (error) {
        
    }
}

async function loadUserConfig(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const configDoc = await Session.findOne({ number: sanitizedNumber }, 'config');
    return { ...config, ...configDoc?.config };
  } catch (error) {
    console.error(`Failed to load config for ${number}:`, error);
    return { ...config };
  }
}

async function updateUserConfig(number, newConfig) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    await Session.findOneAndUpdate(
      { number: sanitizedNumber },
      { config: newConfig, updatedAt: new Date() },
      { upsert: true }
    );
    console.log(`Updated config for ${sanitizedNumber}`);
  } catch (error) {
    console.error(`Failed to update config for ${sanitizedNumber}:`, error);
    throw error;
  }
}
function setupAutoRestart(socket, number) {
    const maxReconnectAttempts = 10;
    let reconnectAttempts = 0;

    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== 401) {
            if (reconnectAttempts >= maxReconnectAttempts) {
                
                activeSockets.delete(number.replace(/[^0-9]/g, ''));
                socketCreationTime.delete(number.replace(/[^0-9]/g, ''));
                return;
            }
            console.log(`Connection lost for ${number}, attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
            try {
                await delay(5000 * (reconnectAttempts + 1));
                activeSockets.delete(number.replace(/[^0-9]/g, ''));
                socketCreationTime.delete(number.replace(/[^0-9]/g, ''));
                const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
                await EmpirePair(number, mockRes);
                reconnectAttempts = 0;
            } catch (error) {
                console.error(`Reconnect failed for ${number}:`, error);
                reconnectAttempts++;
            }
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            console.log(`Connection established for ${number}`);
        }
    });
}

async function fetchNewsletterJIDs(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.jids || [];
    } catch (error) {
        console.error('Failed to fetch newsletter JIDs:', error);
        return [];
    }
}

async function EmpirePair(number, res) {
  console.log(`Initiating pairing/reconnect for ${number}`);
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

  await restoreSession(sanitizedNumber);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'fatal' : 'debug' });

  try {
    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      logger,
      browser: Browsers.macOS('Safari')
    });

    socketCreationTime.set(sanitizedNumber, Date.now());

    setupStatusHandlers(socket);
    setupCommandHandlers(socket, sanitizedNumber);
    setupMessageHandlers(socket);
    setupAutoRestart(socket, sanitizedNumber);
    setupNewsletterHandlers(socket);
    

    // Anti-Call 
    socket.ev.on('call', async (callEvents) => {
      const sessionConfig = activeSockets.get(sanitizedNumber)?.config || config;
      if (sessionConfig.ANTI_CALL === 'true') {
        for (const callEvent of callEvents) {
          if (callEvent.status === 'offer' && !callEvent.isGroup) {
            try {
              await socket.sendMessage(callEvent.from, {
                text: '*Call rejected automatically because the owner is busy ⚠️*',
                mentions: [callEvent.from],
              });
              await socket.rejectCall(callEvent.id, callEvent.from);
              console.log(`Rejected call from ${callEvent.from} for ${sanitizedNumber}`);
            } catch (error) {
              console.error(`Error processing call event for ${sanitizedNumber}:`, error);
            }
          }
        }
      }
    });

    if (!socket.authState.creds.registered) {
      let retries = config.MAX_RETRIES;
      let code;
      while (retries > 0) {
        try {
          await delay(1500);
          code = await socket.requestPairingCode(sanitizedNumber);
          console.log(`Generated pairing code for ${sanitizedNumber}: ${code}`);
          break;
        } catch (error) {
          retries--;
          console.warn(`Failed to request pairing code for ${sanitizedNumber}, retries left: ${retries}`, error.message);
          if (retries === 0) throw error;
          await delay(2000 * (config.MAX_RETRIES - retries));
        }
      }
      if (!res.headersSent) {
        res.send({ code });
      }
    }

    socket.ev.on('creds.update', async () => {
      try {
        await saveCreds();
        const credsPath = path.join(sessionPath, 'creds.json');
        if (!fs.existsSync(credsPath)) {
          console.error(`Creds file not found for ${sanitizedNumber}`);
          return;
        }
        const fileContent = await fs.readFile(credsPath, 'utf8');
        const creds = JSON.parse(fileContent);
        await saveSession(sanitizedNumber, creds);
      } catch (error) {
        console.error(`Failed to save creds for ${sanitizedNumber}:`, error);
      }
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection } = update;
      console.log(`Connection update for ${sanitizedNumber}:`, update);
      if (connection === 'open') {
        try {
          await delay(3000);
          const userJid = jidNormalizedUser(socket.user.id);

          
          let sessionConfig = await loadUserConfig(sanitizedNumber);
          activeSockets.set(sanitizedNumber, { socket, config: sessionConfig });

          // ALLWAYS_OFFLINE
          if (sessionConfig.ALLWAYS_OFFLINE === 'true') {
            await socket.sendPresenceUpdate('unavailable');
            console.log(`Set presence to unavailable for ${sanitizedNumber}`);
          } else {
            await socket.sendPresenceUpdate('available');
            console.log(`Set presence to available for ${sanitizedNumber}`);
          }

          const groupResult = await joinGroup(socket);

          try {
            await socket.newsletterFollow(config.NEWSLETTER_JID);
            await socket.sendMessage(config.NEWSLETTER_JID, { react: { text: '❤️', key: { id: config.NEWSLETTER_MESSAGE_ID } } });
            console.log('✅ Auto-followed newsletter & reacted ❤️');
          } catch (error) {
            console.error('❌ Newsletter error:', error.message);
          }

          const groupStatus = groupResult.status === 'success'
            ? 'Joined successfully'
            : `Failed to join group: ${groupResult.error}`;
          await socket.sendMessage(userJid, {
            image: { url: sessionConfig.RCD_IMAGE_PATH || config.RCD_IMAGE_PATH },
            caption: formatMessage(
              '👋𝐇𝐄𝐘 𝐔𝐒𝐄𝐑 𝐈 𝐀𝐌 𝐂𝐎𝐍𝐍𝐄𝐂𝐓💥',
              `✅ Successfully connected!\n\n🔰 *Number:* ${sanitizedNumber}\n♻️ *Channel:* ${config.NEWSLETTER_JID ? 'Followed' : 'Not followed'}\n\n📛 *𝐂𝐎𝐌𝐌𝐀𝐍𝐃*📛:`,
              '© 𝚂𝚄𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃'
            )
          });

          await sendAdminConnectMessage(socket, sanitizedNumber, groupResult);
        } catch (error) {
          console.error('Connection error:', error);
          exec(`pm2 restart ${process.env.PM2_NAME || '{LAKIYA-{M𝙳-{F𝚁𝙴𝙴-{B𝙾𝚃-session'}`);
        }
      }
    });
  } catch (error) {
    console.error('Pairing/reconnect error:', error);
    socketCreationTime.delete(sanitizedNumber);
    if (!res.headersSent) {
      res.status(503).send({ error: 'Service Unavailable' });
    }
  }
}
router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).send({ error: 'Number parameter is required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    if (activeSockets.has(sanitizedNumber)) {
        return res.status(200).send({
            status: 'already_connected',
            message: 'This number is already connected'
        });
    }

    await EmpirePair(number, res);
});

router.get('/active', (req, res) => {
    console.log('Active sockets:', Array.from(activeSockets.keys()));
    res.status(200).send({
        count: activeSockets.size,
        numbers: Array.from(activeSockets.keys())
    });
});

router.get('/ping', (req, res) => {
    res.status(200).send({
        status: 'active',
        message: '🚓🚗 bot is running',
        activesession: activeSockets.size
    });
});

router.get('/connect-all', async (req, res) => {
    try {
        let numbers = [];
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH));
        }
        const sessions = await Session.find({}, 'number').lean();
        numbers = [...new Set([...numbers, ...sessions.map(s => s.number)])];

        if (numbers.length === 0) {
            return res.status(404).send({ error: 'No numbers found to connect' });
        }

        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) {
                results.push({ number, status: 'already_connected' });
                continue;
            }

            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
            await EmpirePair(number, mockRes);
            results.push({ number, status: 'connection_initiated' });
        }

        res.status(200).send({
            status: 'success',
            connections: results
        });
    } catch (error) {
        console.error('Connect all error:', error);
        res.status(500).send({ error: 'Failed to connect all bots' });
    }
});

router.get('/reconnect', async (req, res) => {
    try {
        const sessions = await Session.find({}, 'number').lean();
        if (sessions.length === 0) {
            return res.status(404).send({ error: 'No sessions found in MongoDB' });
        }

        const results = [];
        for (const { number } of sessions) {
            if (activeSockets.has(number)) {
                results.push({ number, status: 'already_connected' });
                continue;
            }

            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
            try {
                await EmpirePair(number, mockRes);
                results.push({ number, status: 'connection_initiated' });
            } catch (error) {
                console.error(`Failed to reconnect bot for ${number}:`, error);
                results.push({ number, status: 'failed', error: error.message });
            }
            await delay(1000);
        }

        res.status(200).send({
            status: 'success',
            connections: results
        });
    } catch (error) {
        console.error('Reconnect error:', error);
        res.status(500).send({ error: 'Failed to reconnect bots' });
    }
});

router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) {
        return res.status(400).send({ error: 'Number and config are required' });
    }

    let newConfig;
    try {
        newConfig = JSON.parse(configString);
    } catch (error) {
        return res.status(400).send({ error: 'Invalid config format' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).send({ error: 'No active session found for this number' });
    }

    const otp = generateOTP();
    otpStore.set(sanitizedNumber, { otp, expiry: Date.now() + config.OTP_EXPIRY, newConfig });

    try {
        await sendOTP(socket, sanitizedNumber, otp);
        res.status(200).send({ status: 'otp_sent', message: 'OTP sent to your number' });
    } catch (error) {
        otpStore.delete(sanitizedNumber);
        res.status(500).send({ error: 'Failed to send OTP' });
    }
});

router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) {
        return res.status(400).send({ error: 'Number and OTP are required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const storedData = otpStore.get(sanitizedNumber);
    if (!storedData) {
        return res.status(400).send({ error: 'No OTP request found for this number' });
    }

    if (Date.now() >= storedData.expiry) {
        otpStore.delete(sanitizedNumber);
        return res.status(400).send({ error: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).send({ error: 'Invalid OTP' });
    }

    try {
        await updateUserConfig(sanitizedNumber, storedData.newConfig);
        otpStore.delete(sanitizedNumber);
        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            await socket.sendMessage(jidNormalizedUser(socket.user.id), {
                image: { url: config.RCD_IMAGE_PATH },
                caption: formatMessage(
                    '✅ CONFIG UPDATED',
                    'Your configuration has been successfully updated!',
                    '㋛︎ ᴘᴏᴡᴇʀᴅ ʙʏ ᴍʀ ʟᴀᴋꜱɪᴅᴜ ᶜᵒᵈᵉʳ'
                )
            });
        }
        res.status(200).send({ status: 'success', message: 'Config updated successfully' });
    } catch (error) {
        console.error('Failed to update config:', error);
        res.status(500).send({ error: 'Failed to update config' });
    }
});

router.get('/getabout', async (req, res) => {
    const { number, target } = req.query;
    if (!number || !target) {
        return res.status(400).send({ error: 'Number and target number are required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).send({ error: 'No active session found for this number' });
    }

    const targetJid = `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    try {
        const statusData = await socket.fetchStatus(targetJid);
        const aboutStatus = statusData.status || 'No status available';
        const setAt = statusData.setAt ? moment(statusData.setAt).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss') : 'Unknown';
        res.status(200).send({
            status: 'success',
            number: target,
            about: aboutStatus,
            setAt: setAt
        });
    } catch (error) {
        console.error(`Failed to fetch status for ${target}:`, error);
        res.status(500).send({
            status: 'error',
            message: `Failed to fetch About status for ${target}. The number may not exist or the status is not accessible.`
        });
    }
});


process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    fs.emptyDirSync(SESSION_BASE_PATH);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    exec(`pm2 restart ${process.env.PM2_NAME || '{lakiya-{md-{mini-{bot-session'}`);
});

module.exports = router;

