const { MessageEmbed } = require("discord.js");
const { logMsg } = require("../utils");

module.exports = {
    name: "messageCreate",
    async execute(client, message) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!client.db) return;
        if (message.content.startsWith(client.prefix)) return; // ignore commands

        const thread = await client.db.collection("modmailThread").findOne({ channel: message.channel.id, closed: false });
        const role = message.member.roles.cache.filter(r => r.hoist).sort((a, b) => b.position - a.position).first();

        if (thread) {
            const user = await client.users.fetch(thread.user);
            await user.send({ 
                content: `**(${role ? role.name : "Staff Member"}) ${message.member.displayName || message.author.username}:**${message.content ? `\n> ${message.content}` : ``}`,
                embeds: message.embeds,
                files: message.attachments ? [...message.attachments.values()] : [],
                stickers: message.stickers ? [...message.stickers.values()] : []
            }).catch(() => null);

            await logMsg({
                content: message.content,
                author: message.author,
                color: "GREEN",
                attachments: message.attachments,
                stickers: message.stickers,
                db: client.db,
                id: thread.id,
                dontLog: true
            })

            await message.react("✅");
        }
    }
}