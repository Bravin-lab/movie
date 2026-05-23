const path = require('path');
const fs = require('fs-extra');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = process.env.TELEGRAM_STRING_SESSION; // optional pre-generated session
const mtprotoEnabled = process.env.TELEGRAM_MTPROTO === '1' || false;

let client;
let initialized = false;

async function initClient() {
  if (!mtprotoEnabled) return null;
  if (initialized) return client;
  if (!apiId || !apiHash) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set for MTProto');
  }

  const session = new StringSession(stringSession || '');
  client = new TelegramClient(session, Number(apiId), apiHash, {
    connectionRetries: 5,
  });

  if (!stringSession) {
    // If no string session provided, we need interactive start to login.
    // In headless servers, user should provide TELEGRAM_STRING_SESSION created locally.
    throw new Error('TELEGRAM_STRING_SESSION not provided. Create a session locally and set TELEGRAM_STRING_SESSION env var.');
  }

  await client.start({
    // If stringSession provided, start() will reuse it without prompts
    phoneNumber: async () => {
      throw new Error('Interactive login required. Provide TELEGRAM_STRING_SESSION instead.');
    },
    phoneCode: async () => {
      throw new Error('Interactive login required. Provide TELEGRAM_STRING_SESSION instead.');
    },
    password: async () => {
      throw new Error('Interactive login required. Provide TELEGRAM_STRING_SESSION instead.');
    },
    onError: (err) => console.error('Telegram client error', err),
  });

  initialized = true;
  return client;
}

async function uploadFileToChannel(filePath, channel, caption) {
  if (!mtprotoEnabled) throw new Error('MTProto disabled');
  await initClient();

  // `channel` may be username ("@channelusername") or numeric ID
  const entity = channel;

  // sendFile returns a Message
  const message = await client.sendFile(entity, {
    file: filePath,
    caption: caption || undefined,
  });

  // message.id and message.media contain info
  return {
    peer: entity,
    messageId: message.id,
    fileName: path.basename(filePath),
    size: (await fs.stat(filePath)).size,
  };
}

async function downloadFileFromMessage(peer, messageId, destPath) {
  if (!mtprotoEnabled) throw new Error('MTProto disabled');
  await initClient();

  // Get the message
  const msgs = await client.getMessages(peer, [messageId]);
  if (!msgs || !msgs.length) throw new Error('Message not found');
  const msg = msgs[0];
  if (!msg || !msg.media) throw new Error('No media in message');

  // Ensure destination dir exists
  await fs.ensureDir(path.dirname(destPath));

  // client.downloadMedia(msg.media, { file: destPath }) supports saving to file
  await client.downloadMedia(msg.media, { file: destPath });

  return destPath;
}

module.exports = {
  initClient,
  uploadFileToChannel,
  downloadFileFromMessage,
  mtprotoEnabled,
};
