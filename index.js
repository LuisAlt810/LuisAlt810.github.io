require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const token = process.env.DISCORD_TOKEN;

const apiKeys = [
  { provider: process.env.API1_PROVIDER, key: process.env.API_KEY_1 },
  { provider: process.env.API2_PROVIDER, key: process.env.API_KEY_2 },
];

// Load commands dynamically
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.name && cmd.execute) {
      client.commands.set(cmd.name, cmd);
    }
  }
}

async function testOpenAI(key) {
  try {
    const res = await axios.post('https://api.openai.com/v1/completions', {
      model: "text-davinci-003",
      prompt: "Say hello",
      max_tokens: 5,
    }, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function testTogetherAI(key) {
  try {
    const res = await axios.post('https://api.together.xyz/api/chat/conversation', {
      message: "Say hello",
    }, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}.`);

  for (let i = 0; i < apiKeys.length; i++) {
    const { provider, key } = apiKeys[i];
    if (!provider || !key) {
      console.log(`API key ${i+1} or provider missing - skipping test.`);
      continue;
    }
    let ok = false;
    if (provider.toLowerCase() === "openai") {
      ok = await testOpenAI(key);
    } else if (provider.toLowerCase() === "together") {
      ok = await testTogetherAI(key);
    }
    console.log(`API key ${i+1} (${provider}): ${ok ? "OK" : "FAILED"}`);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    await message.reply('There was an error executing that command.');
  }
});

client.login(token);
