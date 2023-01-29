const { MessageEmbed } = require("discord.js");
const { logMsg, isBlacklisted } = require("../utils");

module.exports = {
    name: "messageCreate",
    async execute(client, message) {
        if (message.author.bot) return;
        if (message.guild) return;

        if (message?.content) {
            if (!message?.content[0].match(/[a-zA-Z0-9]/)) return;
        }

        const isUserBlacklisted = await isBlacklisted({ userId: message.author.id, db: client.db })
        if (isUserBlacklisted) return message.reply({ content: client.error("You are blacklisted from using ModMail.") })

        // check if modmail thread exists
        const thread = await client.db.collection("modmailThread").findOne({ user: message.author.id, closed: false });
        if (thread) {
            if (!message?.content && !message?.attachments?.size) return await message.react("❌");
            const channel = client.channels.cache.get(thread.channel) || await client.channels.fetch(thread.channel);
            if (channel) {
                await logMsg({
                    channel,
                    content: message.content,
                    author: message.author,
                    color: "GREEN",
                    attachments: message.attachments,
                    db: client.db,
                    id: thread.id
                })
                await message.react("✅");
            }
            else {
                await client.db.collection("modmailThread").updateOne({ user: message.author.id, closed: false }, { $set: { closed: true } });
            }
        }
        else {
            if (!message?.content && !message?.attachments?.size) return await message.react("❌");
            const channel = await client.guild.channels.create(`modmail-${message.author.username}`, {
                type: "GUILD_TEXT",
                parent: process.env.CATEGORY
            }).catch(() => null);

            if (!channel) return message.reply("An error occurred while opening a thread. Please try again later.");

            const id = (BigInt(channel.id) >> 22n).toString().slice(0, 10);

            await client.db.collection("modmailThread").insertOne({
                user: message.author.id,
                channel: channel.id,
                closed: false,
                mods: [],
                createdAt: Date.now(),
                id
            })

            // send open message
            const msg = await message.author.send({ 
                content:`Your modmail thread has been opened - please wait for a moderator to respond.\n\n**Note:** If you want to **report a player**, **appeal a ban** or **report a vulnerability**, please use the appropriate support channels instead of ModMail.`,
                embeds: [
                    new MessageEmbed()
                        .setFooter({ text:`Need to close this thread? Use ${client.prefix}close`, iconURL: client.user.displayAvatarURL() })
                        .setColor("GREEN")
                ]
            }).catch(() => null);
            
            const roles = process.env.PING_ROLES.split(/, |,/g);

            await channel.send({ 
                content: `**${message.author.tag}** (<@${message.author.id}>) has opened a modmail thread.${!msg ? "\n\n:warning: I was unable to send a message to the user - they may have DMs disabled or left the server." : ""}${roles.length ? `\n\n${roles.map(r => `<@&${r}>`).join(" ")}` : ""}`,
            })

            await logMsg({
                channel,
                content: message.content,
                author: message.author,
                color: "GREEN",
                attachments: message.attachments,
                db: client.db,
                id,
                stickers: message.stickers
            })

        }
    }
}