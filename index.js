const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const readline = require('readline-sync');
const chalk = require('chalk');

// Function to start the bot
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'open') {
            console.log(chalk.blueBright('\n[✅] Bot is now online!'));
            let ownerNumber = readline.question(chalk.yellow('\nEnter your phone number (with country code, e.g., +1234567890): '));
            
            if (!fs.existsSync('owner.json')) {
                fs.writeFileSync('owner.json', JSON.stringify({ owner: ownerNumber }));
            }

            let { owner } = JSON.parse(fs.readFileSync('owner.json'));
            
            if (owner) {
                await sock.sendMessage(owner + '@s.whatsapp.net', { text: 'Welcome New User to Xeaon Zak MD Bot! Enjoy! 🤖🔥' });
            }
        }

        if (connection === 'close') {
            console.log(chalk.redBright('\n[❌] Bot is offline. Reopen Termux to restart.'));
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log(chalk.redBright('Login expired. Restart Termux and load the saved credentials.'));
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        let msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        let sender = msg.key.remoteJid;
        let messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log(chalk.green(`📩 Message from ${sender}: ${messageText}`));

        if (messageText.startsWith('.menu')) {
            let menuText = `*📜 Xeaon Zak MD Bot Commands 📜*\n\n
                *.ping* - Check bot response\n
                *.info* - Bot details\n
                *.rank* - View your rank\n
                *.afk [reason]* - Set AFK mode\n
                *.kick @user* - Remove a user\n
                *.promote @user* - Make admin\n
                *.mute @user* - Mute a user\n
                *.sticker* - Convert image to sticker\n
                *.ytmp3 [link]* - Download YouTube audio\n
                *.weather [city]* - Get weather info\n
                *.news* - Latest news\n\n
                More commands coming soon! 🚀`;
            
            await sock.sendMessage(sender, { text: menuText });
        }
    });
}

async function handleUserInput() {
    const startCommand = readline.question(chalk.cyan('\nEnter "startbot" to start the bot: '));

    if (startCommand.toLowerCase() === 'startbot') {
        console.log(chalk.green('\nStarting the bot...'));
        await startBot();
    } else {
        console.log(chalk.red('\nInvalid command! Please enter "startbot" to start the bot.'));
    }
}

handleUserInput();
