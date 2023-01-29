const { Client, Intents, WebhookClient, Collection } = require('discord.js');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
require('dotenv').config();

const intents = new Intents();
intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.DIRECT_MESSAGES
);

const client = new Client({ intents: intents, partials: ["MESSAGE", "CHANNEL"] });


// mongodb
const clientMongo = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });


// client stuff
client.commands = new Collection()
client.prefix = process.env.PREFIX
client.closing = new Collection()

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await clientMongo.connect();
    client.db = clientMongo.db(process.env.MONGO_DB);
    console.log("Connected to MongoDB");

    // set the guild
    client.guild = await client.guilds.fetch(process.env.GUILD).catch(() => null);
    if (!client.guild) console.log("Guild not found. Please check the GUILD environment variable.");
    else console.log(`Guild set to ${client.guild.name}`);

    client.user.setActivity(process.env.STATUS, { type: `PLAYING` });
});

client.error = (msg) => { return `${process.env?.ERROR_EMOJI ? process.env.ERROR_EMOJI : `❌`} ${msg}` }
client.success = (msg) => { return `${process.env?.SUCCESS_EMOJI ? process.env.SUCCESS_EMOJI : `✅`} ${msg}` }

// import commands and events
for (file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.name, cmd)
    console.log(`Loaded ${cmd.name}.`)
}
for (file of fs.readdirSync("./events").filter(f => f.endsWith(".js"))) {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => event.execute(client, ...args))
    console.log(`Loaded ${event.name}.`)
}

process.on('unhandledRejection', async error => {
    console.log(error);
    if (process.env.ERROR_LOG_WEBHOOK) {
        const webhookClient = new WebhookClient(process.env.ERROR_LOG_WEBHOOK);
        let payload = {
            content: `Error: \`\`\`\n${error}\`\`\``,
            username:`ModMail Error Logs`
        }
        if (process.env.ERROR_LOG_THREAD) payload.threadId = process.env.LOG_THREAD;
        await webhookClient.send(payload);
    }
});


// command handler
client.on("messageCreate", async message => {
    if (message.author.bot) return;
    // check if the message is a command
    if (message.content.startsWith(client.prefix)) {
        const args = message.content.slice(client.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        if (client.commands.has(command)) {
            client.commands.get(command).execute(client, message, args);
        }
    }
})

client.login(process.env.TOKEN);