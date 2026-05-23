const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const qrcode = require('qrcode-terminal');
const input = require('input');

(async () => {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH are required');
  }

  console.log('QR login will open a Telegram sign-in token. Scan it with the Telegram app on your phone.');
  console.log('If Telegram asks for a 2FA password, enter it when prompted.');

  const askOptional = async (prompt) => {
    const value = (await input.text(prompt)).trim();
    return value || undefined;
  };

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  await client.signInUserWithQrCode({ apiId, apiHash }, {
    qrCode: async ({ token }) => {
      const qrUrl = `tg://login?token=${token.toString('base64url')}`;
      console.log('\nScan this QR with Telegram:');
      qrcode.generate(qrUrl, { small: true });
      console.log(qrUrl);
      console.log('Waiting for approval on your phone...\n');
    },
    password: async (hint) => {
      if (hint) {
        console.log(`Telegram requested your 2FA password. Hint: ${hint}`);
      }
      return await askOptional('2FA password (press Enter if you do not have 2FA enabled): ');
    },
    onError: (err) => console.error(err),
  });

  console.log('\nTELEGRAM_STRING_SESSION=');
  console.log(client.session.save());
  await client.disconnect();
})();
